import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CheckCircle2, Loader2, MoreHorizontal, Plus, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AreaField, ContractSection, FieldGrid, NumberField, SelectField, TextField } from "@/components/contracts/fields";
import { RowActions } from "@/components/kit/RowActions";
import { useConfirm } from "@/components/kit/useConfirm";
import { SimpleTable, StatusCell, primaryButtonClass, type SimpleColumn } from "@/components/kit/table";
import { useAuth } from "@/contexts/AuthContext";
import { InviteDialog, type InviteInput } from "@/components/tenancy/InviteDialog";
import { COMPANIES_PATH, LICENSE_TONE, formatDay } from "@/components/tenancy/company-format";
import {
  COUNTRY_LABEL, LICENSE_LABEL, ROLE_LABEL, createCompany, deliveryMessage, fetchPlatformCompany, invitationState,
  inviteCompanyAdmin, reactivateCompany, resendCompanyInvitation, revokeCompanyInvitation, suspendCompany, updateCompany,
  type CompanyEvent, type CompanyInput, type Member, type PendingInvitation, type PlatformCompanyDetail,
} from "@/components/tenancy/tenancy-api";

/** Formulario como texto (así se escribe); se convierte al guardar. */
interface CompanyForm {
  nombre: string;
  nit: string;
  pais: string;
  plan: string;
  sillas: string;
  licenciaInicio: string;
  licenciaFin: string;
  diasGracia: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  notas: string;
}

const EMPTY: CompanyForm = {
  nombre: "", nit: "", pais: "CO", plan: "", sillas: "", licenciaInicio: "", licenciaFin: "", diasGracia: "0",
  contactoNombre: "", contactoEmail: "", contactoTelefono: "", notas: "",
};

const toForm = (c: PlatformCompanyDetail): CompanyForm => ({
  nombre: c.nombre, nit: c.nit ?? "", pais: c.pais, plan: c.plan ?? "", sillas: c.sillas ? String(c.sillas) : "",
  licenciaInicio: c.licenciaInicio ?? "", licenciaFin: c.licenciaFin ?? "", diasGracia: String(c.diasGracia),
  contactoNombre: c.contactoNombre ?? "", contactoEmail: c.contactoEmail ?? "", contactoTelefono: c.contactoTelefono ?? "", notas: c.notas ?? "",
});

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

function toInput(f: CompanyForm): CompanyInput {
  return {
    nombre: f.nombre.trim(),
    nit: orNull(f.nit),
    pais: f.pais,
    plan: orNull(f.plan),
    sillas: f.sillas.trim() === "" ? null : Number(f.sillas),
    licenciaInicio: orNull(f.licenciaInicio),
    licenciaFin: orNull(f.licenciaFin),
    diasGracia: f.diasGracia.trim() === "" ? 0 : Number(f.diasGracia),
    contactoNombre: orNull(f.contactoNombre),
    contactoEmail: orNull(f.contactoEmail),
    contactoTelefono: orNull(f.contactoTelefono),
    notas: orNull(f.notas),
  };
}

/** Lo que falta o está mal antes de guardar (el servidor valida igual). */
function formIssues(f: CompanyForm): string[] {
  const issues: string[] = [];
  if (f.nombre.trim().length < 2) issues.push("el nombre de la empresa");
  if (f.sillas.trim() !== "" && !/^[1-9]\d*$/.test(f.sillas.trim())) issues.push("un número de sillas válido (entero mayor que cero)");
  if (!/^\d{0,3}$/.test(f.diasGracia.trim()) || Number(f.diasGracia) > 180) issues.push("días de gracia entre 0 y 180");
  if (f.licenciaInicio && f.licenciaFin && f.licenciaFin < f.licenciaInicio) issues.push("un fin de licencia posterior al inicio");
  return issues;
}

const EVENT_LABEL: Record<CompanyEvent["evento"], string> = {
  creada: "Empresa creada",
  actualizada: "Datos actualizados",
  suspendida: "Empresa suspendida",
  reactivada: "Empresa reactivada",
  activada: "Activada por su administrador",
};

const FIELD_LABEL: Record<string, string> = {
  nombre: "nombre", nit: "NIT", pais: "país", plan: "plan", sillas: "sillas", licencia_inicio: "inicio de licencia",
  licencia_fin: "fin de licencia", dias_gracia: "días de gracia", contacto_nombre: "contacto", contacto_email: "correo de contacto",
  contacto_telefono: "teléfono de contacto", notas: "notas",
};

