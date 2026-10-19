import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { db } from "@/integrations/data/client";
import { useClinicalHistories } from "@/components/forms/clinical-histories";
import { errorMessage } from "@/components/agenda/agenda-ui";
import {
  CATEGORY_LABEL, MODALITY_LABEL, createAppointmentType, fetchProfessionals, updateAppointmentType,
  type Modality, type TipoCita, type TipoCitaCategory, type TipoCitaInput,
} from "@/components/agenda/agenda-api";

const MODES: Modality[] = ["sede", "domicilio", "telemedicina"];
const DURATIONS = [15, 20, 30, 40, 45, 60, 90, 120];
const NONE = "ninguno";
const MAX_SERVICES = 500;

const emptyInput = (): TipoCitaInput => ({
  codigo: null, nombre: "", categoria: "consulta", primeraVez: null, especialidad: null, duracionMin: 30, modalidades: ["sede"],
  requiereAutorizacion: false, controlaSesiones: false, esPyp: false, agendaEnLinea: false, servicioId: null, formularioId: null,
  color: null, activo: true, profesionalIds: [],
});

const toInput = ({ id: _id, servicio: _s, formulario: _f, ...rest }: TipoCita): TipoCitaInput => rest;

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <Label htmlFor={id} className="text-[13px] font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

interface AppointmentTypeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = nuevo tipo. */
  tipo: TipoCita | null;
}

