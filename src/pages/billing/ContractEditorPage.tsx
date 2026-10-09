import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/kit/useConfirm";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AreaField, ContractSection, FieldGrid, TextField } from "@/components/contracts/fields";
import { activationIssues, displayStatus, STATUS_LABEL, type StoredStatus } from "@/components/contracts/contract-model";
import { childIssues, emptyContractForm, invalidNumber, NUMBER_FIELD_LABEL, type ContractForm, type NewPayer } from "@/components/contracts/contract-form";
import {
  fetchContract, fetchPayers, fetchSites, fetchTariffManuals, fetchUvb, saveContract, saveUvb, setContractStatus,
} from "@/components/contracts/contract-api";
import { GeneralSection, PayerSection } from "@/components/contracts/sections/PayerAndGeneral";
import { TariffSection } from "@/components/contracts/sections/TariffSection";
import { AccountingSection, BillingSection, CareSection, ModalitySection } from "@/components/contracts/sections/ConditionsSections";

const SECTIONS = [
  { id: "pagador", title: "Pagador" },
  { id: "general", title: "Datos generales" },
  { id: "tarifas", title: "Tarifas" },
  { id: "modalidad", title: "Modalidad" },
  { id: "facturacion", title: "Facturación y pagos" },
  { id: "atencion", title: "Atención y órdenes" },
  { id: "contabilidad", title: "Contabilidad" },
  { id: "revision", title: "Revisión" },
];

const STATUS_TEXT: Record<string, string> = {
  borrador: "text-muted-foreground", por_iniciar: "text-sky-700 dark:text-sky-400", vigente: "text-green-700 dark:text-green-400",
  por_vencer: "text-amber-700 dark:text-amber-400", vencido: "text-red-700 dark:text-red-400",
  bloqueado: "text-muted-foreground", terminado: "text-muted-foreground", liquidado: "text-muted-foreground",
};

const LIST_PATH = "/app/facturacion/convenios";
const YEAR = new Date().getFullYear();
const today = () => new Date().toISOString().slice(0, 10);