const formatValue = (v: unknown) => (v === null || v === undefined || v === "" ? "vacío" : String(v));

/** Una línea legible por evento de la bitácora. */
function eventDetail(e: CompanyEvent): string {
  if (e.evento === "suspendida") return `Motivo: ${String(e.detalle.motivo ?? "")}`;
  if (e.evento === "activada") return `Administrador: ${String(e.detalle.administrador ?? "")}`;
  if (e.evento === "actualizada" && e.detalle.cambios && typeof e.detalle.cambios === "object") {
    return Object.entries(e.detalle.cambios as Record<string, { antes: unknown; despues: unknown }>)
      .map(([k, v]) => `${FIELD_LABEL[k] ?? k}: ${formatValue(v.antes)} → ${formatValue(v.despues)}`)
      .join(" · ");
  }
  return "";
}

const dateTime = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const USER_COLUMNS: SimpleColumn<Member>[] = [
  { id: "name", title: "Nombre", primary: true, cell: (m) => m.nombre || m.email },
  { id: "email", title: "Correo", cell: (m) => m.email },
  { id: "role", title: "Rol", cell: (m) => ROLE_LABEL[m.rol] ?? m.rol },
  {
    id: "status", title: "Estado",
    cell: (m) => <StatusCell tone={m.estado === "activo" ? "success" : "neutral"} text={m.estado === "activo" ? "Activo" : "Suspendido"} />,
  },
];

const INVITE_STATE = { enviada: "Enviada", sin_enviar: "Correo sin enviar", vencida: "Vencida" } as const;

/** Color del texto de estado en la cabecera (solo texto, sin punto ni cápsula). */
const TONE_TEXT: Record<string, string> = {
  success: "font-medium text-emerald-700 dark:text-emerald-400",
  warning: "font-medium text-amber-700 dark:text-amber-400",
  error: "font-medium text-destructive",
  info: "font-medium text-sky-700 dark:text-sky-400",
  neutral: "font-medium text-foreground",
};

