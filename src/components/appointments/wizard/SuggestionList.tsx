import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSuggestions, formatLongDay, type Sugerido } from "@/components/agenda/agenda-api";
import type { NeedData, PickedSlot } from "./wizard-model";

/** Días hacia adelante en los que se buscan cupos sugeridos. */
const SEARCH_DAYS = 14;
const MAX_SUGGESTIONS = 20;

interface SuggestionListProps {
  need: NeedData;
  patientId: string;
  sedeId: string | null;
  especialidad: string | null;
  desde: string;
  value: PickedSlot | null;
  onPick: (slot: PickedSlot) => void;
}

/** Más allá de este traslado el número no ayuda: basta saber que queda lejos. */
const FAR_TRAVEL_MIN = 120;

function travelText(minutes: number | null): string | null {
  if (minutes === null) return null;
  return minutes > FAR_TRAVEL_MIN ? "lejos de su visita anterior" : `${minutes} min desde su visita anterior`;
}

function detailOf(s: Sugerido): string {
  return [
    s.especialidad,
    s.modalidad === "sede" ? s.sede : null,
    travelText(s.trasladoMin),
    s.yaLoAtendio ? "ya lo atendió" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Primeros cupos libres entre todos los profesionales que pueden atender la cita. */
export function SuggestionList({ need, patientId, sedeId, especialidad, desde, value, onPick }: SuggestionListProps) {
  const params = {
    tipoCitaId: need.tipoCitaId,
    pacienteId: patientId,
    sedeId: need.modalidad === "sede" ? sedeId : null,
    modalidad: need.modalidad,
    especialidad,
    desde,
    dias: SEARCH_DAYS,
    limite: MAX_SUGGESTIONS,
    duracionMin: need.duracionMin,
  };
  const query = useQuery({ queryKey: ["agenda", "sugeridos", params], queryFn: () => fetchSuggestions(params) });
  const list = query.data?.sugeridos ?? [];
  const days = [...new Set(list.map((s) => s.fecha))];

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (query.isError) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{query.error instanceof Error ? query.error.message : "No se pudieron cargar los cupos."}</p>;
  }
  if (!list.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No hay cupos libres en los próximos {SEARCH_DAYS} días con estos filtros. Prueba otra fecha, otra sede o la vista por profesional.
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label="Cupos sugeridos" className="grid gap-5">
      {days.map((day) => (
        <div key={day} className="grid gap-1">
          <p className="px-1 text-xs font-medium text-muted-foreground first-letter:uppercase">{formatLongDay(day)}</p>
          {list
            .filter((s) => s.fecha === day)
            .map((s) => {
              const selected = value?.inicio === s.inicio && value.profesionalId === s.profesionalId;
              return (
                <button
                  key={`${s.profesionalId}-${s.inicio}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    onPick({ profesionalId: s.profesionalId, profesional: s.profesional, fecha: s.fecha, hora: s.hora, inicio: s.inicio, sedeId: s.sedeId, sede: s.sede })
                  }
                  className={cn(
                    "flex items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors duration-200",
                    selected ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted",
                  )}
                >
                  <span className="w-12 shrink-0 text-[15px] font-semibold tabular-nums">{s.hora}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-foreground">{s.profesional}</span>
                    <span className="block truncate text-xs text-muted-foreground">{detailOf(s) || " "}</span>
                  </span>
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}
