import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MODALITY_LABEL, PRO_TYPE_LABEL, addDays, fetchHolidays, fetchSlots, formatLongDay, today, weekStart,
  type ProfessionalRow, type Slot,
} from "@/components/agenda/agenda-api";
import type { NeedData, PickedSlot } from "./wizard-model";

interface ProfessionalDaysProps {
  need: NeedData;
  professionals: ProfessionalRow[];
  desde: string;
  sedeId: string | null;
  value: PickedSlot | null;
  onPick: (slot: PickedSlot | null) => void;
}

const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: "UTC" });
const dayNumber = (day: string) => Number(day.slice(8, 10));

/** Vista por profesional: su semana y las horas libres del día elegido. */
export function ProfessionalDays({ need, professionals, desde, sedeId, value, onPick }: ProfessionalDaysProps) {
  const [profesionalId, setProfesionalId] = useState(value?.profesionalId ?? "");
  const [fecha, setFecha] = useState(value?.fecha ?? desde);
  const profesional = professionals.find((p) => p.id === profesionalId) ?? null;
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart(fecha), i));
  const now = today();
  const year = Number(fecha.slice(0, 4));

  // Si cambia la fecha de búsqueda, la semana salta a ella.
  useEffect(() => setFecha(value?.fecha ?? desde), [desde]); // eslint-disable-line react-hooks/exhaustive-deps

  const holidays = useQuery({ queryKey: ["agenda", "festivos", year], queryFn: () => fetchHolidays(year), staleTime: 60 * 60_000 });
  const holidayName = (day: string) =>
    holidays.data?.nacionales.find((h) => h.fecha === day)?.nombre ?? holidays.data?.empresa.find((h) => h.fecha === day)?.nombre ?? null;

  const slotsQuery = useQuery({
    queryKey: ["agenda", "cupos", profesionalId, fecha, need.duracionMin, need.modalidad],
    queryFn: () => fetchSlots({ profesionalId, fecha, duracionMin: need.duracionMin, modalidad: need.modalidad }),
    enabled: !!profesionalId,
  });
  const slots = (slotsQuery.data?.slots ?? []).filter((s) => need.modalidad !== "sede" || !sedeId || s.sedeId === sedeId);
  const groups: [string, Slot[]][] = [
    ["Mañana", slots.filter((s) => s.hora < "12:00")],
    ["Tarde", slots.filter((s) => s.hora >= "12:00")],
  ];

  const pickProfessional = (id: string) => {
    setProfesionalId(id);
    onPick(null);
  };
  const pickDay = (day: string) => {
    setFecha(day);
    onPick(null);
  };

  const emptyMessage = () => {
    if (slotsQuery.data?.festivo) return `${slotsQuery.data.festivo}: festivo, sin atención.`;
    if (slotsQuery.data?.sinHorario) return "Este profesional aún no tiene horario. Configúralo en Profesionales.";
    return `No hay horas libres este día en modalidad ${MODALITY_LABEL[need.modalidad].toLowerCase()}.`;
  };
  const dayHoliday = holidayName(fecha);

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="pro-pick">Profesional</Label>
        <Select value={profesionalId} onValueChange={pickProfessional}>
          <SelectTrigger id="pro-pick" className="h-10">
            <SelectValue placeholder="Elige el profesional" />
          </SelectTrigger>
          <SelectContent>
            {professionals.map((p) => (
              <SelectItem key={p.id} value={p.id ?? ""}>
                {p.nombre} · {p.especialidad || PRO_TYPE_LABEL[p.tipo ?? "otro"]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {professionals.length === 0 && <p className="text-xs text-muted-foreground">Ningún profesional activo atiende esta cita con estos filtros.</p>}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Semana anterior" disabled={week[0] <= now} onClick={() => setFecha(addDays(fecha, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="grid flex-1 grid-cols-7 gap-1" role="tablist" aria-label="Días de la semana">
          {week.map((day) => {
            const past = day < now;
            const holiday = holidayName(day);
            const selected = day === fecha;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={past}
                title={holiday ? `Festivo: ${holiday}` : undefined}
                onClick={() => pickDay(day)}
                className={cn(
                  "grid justify-items-center rounded-xl py-1.5 transition-colors duration-200",
                  selected ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted",
                  past && "cursor-not-allowed opacity-40 hover:bg-transparent",
                )}
              >
                <span className="text-[11px] capitalize text-muted-foreground">{weekday.format(new Date(`${day}T12:00:00Z`)).replace(".", "")}</span>
                <span className={cn("text-sm font-semibold tabular-nums", holiday && "text-muted-foreground/60")}>{dayNumber(day)}</span>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" aria-label="Semana siguiente" onClick={() => setFecha(addDays(fecha, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="px-1 text-xs font-medium text-muted-foreground first-letter:uppercase">
        {formatLongDay(fecha)}
        {dayHoliday ? ` · festivo: ${dayHoliday}` : ""}
      </p>

      <div role="radiogroup" aria-label="Horas disponibles">
        {!profesional ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Elige un profesional para ver sus horas libres.</p>
        ) : slotsQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : slots.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage()}</p>
        ) : (
          <div className="grid gap-4">
            {groups.map(([title, list]) =>
              list.length ? (
                <div key={title} className="grid gap-1">
                  <p className="px-1 text-xs font-medium text-muted-foreground">{title}</p>
                  <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6">
                    {list.map((s) => {
                      const selected = value?.inicio === s.inicio && value.profesionalId === profesionalId;
                      return (
                        <button
                          key={s.inicio}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => onPick({ profesionalId, profesional: profesional.nombre, fecha, hora: s.hora, inicio: s.inicio, sedeId: s.sedeId, sede: null })}
                          className={cn(
                            "rounded-xl px-3 py-2 text-sm tabular-nums transition-colors duration-200",
                            selected ? "bg-primary/10 font-semibold ring-1 ring-primary/40" : "hover:bg-muted",
                          )}
                        >
                          {s.hora}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}
