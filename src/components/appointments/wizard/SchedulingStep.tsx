import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { db } from "@/integrations/data/client";
import { fetchAppointmentTypes, fetchProfessionals, today } from "@/components/agenda/agenda-api";
import type { NeedData, PickedSlot } from "./wizard-model";
import { SuggestionList } from "./SuggestionList";
import { ProfessionalDays } from "./ProfessionalDays";

interface SchedulingStepProps {
  patientId: string;
  need: NeedData;
  value: PickedSlot | null;
  onChange: (slot: PickedSlot | null) => void;
}

type View = "sugeridos" | "profesional";
const VIEWS: [View, string][] = [
  ["sugeridos", "Primeros cupos"],
  ["profesional", "Por profesional"],
];
const ALL = "todas";
const surface = "rounded-card bg-card p-5 shadow-card dark:border dark:border-border dark:shadow-none";

/** Paso «Cuándo y con quién»: los primeros cupos libres o la semana de un profesional. */
export function SchedulingStep({ patientId, need, value, onChange }: SchedulingStepProps) {
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

  const changeFilter = (apply: () => void) => {
    apply();
    onChange(null);
  };

  return (
    <section className={cn(surface, "grid content-start gap-5")}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Cuándo y con quién</h2>
        <div role="tablist" aria-label="Vista" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {VIEWS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={cn(
                "h-8 rounded-lg px-3 text-[13px] font-medium transition-all duration-200",
                view === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
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
        {need.modalidad === "sede" && (
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
      </div>

      {view === "sugeridos" ? (
        <SuggestionList need={need} patientId={patientId} sedeId={sedeId} especialidad={especialidad} desde={desde} value={value} onPick={onChange} />
      ) : (
        <ProfessionalDays need={need} professionals={professionals} desde={desde} sedeId={sedeId} value={value} onPick={onChange} />
      )}
    </section>
  );
}

export default SchedulingStep;
