import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ExtendedPatient } from "../PatientPanel";
import {
  MODALITY_LABEL, PRO_TYPE_LABEL, addDays, fetchProfessionals, fetchSlots, formatLongDay, today,
  type Modality, type Slot,
} from "@/components/agenda/agenda-api";

/** Lo que el paso entrega al asistente: una cita lista para crear. */
export interface SchedulingData {
  profesionalId: string;
  profesional: string;
  modalidad: Modality;
  fecha: string;
  hora: string;
  inicio: string;
  duracionMin: number;
  sedeId: string | null;
  direccion: string | null;
  notas: string;
}

interface SchedulingStepProps {
  patient: ExtendedPatient;
  onComplete: (data: SchedulingData) => void;
  onBack: () => void;
  /** Mientras el asistente guarda la cita. */
  saving?: boolean;
}

const DURATIONS = [15, 20, 30, 40, 45, 60, 90, 120];

/** Paso «Agenda» del asistente: profesional real, cupos libres según su horario y citas. */
export function SchedulingStep({ patient, onComplete, saving = false }: SchedulingStepProps) {
  const professionalsQuery = useQuery({ queryKey: ["agenda", "profesionales"], queryFn: fetchProfessionals });
  const professionals = useMemo(
    () => (professionalsQuery.data ?? []).filter((p) => p.id && p.activo && (p.modalidades?.length ?? 0) > 0),
    [professionalsQuery.data],
  );

  const [profesionalId, setProfesionalId] = useState<string>("");
  const [modalidad, setModalidad] = useState<Modality>("sede");
  const [duracion, setDuracion] = useState(30);
  const [fecha, setFecha] = useState(today());
  const [slot, setSlot] = useState<Slot | null>(null);
  const [direccion, setDireccion] = useState([patient.address, patient.city].filter(Boolean).join(", "));
  const [notas, setNotas] = useState("");

  const profesional = professionals.find((p) => p.id === profesionalId) ?? null;

  // Al elegir profesional: su modalidad (si la actual no la atiende) y su duración habitual.
  useEffect(() => {
    if (!profesional) return;
    const modes = profesional.modalidades ?? [];
    if (!modes.includes(modalidad)) setModalidad(modes[0]);
    if (profesional.duracionCitaMin) setDuracion(profesional.duracionCitaMin);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de profesional
  }, [profesionalId]);

  useEffect(() => setSlot(null), [profesionalId, modalidad, duracion, fecha]);

  const slotsQuery = useQuery({
    queryKey: ["agenda", "cupos", profesionalId, fecha, duracion, modalidad],
    queryFn: () => fetchSlots({ profesionalId, fecha, duracionMin: duracion, modalidad }),
    enabled: !!profesionalId,
  });
  const slots = slotsQuery.data?.slots ?? [];
  const groups: [string, Slot[]][] = [
    ["Mañana", slots.filter((s) => s.hora < "12:00")],
    ["Tarde", slots.filter((s) => s.hora >= "12:00")],
  ];

  const needsAddress = modalidad === "domicilio";
  const missing = [
    !profesional && "el profesional",
    !slot && "la hora",
    needsAddress && !direccion.trim() && "la dirección del domicilio",
  ].filter(Boolean) as string[];

  const submit = () => {
    if (!profesional?.id || !slot || missing.length) return;
    onComplete({
      profesionalId: profesional.id,
      profesional: profesional.nombre,
      modalidad,
      fecha,
      hora: slot.hora,
      inicio: slot.inicio,
      duracionMin: duracion,
      sedeId: slot.sedeId,
      direccion: needsAddress ? direccion.trim() : null,
      notas: notas.trim(),
    });
  };

  const slotRow = (s: Slot) => {
    const selected = slot?.inicio === s.inicio;
    return (
      <button
        key={s.inicio}
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => setSlot(s)}
        className={cn(
          "flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm tabular-nums transition-colors",
          selected ? "bg-primary/10 font-semibold ring-1 ring-primary/40" : "hover:bg-muted",
        )}
      >
        <span>{s.hora}</span>
        <span className="text-xs text-muted-foreground">{duracion} min</span>
      </button>
    );
  };

  return (
    // pb-24: el dock flotante del asistente no tapa el resumen ni el botón de agendar.
    <div className="grid h-full min-h-0 gap-4 pb-24 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-card bg-card p-5 shadow-card">
        <header>
          <h2 className="text-lg font-semibold">Agendar la cita</h2>
          <p className="text-[13px] text-muted-foreground">
            {patient.firstName} {patient.lastName}
          </p>
        </header>

        <div className="grid gap-1.5">
          <Label htmlFor="sch-pro">Profesional</Label>
          <Select value={profesionalId} onValueChange={setProfesionalId}>
            <SelectTrigger id="sch-pro" className="h-10">
              <SelectValue placeholder={professionalsQuery.isLoading ? "Cargando…" : "Elige el profesional"} />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id ?? ""}>
                  {p.nombre} · {p.especialidad || PRO_TYPE_LABEL[p.tipo ?? "otro"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!professionalsQuery.isLoading && professionals.length === 0 && (
            <p className="text-xs text-muted-foreground">No hay profesionales habilitados. Un administrador los habilita en Profesionales.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="sch-mode">Modalidad</Label>
            <Select value={modalidad} onValueChange={(v) => setModalidad(v as Modality)} disabled={!profesional}>
              <SelectTrigger id="sch-mode" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(profesional?.modalidades ?? ["sede"]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODALITY_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sch-duration">Duración</Label>
            <Select value={String(duracion)} onValueChange={(v) => setDuracion(Number(v))}>
              <SelectTrigger id="sch-duration" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...new Set([...DURATIONS, duracion])]
                  .sort((a, b) => a - b)
                  .map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} minutos
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {needsAddress && (
          <div className="grid gap-1.5">
            <Label htmlFor="sch-address">Dirección del domicilio</Label>
            <Input id="sch-address" value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={300} className="h-10" />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="sch-notes">Notas para el profesional (opcional)</Label>
          <Textarea id="sch-notes" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={2000} className="resize-y" />
        </div>
      </section>

      <section className="flex min-h-0 flex-col rounded-card bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon" aria-label="Día anterior" disabled={fecha <= today()} onClick={() => setFecha(addDays(fecha, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="grid justify-items-center gap-1">
            <p className="text-sm font-semibold first-letter:uppercase">{formatLongDay(fecha)}</p>
            <Input
              type="date"
              aria-label="Fecha de la cita"
              value={fecha}
              min={today()}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
              className="h-8 w-40 text-xs"
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Día siguiente" onClick={() => setFecha(addDays(fecha, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto" role="radiogroup" aria-label="Horas disponibles">
          {!profesional ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Elige un profesional para ver sus horas libres.</p>
          ) : slotsQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : slotsQuery.data?.sinHorario ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Este profesional aún no tiene horario. Configúralo en Profesionales.</p>
          ) : slots.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay horas libres este día en modalidad {MODALITY_LABEL[modalidad].toLowerCase()}. Prueba otro día.
            </p>
          ) : (
            <div className="grid gap-4">
              {groups.map(([title, list]) =>
                list.length ? (
                  <div key={title} className="grid gap-1">
                    <p className="px-1 text-xs font-medium text-muted-foreground">{title}</p>
                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">{list.map(slotRow)}</div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-[13px] text-muted-foreground">
            {slot && profesional ? (
              <>
                <CalendarClock className="mr-1 inline h-4 w-4 align-[-3px]" />
                <span className="first-letter:uppercase">{formatLongDay(fecha)}</span>, {slot.hora} · {profesional.nombre} · {MODALITY_LABEL[modalidad]}
              </>
            ) : (
              `Falta ${missing.join(", ")}.`
            )}
          </p>
          <Button onClick={submit} disabled={saving || missing.length > 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agendar cita
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SchedulingStep;