/** Plataforma › Empresa: datos, licencia, sillas, administradores y bitácora. */
export default function PlatformCompanyPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "nueva";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPlatformAdmin, isLoading: sessionLoading } = useAuth();
  const [confirm, confirmDialog] = useConfirm();
  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [saved, setSaved] = useState<CompanyForm>(EMPTY);
  const [inviting, setInviting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["platform-company", id],
    queryFn: () => fetchPlatformCompany(id!),
    enabled: isPlatformAdmin && !isNew,
  });
  const company = query.data;

  useEffect(() => {
    if (!company) return;
    const next = toForm(company);
    setForm(next);
    setSaved(next);
  }, [company]);

  const issues = formIssues(form);
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  const run = useMutation({
    mutationFn: (work: () => Promise<string | void>) => work(),
    onSuccess: (message) => {
      if (message) toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["platform-company", id] });
      void queryClient.invalidateQueries({ queryKey: ["platform-companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!sessionLoading && !isPlatformAdmin) return <Navigate to="/app/home" replace />;

  const set = <K extends keyof CompanyForm>(key: K) => (value: CompanyForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = () =>
    run.mutate(async () => {
      if (isNew) {
        const { id: newId } = await createCompany(toInput(form));
        navigate(`${COMPANIES_PATH}/${newId}`, { replace: true });
        return "Empresa creada. Ahora invita a su administrador.";
      }
      // Solo lo que cambió: la bitácora guarda cada cambio con su valor anterior.
      const current = toInput(form);
      const before = toInput(saved);
      const changes = Object.fromEntries(
        Object.entries(current).filter(([k, v]) => before[k as keyof CompanyInput] !== v),
      ) as Partial<CompanyInput>;
      await updateCompany(id!, changes);
      return "Cambios guardados.";
    });

  const invite = async (input: InviteInput) => {
    const { enviada } = await inviteCompanyAdmin(id!, input.email);
    (enviada ? toast.success : toast.warning)(deliveryMessage(enviada));
    void queryClient.invalidateQueries({ queryKey: ["platform-company", id] });
  };

  const suspend = () =>
    run.mutate(async () => {
      await suspendCompany(id!, reason.trim());
      setSuspending(false);
      setReason("");
      return "Empresa suspendida. Sus usuarios ya no pueden entrar.";
    });

  const reactivate = async () => {
    const ok = await confirm({
      title: `¿Reactivar ${company?.nombre}?`,
      description: "Sus usuarios vuelven a entrar si la licencia está vigente o en periodo de gracia.",
      confirmLabel: "Reactivar",
    });
    if (ok) run.mutate(async () => (await reactivateCompany(id!), "Empresa reactivada."));
  };

  const revoke = async (inv: PendingInvitation) => {
    const ok = await confirm({
      title: "¿Revocar la invitación?",
      description: `El enlace enviado a ${inv.email} dejará de funcionar y libera su silla.`,
      confirmLabel: "Revocar",
      destructive: true,
    });
    if (ok) run.mutate(async () => (await revokeCompanyInvitation(inv.id), "Invitación revocada."));
  };

  if (!isNew && query.isLoading) {
    return (
      <div className="mx-auto grid max-w-4xl gap-4 py-6" aria-busy="true">
        <Skeleton className="h-8 w-72" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-card" />)}
      </div>
    );
  }
  if (!isNew && query.error) {
    return <p className="py-16 text-center text-sm text-destructive">No se pudo cargar la empresa: {(query.error as Error).message}</p>;
  }

  const license = company?.licencia;
  const seatsFull = !!company?.sillas && company.sillasUsadas + company.invitacionesAbiertas >= company.sillas;

  const inviteColumns: SimpleColumn<PendingInvitation>[] = [
    { id: "email", title: "Invitación a", primary: true, cell: (i) => i.email },
    { id: "role", title: "Rol", cell: (i) => ROLE_LABEL[i.rol] ?? i.rol },
    { id: "expires", title: "Vence", cell: (i) => dateTime.format(new Date(i.expiraEn)) },
    {
      id: "state", title: "Estado",
      cell: (i) => {
        const st = invitationState(i);
        return <StatusCell tone={st === "enviada" ? "info" : st === "vencida" ? "error" : "warning"} text={INVITE_STATE[st]} />;
      },
    },
    {
      id: "actions", title: "", className: "w-12",
      cell: (i) => (
        <RowActions
          name={i.email}
          menu={[
            { title: "Reenviar invitación", icon: Send, onClick: () => run.mutate(async () => deliveryMessage((await resendCompanyInvitation(i.id)).enviada)) },
            { title: "Revocar invitación", icon: XCircle, onClick: () => void revoke(i) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-4 py-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="ghost" size="icon" aria-label="Volver a empresas" onClick={() => navigate(COMPANIES_PATH)} className="h-9 w-9 rounded-full text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{isNew ? "Nueva empresa" : company?.nombre}</h1>
          {license && (
            <p className="text-[13px] text-muted-foreground">
              <span className={TONE_TEXT[LICENSE_TONE[license.estado]]}>{LICENSE_LABEL[license.estado]}</span>
              {license.graciaHasta && <span> · acceso hasta el {formatDay(license.graciaHasta)}</span>}
              {company?.licenciaFin && !license.graciaHasta && <span> · licencia hasta el {formatDay(company.licenciaFin)}</span>}
            </p>
          )}
        </div>
        <Button size="sm" className="h-8 text-[13px]" disabled={run.isPending || issues.length > 0 || (!isNew && !dirty)} onClick={save}>
          {run.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {isNew ? "Crear empresa" : "Guardar cambios"}
        </Button>
        {company && (company.estado === "activa" || company.estado === "suspendida") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Más acciones" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {company.estado === "activa" ? (
                <DropdownMenuItem className="gap-2 text-[13px] text-destructive focus:text-destructive" onSelect={() => setSuspending(true)}>
                  <Ban className="h-4 w-4" />
                  Suspender empresa
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="gap-2 text-[13px]" onSelect={() => void reactivate()}>
                  <CheckCircle2 className="h-4 w-4" />
                  Reactivar empresa
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {company?.estado === "suspendida" && (
        <p className="rounded-tile bg-destructive/[0.06] px-4 py-3 text-[13px]">
          Suspendida: {company.motivoSuspension}. Nadie de la empresa puede entrar; sus datos se conservan.
        </p>
      )}
      {issues.length > 0 && dirty && <p className="text-[13px] text-muted-foreground">Falta: {issues.join(", ")}.</p>}

      <ContractSection id="empresa" title="Empresa">
        <TextField id="c-nombre" label="Nombre" required value={form.nombre} onChange={set("nombre")} />
        <FieldGrid>
          <TextField id="c-nit" label="NIT" value={form.nit} onChange={set("nit")} />
          <SelectField
            id="c-pais"
            label="País"
            value={form.pais}
            onChange={set("pais")}
            options={Object.entries(COUNTRY_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </FieldGrid>
      </ContractSection>

      <ContractSection
        id="licencia"
        title="Licencia"
        description="Sin fecha de fin, la licencia no vence. Pasado el fin, la empresa conserva el acceso durante los días de gracia; después se bloquea y sus datos se conservan."
      >
        <FieldGrid>
          <TextField id="c-plan" label="Plan" value={form.plan} onChange={set("plan")} placeholder="Ej.: Profesional" />
          <NumberField
            id="c-sillas"
            label="Sillas"
            value={form.sillas}
            onChange={set("sillas")}
            suffix="usuarios"
            help={
              company
                ? `${company.sillasUsadas} activos y ${company.invitacionesAbiertas} invitaciones abiertas. Vacío = sin tope.`
                : "Usuarios activos que puede tener; las invitaciones abiertas reservan silla. Vacío = sin tope."
            }
          />
        </FieldGrid>
        <FieldGrid cols={3}>
          <TextField id="c-inicio" label="Inicio" type="date" value={form.licenciaInicio} onChange={set("licenciaInicio")} />
          <TextField id="c-fin" label="Fin" type="date" value={form.licenciaFin} onChange={set("licenciaFin")} />
          <NumberField id="c-gracia" label="Días de gracia" value={form.diasGracia} onChange={set("diasGracia")} suffix="días" />
        </FieldGrid>
      </ContractSection>

      <ContractSection id="contacto" title="Contacto comercial">
        <FieldGrid cols={3}>
          <TextField id="c-contacto" label="Nombre" value={form.contactoNombre} onChange={set("contactoNombre")} />
          <TextField id="c-correo" label="Correo" type="email" value={form.contactoEmail} onChange={set("contactoEmail")} />
          <TextField id="c-telefono" label="Teléfono" value={form.contactoTelefono} onChange={set("contactoTelefono")} />
        </FieldGrid>
        <AreaField id="c-notas" label="Notas" value={form.notas} onChange={set("notas")} placeholder="Condiciones comerciales, acuerdos, observaciones…" />
      </ContractSection>

      {company && (
        <ContractSection
          id="usuarios"
          title="Administradores y usuarios"
          description="El administrador recibe un enlace de un solo uso para crear su cuenta; luego invita a su propio personal desde Configuración."
        >
          <SimpleTable
            columns={USER_COLUMNS}
            rows={company.usuarios}
            rowKey={(m) => m.userId}
            empty="Aún no hay usuarios. Invita al administrador de la empresa."
            toolbar={
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-muted-foreground">
                  {company.sillas ? `${company.sillasUsadas + company.invitacionesAbiertas} de ${company.sillas} sillas en uso` : "Sin tope de sillas"}
                </p>
                <Button
                  size="sm"
                  className={primaryButtonClass}
                  disabled={company.estado === "suspendida" || seatsFull}
                  title={seatsFull ? "No hay sillas libres: amplía las sillas de la licencia." : undefined}
                  onClick={() => setInviting(true)}
                >
                  <Plus className="h-4 w-4" />
                  Invitar administrador
                </Button>
              </div>
            }
          />
          {company.invitaciones.length > 0 && <SimpleTable columns={inviteColumns} rows={company.invitaciones} rowKey={(i) => i.id} />}
        </ContractSection>
      )}

      {company && (
        <ContractSection id="bitacora" title="Bitácora" description="Cada cambio de la empresa y su licencia, con quién lo hizo. No se edita ni se borra.">
          <ol className="grid gap-3">
            {company.eventos.map((e) => (
              <li key={e.id} className="grid gap-0.5 text-[13px]">
                <p>
                  <span className="font-medium">{EVENT_LABEL[e.evento] ?? e.evento}</span>
                  <span className="text-muted-foreground"> · {dateTime.format(new Date(e.fecha))}{e.actor ? ` · ${e.actor}` : ""}</span>
                </p>
                {eventDetail(e) && <p className="text-muted-foreground">{eventDetail(e)}</p>}
              </li>
            ))}
          </ol>
        </ContractSection>
      )}

      <InviteDialog kind="admin" open={inviting} onOpenChange={setInviting} onSubmit={invite} />

      <Dialog
        open={suspending}
        onOpenChange={(open) => {
          setSuspending(open);
          if (!open) setReason("");
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Suspender {company?.nombre}</DialogTitle>
            <DialogDescription>Nadie de la empresa podrá entrar hasta que la reactives. Sus datos se conservan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="suspend-reason">Motivo</Label>
            <Textarea id="suspend-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej.: mora de 60 días en el pago de la licencia" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspending(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={run.isPending || reason.trim().length < 5} onClick={suspend}>
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}