/** Crear o editar un tipo de cita: reglas, cobertura y quiénes lo atienden. */
export function AppointmentTypeSheet({ open, onOpenChange, tipo }: AppointmentTypeSheetProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TipoCitaInput>(emptyInput());
  const set = (patch: Partial<TipoCitaInput>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (open) setForm(tipo ? toInput(tipo) : emptyInput());
  }, [open, tipo]);

  const professionals = useQuery({ queryKey: ["agenda", "profesionales"], queryFn: fetchProfessionals, enabled: open });
  const histories = useClinicalHistories();
  const services = useQuery({
    queryKey: ["agenda-config", "servicios"],
    enabled: open,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await db
        .from("tarifarios_servicios")
        .select("id, codigo_servicio, descripcion_servicio")
        .eq("activo", true)
        .order("codigo_servicio")
        .limit(MAX_SERVICES);
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; codigo_servicio: string; descripcion_servicio: string }[];
    },
  });

  const save = useMutation({
    mutationFn: () => (tipo ? updateAppointmentType(tipo.id, form) : createAppointmentType(form)),
    onSuccess: () => {
      toast.success(tipo ? "Tipo de cita actualizado" : "Tipo de cita creado");
      void queryClient.invalidateQueries({ queryKey: ["agenda", "tipos-cita"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const toggleMode = (m: Modality) => {
    const has = form.modalidades.includes(m);
    if (has && form.modalidades.length === 1) return;
    set({ modalidades: has ? form.modalidades.filter((x) => x !== m) : [...form.modalidades, m] });
  };
  const togglePro = (id: string, on: boolean) =>
    set({ profesionalIds: on ? [...form.profesionalIds, id] : form.profesionalIds.filter((x) => x !== id) });

  const activePros = (professionals.data ?? []).filter((p) => p.id && p.activo);
  const valid = form.nombre.trim().length >= 2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle>{tipo ? tipo.nombre : "Nuevo tipo de cita"}</SheetTitle>
          <SheetDescription>Define cuánto dura, cómo se atiende y quiénes lo atienden.</SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 content-start gap-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
            <div className="grid gap-1.5">
              <Label htmlFor="tc-name">Nombre</Label>
              <Input id="tc-name" value={form.nombre} onChange={(e) => set({ nombre: e.target.value })} maxLength={120} className="h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tc-code">Código</Label>
              <Input id="tc-code" value={form.codigo ?? ""} onChange={(e) => set({ codigo: e.target.value || null })} maxLength={20} className="h-10" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tc-cat">Categoría</Label>
              <Select value={form.categoria} onValueChange={(v) => set({ categoria: v as TipoCitaCategory })}>
                <SelectTrigger id="tc-cat" className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL) as TipoCitaCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tc-first">Primera vez o control</Label>
              <Select
                value={form.primeraVez === null ? NONE : form.primeraVez ? "si" : "no"}
                onValueChange={(v) => set({ primeraVez: v === NONE ? null : v === "si" })}
              >
                <SelectTrigger id="tc-first" className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No aplica</SelectItem>
                  <SelectItem value="si">Primera vez</SelectItem>
                  <SelectItem value="no">Control</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tc-duration">Duración</Label>
              <Select value={String(form.duracionMin)} onValueChange={(v) => set({ duracionMin: Number(v) })}>
                <SelectTrigger id="tc-duration" className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...new Set([...DURATIONS, form.duracionMin])].sort((a, b) => a - b).map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} minutos</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tc-specialty">Especialidad (opcional)</Label>
            <Input id="tc-specialty" value={form.especialidad ?? ""} onChange={(e) => set({ especialidad: e.target.value || null })} maxLength={120} className="h-10" />
          </div>

          <div className="grid gap-1.5">
            <Label>Modalidades</Label>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {MODES.map((m) => {
                const on = form.modalidades.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleMode(m)}
                    className={cn(
                      "h-8 rounded-lg text-[13px] font-medium transition-all duration-200",
                      on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {MODALITY_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="tc-service">Servicio que se factura</Label>
              <Select value={form.servicioId ?? NONE} onValueChange={(v) => set({ servicioId: v === NONE ? null : v })}>
                <SelectTrigger id="tc-service" className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Se elige al agendar</SelectItem>
                  {(services.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.codigo_servicio} · {s.descripcion_servicio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tc-history">Historia clínica</Label>
              <Select value={form.formularioId ?? NONE} onValueChange={(v) => set({ formularioId: v === NONE ? null : v })}>
                <SelectTrigger id="tc-history" className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>La habitual del profesional</SelectItem>
                  {(histories.data ?? []).map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="divide-y divide-border">
            <Toggle id="tc-auth" label="Requiere autorización" hint="La EPS debe autorizarla antes de atender." checked={form.requiereAutorizacion} onChange={(v) => set({ requiereAutorizacion: v })} />
            <Toggle id="tc-sessions" label="Controla sesiones" hint="Terapias con un número de sesiones ordenado." checked={form.controlaSesiones} onChange={(v) => set({ controlaSesiones: v })} />
            <Toggle id="tc-pyp" label="Promoción y prevención" hint="Cuenta en los indicadores de PyP." checked={form.esPyp} onChange={(v) => set({ esPyp: v })} />
            <Toggle id="tc-online" label="Agenda en línea" hint="El paciente podrá pedirla por su cuenta." checked={form.agendaEnLinea} onChange={(v) => set({ agendaEnLinea: v })} />
            <Toggle id="tc-active" label="Activo" hint="Los inactivos no aparecen al agendar." checked={form.activo} onChange={(v) => set({ activo: v })} />
          </div>

          <div className="grid gap-2">
            <div>
              <p className="text-[13px] font-medium">Quiénes lo atienden</p>
              <p className="text-xs text-muted-foreground">Si no eliges a nadie, lo atiende cualquier profesional con la modalidad.</p>
            </div>
            <div className="grid gap-0.5">
              {activePros.map((p) => {
                const id = p.id as string;
                return (
                  <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted">
                    <Checkbox checked={form.profesionalIds.includes(id)} onCheckedChange={(v) => togglePro(id, v === true)} />
                    <span className="min-w-0 flex-1 truncate text-[13px]">{p.nombre}</span>
                    <span className="truncate text-xs text-muted-foreground">{p.especialidad ?? ""}</span>
                  </label>
                );
              })}
              {!professionals.isLoading && activePros.length === 0 && <p className="text-xs text-muted-foreground">No hay profesionales activos.</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" className="h-9 rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="h-9 gap-2 rounded-full" disabled={!valid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