/** Crear o editar un contrato con pagador. Un contrato activo solo cambia con un otrosí. */
export default function ContractEditorPage() {
  const { id: routeId } = useParams();
  const id = routeId && routeId !== "nuevo" ? routeId : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin");
  const [confirm, confirmDialog] = useConfirm();

  const contractQuery = useQuery({ queryKey: ["contract", id], queryFn: () => fetchContract(id!), enabled: !!id });
  const payersQuery = useQuery({ queryKey: ["payers"], queryFn: fetchPayers });
  const manualsQuery = useQuery({ queryKey: ["tariff-manuals"], queryFn: fetchTariffManuals });
  const sitesQuery = useQuery({ queryKey: ["sites"], queryFn: fetchSites });
  const uvbQuery = useQuery({ queryKey: ["uvb", YEAR], queryFn: () => fetchUvb(YEAR) });

  const [form, setForm] = useState<ContractForm>(emptyContractForm);
  const [newPayer, setNewPayer] = useState<NewPayer | null>(null);
  const [otrosiOpen, setOtrosiOpen] = useState(false);
  const [otrosi, setOtrosi] = useState({ numero: "", fecha: today(), descripcion: "" });
  const loadedRef = useRef<string>("");

  // Al cargar el contrato, el formulario arranca con sus datos.
  useEffect(() => {
    if (!contractQuery.data) return;
    setForm(contractQuery.data.form);
    loadedRef.current = JSON.stringify(contractQuery.data.form);
  }, [contractQuery.data]);

  const row = contractQuery.data?.row;
  const stored: StoredStatus = row?.estado ?? "borrador";
  const isDraft = stored === "borrador";
  const closed = stored === "terminado" || stored === "liquidado";
  // Solo consulta: sin rol de administración o con el contrato ya cerrado.
  const readOnly = !canEdit || closed;
  const status = row ? displayStatus(row) : "borrador";
  const dirty = !id || JSON.stringify(form) !== loadedRef.current || !!newPayer;
  const issues = useMemo(
    () => activationIssues({ ...form, pagador_id: form.pagador_id ?? (newPayer?.nombre.trim() ? "nuevo" : null), paquetes: form.paquetes.filter((p) => p.codigo && p.valor).length }),
    [form, newPayer],
  );

  const set: <K extends keyof ContractForm>(key: K, value: ContractForm[K]) => void = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const scrollRef = useRef<HTMLDivElement>(null);
  const goTo = (sectionId: string) => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const saveMutation = useMutation({
    mutationFn: (args: { estado: string; withOtrosi: boolean }) =>
      saveContract({
        id,
        expectedVersion: row?.version ?? null,
        form,
        estado: args.estado,
        newPayer: newPayer?.nombre.trim() ? newPayer : null,
        otrosi: args.withOtrosi ? otrosi : null,
      }),
    onSuccess: ({ id: savedId }, args) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", savedId] });
      queryClient.invalidateQueries({ queryKey: ["payers"] });
      setNewPayer(null);
      setOtrosiOpen(false);
      toast.success(args.withOtrosi ? `Otrosí ${otrosi.numero} registrado` : args.estado === "activo" && isDraft ? "Contrato activado" : "Contrato guardado");
      setOtrosi({ numero: "", fecha: today(), descripcion: "" });
      if (!id) navigate(`${LIST_PATH}/${savedId}`, { replace: true });
    },
    // Nada quedó a medias (el servidor guarda todo o nada); se recarga por si otro usuario cambió el contrato.
    onError: (e: Error) => {
      if (id) queryClient.invalidateQueries({ queryKey: ["contract", id] });
      toast.error("No se pudo guardar el contrato", { description: e.message });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (estado: string) => setContractStatus(id!, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error("No se pudo cambiar el estado", { description: e.message }),
  });

  const validNumbers = () => {
    const bad = invalidNumber(form);
    if (bad) {
      toast.error(`Revisa «${NUMBER_FIELD_LABEL[bad]}»: debe ser un número válido.`);
      return false;
    }
    const rows = childIssues(form);
    if (rows.length) toast.error("Revisa las tarifas", { description: rows.join(" · ") });
    return rows.length === 0;
  };
  const saveDraft = () => validNumbers() && saveMutation.mutate({ estado: "borrador", withOtrosi: false });
  const activate = () => validNumbers() && issues.length === 0 && saveMutation.mutate({ estado: "activo", withOtrosi: false });
  const saveWithOtrosi = () => {
    if (!validNumbers()) return;
    if (issues.length) { toast.error("El contrato quedaría incompleto", { description: issues.join(" · ") }); return; }
    setOtrosiOpen(true);
  };
  const changeStatus = async (estado: string, title: string, description: string) => {
    if (await confirm({ title, description, confirmLabel: title.replace("¿", "").replace("?", ""), destructive: estado !== "activo" })) statusMutation.mutate(estado);
  };

  if (id && contractQuery.isLoading) {
    return (
      <div className="mx-auto grid max-w-5xl gap-4 py-6" aria-busy="true">
        <Skeleton className="h-8 w-72" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-card" />)}
      </div>
    );
  }
  if (id && contractQuery.error) {
    return <p className="py-16 text-center text-sm text-destructive">No se pudo cargar el contrato: {(contractQuery.error as Error).message}</p>;
  }

  const saving = saveMutation.isPending;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Encabezado: volver, nombre y estado; a la derecha las acciones según el estado. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <Button variant="ghost" size="icon" aria-label="Volver a contratos" onClick={() => navigate(LIST_PATH)} className="h-9 w-9 rounded-full text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{id ? form.nombre_convenio || "Contrato" : "Nuevo contrato"}</h1>
          <p className="text-[13px]">
            <span className={cn("font-semibold", STATUS_TEXT[status])}>{STATUS_LABEL[status]}</span>
            {row && row.version > 1 && <span className="text-muted-foreground"> · versión {row.version}</span>}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            {isDraft ? (
              <>
                <Button variant="outline" size="sm" className="h-8 text-[13px]" disabled={saving} onClick={saveDraft}>Guardar borrador</Button>
                <Button size="sm" className="h-8 text-[13px]" disabled={saving || issues.length > 0} onClick={activate} title={issues.length ? `Falta: ${issues.join(", ")}` : undefined}>
                  {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Activar contrato
                </Button>
              </>
            ) : !closed ? (
              <Button size="sm" className="h-8 text-[13px]" disabled={saving || !dirty} onClick={saveWithOtrosi}>Guardar cambios con otrosí</Button>
            ) : null}
            {id && !isDraft && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Más acciones" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  {stored === "activo" && <DropdownMenuItem className="text-[13px]" onClick={() => changeStatus("bloqueado", "¿Bloquear el contrato?", "No se podrá usar en admisiones ni facturación hasta reactivarlo.")}>Bloquear</DropdownMenuItem>}
                  {stored === "bloqueado" && <DropdownMenuItem className="text-[13px]" onClick={() => changeStatus("activo", "¿Reactivar el contrato?", "Vuelve a estar disponible según sus fechas de vigencia.")}>Reactivar</DropdownMenuItem>}
                  {(stored === "activo" || stored === "bloqueado") && <DropdownMenuItem className="text-[13px]" onClick={() => changeStatus("terminado", "¿Terminar el contrato?", "Queda pendiente de liquidar: en el plazo pactado o, si no hay, en 4 meses (Decreto 441, art. 2.5.3.4.6.2). Si atiende pacientes crónicos o de alto costo, se les debe avisar con 30 días.")}>Terminar</DropdownMenuItem>}
                  {stored === "terminado" && <DropdownMenuItem className="text-[13px]" onClick={() => changeStatus("liquidado", "¿Marcar como liquidado?", "Confirma que el acta de liquidación está firmada.")}>Marcar como liquidado</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-6 pb-4 md:grid-cols-[200px_minmax(0,1fr)]">
        {/* Navegación por secciones: siempre a la vista. */}
        <nav aria-label="Secciones del contrato" className="hidden md:block">
          <ol className="grid gap-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => goTo(s.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {s.title}
                  {s.id === "revision" && issues.length > 0 && <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{issues.length}</span>}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div ref={scrollRef} className="min-h-0 overflow-y-auto pr-1">
          <div className="mx-auto grid max-w-4xl gap-4 pb-10">
            {!canEdit && (
              <p className="rounded-tile bg-muted/60 px-4 py-3 text-[13px]">Solo un administrador puede crear o modificar contratos. Puedes consultarlo.</p>
            )}
            {closed && (
              <p className="rounded-tile bg-muted/60 px-4 py-3 text-[13px]">Contrato {stored}: queda solo para consulta. Su historial y sus otrosíes se conservan.</p>
            )}
            {!isDraft && !closed && canEdit && (
              <p className="rounded-tile bg-primary/[0.06] px-4 py-3 text-[13px]">
                Este contrato ya está activo: cada cambio se guarda como una <span className="font-semibold">versión nueva</span> y pide el otrosí que lo respalda.
              </p>
            )}
            <fieldset disabled={readOnly} className="contents">
            <PayerSection form={form} set={set} payers={payersQuery.data ?? []} newPayer={newPayer} setNewPayer={setNewPayer} locked={!isDraft} />
            <GeneralSection form={form} set={set} sites={sitesQuery.data ?? []} />
            <TariffSection
              form={form} set={set} manuals={manualsQuery.data ?? []} year={YEAR} uvb={uvbQuery.data ?? null} canEditUvb={canEdit}
              onSaveUvb={async (value, source) => {
                try {
                  await saveUvb(YEAR, value, source);
                  await queryClient.invalidateQueries({ queryKey: ["uvb", YEAR] });
                  toast.success(`UVB ${YEAR} registrada`);
                } catch (e) {
                  toast.error("No se pudo guardar la UVB", { description: (e as Error).message });
                }
              }}
            />
            <ModalitySection form={form} set={set} />
            <BillingSection form={form} set={set} />
            <CareSection form={form} set={set} />
            <AccountingSection form={form} set={set} />
            </fieldset>

            <ContractSection id="revision" title="Revisión" description="Lo que exige el Decreto 441 de 2022 para activar el contrato según su modalidad.">
              {issues.length === 0 ? (
                <p className="text-[14px] font-medium text-green-700 dark:text-green-400">{isDraft ? "Completo: el contrato se puede activar." : "Completo: cumple lo mínimo de su modalidad."}</p>
              ) : (
                <div className="grid gap-2">
                  <p className="text-[14px] font-medium text-amber-700 dark:text-amber-400">{isDraft ? "Falta para activarlo:" : "Falta para que quede completo:"}</p>
                  <ul className="grid gap-1 pl-5 text-[13.5px] [list-style:disc]">
                    {issues.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              )}
              {(contractQuery.data?.otrosies.length ?? 0) > 0 && (
                <div className="grid gap-2 border-t border-border pt-4">
                  <h3 className="text-[15px] font-semibold">Otrosíes</h3>
                  <ol className="grid">
                    {contractQuery.data!.otrosies.map((o) => (
                      <li key={o.id} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-t border-border py-2 text-[13px] first:border-t-0">
                        <span className="tabular-nums text-muted-foreground">{o.fecha}</span>
                        <span><span className="font-semibold">Otrosí {o.numero}</span>{o.version_resultante ? ` · versión ${o.version_resultante}` : ""} — {o.descripcion}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </ContractSection>
          </div>
        </div>
      </div>

      <Dialog open={otrosiOpen} onOpenChange={(o) => !saving && setOtrosiOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar otrosí</DialogTitle>
            <DialogDescription>El contrato está activo: los cambios se guardan como versión nueva respaldada por este otrosí.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <FieldGrid>
              <TextField id="otrosi-number" label="Número del otrosí" required value={otrosi.numero} onChange={(v) => setOtrosi((o) => ({ ...o, numero: v }))} />
              <TextField id="otrosi-date" type="date" label="Fecha" required value={otrosi.fecha} onChange={(v) => setOtrosi((o) => ({ ...o, fecha: v }))} />
            </FieldGrid>
            <AreaField id="otrosi-desc" label="Qué cambia" required value={otrosi.descripcion} onChange={(v) => setOtrosi((o) => ({ ...o, descripcion: v }))} placeholder="Ej.: se prorroga la vigencia hasta el 31 de diciembre y se ajustan tarifas" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOtrosiOpen(false)} disabled={saving}>Cancelar</Button>
            <Button
              disabled={saving || !otrosi.numero.trim() || !otrosi.fecha || otrosi.descripcion.trim().length < 10}
              onClick={() => saveMutation.mutate({ estado: stored, withOtrosi: true })}
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Guardar con otrosí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}
