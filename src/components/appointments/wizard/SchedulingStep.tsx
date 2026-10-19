import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { db } from "@/integrations/data/client";
import { errorMessage } from "@/components/agenda/agenda-ui";
import { fetchAppointmentTypes, fetchProfessionals, today } from "@/components/agenda/agenda-api";
import { previewPlan, type PlanCita } from "@/components/agenda/plans-api";
import { planMissing, recurrenceOf, type NeedData, type PickedSlot, type PlanState } from "./wizard-model";
import { SuggestionList } from "./SuggestionList";
import { ProfessionalDays } from "./ProfessionalDays";
import { RecurrenceForm } from "./RecurrenceForm";
import { PlanPreview } from "./PlanPreview";

export type SchedulingMode = "una" | "plan";

interface SchedulingStepProps {
  patientId: string;
  need: NeedData;
  mode: SchedulingMode;
  onModeChange: (mode: SchedulingMode) => void;
  value: PickedSlot | null;
  onChange: (slot: PickedSlot | null) => void;
  plan: PlanState;
  onPlanChange: (plan: PlanState) => void;
  /** Datos de la cita para revisar las sesiones del plan. */
  planCita: PlanCita;
}

type View = "sugeridos" | "profesional";
const MODES: [SchedulingMode, string][] = [
  ["una", "Una cita"],
  ["plan", "Plan de sesiones"],
];
const VIEWS: [View, string][] = [
  ["sugeridos", "Primeros cupos"],
  ["profesional", "Por profesional"],
];
const ALL = "todas";
const surface = "rounded-card bg-card p-5 shadow-card dark:border dark:border-border dark:shadow-none";

function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-8 rounded-lg px-3 text-[13px] font-medium transition-all duration-200",
            value === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Paso «Cuándo y con quién»: una cita (primeros cupos o semana de un profesional) o un plan de sesiones. */
export function SchedulingStep({ patientId, need, mode, onModeChange, value, onChange, plan, onPlanChange, planCita }: SchedulingStepProps) {
  const [view, setView] = useState<View>("sugeridos");
  const [especialidad, setEspecialidad] = useState<string | null>(need.especialidad);
  const [sedeId, setSedeId] = useState<string | null>(null);
  const [desde, setDesde] = useState(need.fechaDeseada && need.fechaDeseada > today() ? need.fechaDeseada : today());

  const professionalsQuery = useQuery({ queryKey: ["agenda", "profesionales"], queryFn: fetchProfessionals });
  const types = useQuery({ queryKey: ["agenda", "tipos-cita", "activos"], queryFn: () => fetchAppointmentTypes(true), staleTime: 5 * 60_000 });
  const sedes = useQuery({
    queryKey: ["agendar", "sedes"],
    queryFn: async () => {
      const { data, error } = await db.from("sedes").select("id, nombre").eq("activo", true).order("nombre");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; nombre: string }[];
    },
    staleTime: 10 * 60_000,
  });

  // Quiénes pueden atender: activos, con la modalidad y, si el tipo los fija, asignados a él.
  const assigned = types.data?.find((t) => t.id === need.tipoCitaId)?.profesionalIds ?? [];
  const eligible = (professionalsQuery.data ?? []).filter(
    (p) => p.id && p.activo && (p.modalidades ?? []).includes(need.modalidad) && (assigned.length === 0 || assigned.includes(p.id)),
  );
  const specialties = [...new Set([...eligible.map((p) => p.especialidad), especialidad].filter(Boolean) as string[])].sort();
  const professionals = especialidad ? eligible.filter((p) => p.especialidad === especialidad) : eligible;

  const preview = useMutation({
    mutationFn: () => previewPlan({ cita: planCita, recurrencia: recurrenceOf(plan.draft) }),
    onSuccess: ({ sesiones }) => onPlanChange({ ...plan, checks: sesiones, removed: new Set() }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const missing = planMissing(plan.draft);

  const changeFilter = (apply: () => void) => {
    apply();
    onChange(null);
  };
  const toggleSession = (sesion: number, included: boolean) => {
    const removed = new Set(plan.removed);
    if (included) removed.delete(sesion);
    else removed.add(sesion);
    onPlanChange({ ...plan, removed });
  };

  return (
    <section className={cn(surface, "grid content-start gap-5")}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Cuándo y con quién</h2>
        <Segmented label="Cuántas citas" options={MODES} value={mode} onChange={onModeChange} />
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="sch-specialty" className="text-xs text-muted-foreground">Especialidad</Label>
          <Select value={especialidad ?? ALL} onValueChange={(v) => changeFilter(() => setEspecialidad(v === ALL ? null : v))}>
            <SelectTrigger id="sch-specialty" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mode === "una" && need.modalidad === "sede" && (
          <div className="grid gap-1.5">
            <Label htmlFor="sch-sede" className="text-xs text-muted-foreground">Sede</Label>
            <Select value={sedeId ?? ALL} onValueChange={(v) => changeFilter(() => setSedeId(v === ALL ? null : v))}>
              <SelectTrigger id="sch-sede" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas las sedes</SelectItem>
                {(sedes.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {mode === "una" && (
          <div className="grid gap-1.5">
            <Label htmlFor="sch-from" className="text-xs text-muted-foreground">Desde</Label>
            <Input
              id="sch-from"
              type="date"
              min={today()}
              value={desde}
              onChange={(e) => e.target.value && changeFilter(() => setDesde(e.target.value))}
              className="h-9"
            />
          </div>
        )}
      </div>

      {mode === "una" ? (
        <>
          <div className="w-fit">
            <Segmented label="Vista" options={VIEWS} value={view} onChange={(v) => setView(v as View)} />
          </div>
          {view === "sugeridos" ? (
            <SuggestionList need={need} patientId={patientId} sedeId={sedeId} especialidad={especialidad} desde={desde} value={value} onPick={onChange} />
          ) : (
            <ProfessionalDays need={need} professionals={professionals} desde={desde} sedeId={sedeId} value={value} onPick={onChange} />
          )}
        </>
      ) : (
        <>
          <RecurrenceForm value={plan.draft} onChange={(draft) => onPlanChange({ draft, checks: null, removed: new Set() })} professionals={professionals} />
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button variant="outline" className="h-9 gap-2 rounded-full" disabled={missing.length > 0 || preview.isPending} onClick={() => preview.mutate()}>
              {preview.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {plan.checks ? "Revisar de nuevo" : "Ver las sesiones"}
            </Button>
            {missing.length > 0 && <p className="text-xs text-muted-foreground">Falta {missing.join(", ")}.</p>}
          </div>
          {plan.checks && <PlanPreview checks={plan.checks} removed={plan.removed} onToggle={toggleSession} />}
        </>
      )}
    </section>
  );
}

export default SchedulingStep;
