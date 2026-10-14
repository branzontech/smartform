import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, ShieldCheck, UserCheck, UserX, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RowActions, type RowAction } from "@/components/kit/RowActions";
import { useConfirm } from "@/components/kit/useConfirm";
import {
  DataTable, StatusCell, TableToolbar, primaryButtonClass, useDataTable,
  type StatusTone, type TableColumn, type TableFilter, type TableSegment,
} from "@/components/kit/table";
import { useAuth } from "@/contexts/AuthContext";
import { InviteDialog, type InviteInput } from "./InviteDialog";
import {
  ROLE_LABEL, STAFF_ROLES, deliveryMessage, fetchCompanyUsers, invitationState, inviteMember,
  resendMemberInvitation, revokeMemberInvitation, updateMember, type StaffRole,
} from "./tenancy-api";

/** Una fila: un miembro o una invitación abierta (aún sin aceptar). */
interface UserRow {
  key: string;
  kind: "miembro" | "invitacion";
  id: string;
  nombre: string;
  email: string;
  rol: string;
  status: "activo" | "suspendido" | "enviada" | "sin_enviar" | "vencida";
  fecha: string;
}

const STATUS: Record<UserRow["status"], { text: string; tone: StatusTone }> = {
  activo: { text: "Activo", tone: "success" },
  suspendido: { text: "Suspendido", tone: "neutral" },
  enviada: { text: "Invitación enviada", tone: "info" },
  sin_enviar: { text: "Correo sin enviar", tone: "warning" },
  vencida: { text: "Invitación vencida", tone: "error" },
};

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });

const COLUMNS: TableColumn<UserRow>[] = [
  { id: "name", title: "Nombre", value: (r) => r.nombre, primary: true, alwaysVisible: true, className: "min-w-[200px]" },
  { id: "email", title: "Correo", value: (r) => r.email },
  { id: "role", title: "Rol", value: (r) => ROLE_LABEL[r.rol] ?? r.rol },
  { id: "date", title: "Desde", value: (r) => r.fecha, cell: (r) => shortDate.format(new Date(r.fecha)), className: "tabular-nums" },
  { id: "status", title: "Estado", value: (r) => STATUS[r.status].text, flush: true, cell: (r) => <StatusCell tone={STATUS[r.status].tone} text={STATUS[r.status].text} /> },
];

const FILTERS: TableFilter<UserRow>[] = [{ id: "role", title: "Rol", value: (r) => ROLE_LABEL[r.rol] ?? r.rol }];

const SEGMENTS: TableSegment<UserRow>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "active", title: "Activos", match: (r) => r.status === "activo" },
  { id: "invited", title: "Invitados", match: (r) => r.kind === "invitacion" },
  { id: "suspended", title: "Suspendidos", match: (r) => r.status === "suspendido" },
];

const QUERY_KEY = ["company-users"];

/** Configuración › Usuarios y permisos: personal de la empresa activa e invitaciones. */
export function CompanyUsers() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [inviting, setInviting] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const isAdmin = hasRole("admin");

  const { data, isLoading, error } = useQuery({ queryKey: QUERY_KEY, queryFn: fetchCompanyUsers, enabled: isAdmin });
  const rows: UserRow[] = [
    ...(data?.invitaciones ?? []).map((i) => ({
      key: `i-${i.id}`, kind: "invitacion" as const, id: i.id, nombre: i.email, email: i.email, rol: i.rol,
      status: invitationState(i), fecha: i.creadaEn,
    })),
    ...(data?.miembros ?? []).map((m) => ({
      key: `m-${m.userId}`, kind: "miembro" as const, id: m.userId, nombre: m.nombre || m.email, email: m.email, rol: m.rol,
      status: m.estado, fecha: m.desde,
    })),
  ];
  const t = useDataTable({ id: "config.company-users.v1", rows, columns: COLUMNS, rowKey: (r) => r.key, filters: FILTERS, segments: SEGMENTS });

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const action = useMutation({
    mutationFn: (work: () => Promise<string>) => work(),
    onSuccess: (message) => {
      toast.success(message);
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invite = async (input: InviteInput) => {
    if (input.kind !== "member") return;
    const { enviada } = await inviteMember(input.email, input.rol);
    (enviada ? toast.success : toast.warning)(deliveryMessage(enviada));
    void refresh();
  };

  const menuFor = (r: UserRow): RowAction[] => {
    if (r.kind === "invitacion") {
      return [
        { title: "Reenviar invitación", icon: Send, onClick: () => action.mutate(async () => deliveryMessage((await resendMemberInvitation(r.id)).enviada)) },
        {
          title: "Revocar invitación", icon: XCircle,
          onClick: async () => {
            const ok = await confirm({
              title: "¿Revocar la invitación?",
              description: `El enlace enviado a ${r.email} dejará de funcionar.`,
              confirmLabel: "Revocar",
              destructive: true,
            });
            if (ok) action.mutate(async () => (await revokeMemberInvitation(r.id), "Invitación revocada."));
          },
        },
      ];
    }
    if (r.id === user?.id) return [];
    const roles: RowAction[] = STAFF_ROLES.filter((role) => role !== r.rol).map((role: StaffRole) => ({
      title: `Cambiar a ${ROLE_LABEL[role].toLowerCase()}`,
      icon: ShieldCheck,
      onClick: () => action.mutate(async () => (await updateMember(r.id, { rol: role }), "Rol actualizado.")),
    }));
    const status: RowAction =
      r.status === "suspendido"
        ? { title: "Reactivar acceso", icon: UserCheck, onClick: () => action.mutate(async () => (await updateMember(r.id, { estado: "activo" }), "Acceso reactivado.")) }
        : {
            title: "Suspender acceso", icon: UserX,
            onClick: async () => {
              const ok = await confirm({
                title: "¿Suspender el acceso?",
                description: `${r.nombre} no podrá entrar a esta empresa hasta que lo reactives. Sus registros se conservan.`,
                confirmLabel: "Suspender",
                destructive: true,
              });
              if (ok) action.mutate(async () => (await updateMember(r.id, { estado: "suspendido" }), "Acceso suspendido."));
            },
          };
    return [...roles, status];
  };

  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Solo un administrador de la empresa puede gestionar usuarios.</p>;
  }

  return (
    <div className="space-y-4">
      <DataTable
        t={t}
        loading={isLoading}
        toolbar={
          <TableToolbar
            t={t}
            name={["usuario", "usuarios"]}
            placeholder="Buscar por nombre o correo"
            fileName="usuarios"
            actions={
              <Button size="sm" className={primaryButtonClass} onClick={() => setInviting(true)}>
                <Plus className="h-4 w-4" />
                Invitar usuario
              </Button>
            }
          />
        }
        actions={(r) => {
          const menu = menuFor(r);
          return menu.length ? <RowActions name={r.nombre} menu={menu} /> : null;
        }}
        empty={error ? `No se pudieron cargar los usuarios: ${(error as Error).message}` : "Aún no hay usuarios. Invita al primero con «Invitar usuario»."}
      />
      <InviteDialog kind="member" open={inviting} onOpenChange={setInviting} onSubmit={invite} />
      {confirmDialog}
    </div>
  );
}
