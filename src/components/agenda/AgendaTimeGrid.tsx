import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MODALITY_LABEL, STATE_LABEL, localDay, localTime, type Cita, type CitaState } from "./agenda-api";
import { tint } from "./agenda-ui";

const GRID_START_HOUR = 6;
const GRID_END_HOUR = 20;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 44;
const PX_PER_MIN = SLOT_HEIGHT / SLOT_MINUTES;
const TOTAL_MIN = (GRID_END_HOUR - GRID_START_HOUR) * 60;
const SLOTS = TOTAL_MIN / SLOT_MINUTES;
const MIN_BLOCK_PX = 24;
/** Bloques más bajos que esto muestran una sola línea. */
const COMPACT_BLOCK_PX = 52;
const HOUR_COLUMN_PX = 64;
/** Hora a la que se desplaza el calendario si no hay citas. */
const DEFAULT_SCROLL_HOUR = 7;

const FADED_STATES: CitaState[] = ["cancelada_paciente", "cancelada_ips", "no_asistio"];

export interface GridColumn {
  id: string;
  /** Día (YYYY-MM-DD) que pinta la columna. */
  day: string;
  header: ReactNode;
  citas: Cita[];
}

interface AgendaTimeGridProps {
  columns: GridColumn[];
  onOpen: (cita: Cita) => void;
  /** Ancho mínimo de cada columna (en celular se desplaza en horizontal). */
  minColumnWidth: number;
  /** Mostrar el profesional dentro del bloque (vista con varios profesionales en una columna). */
  showProfessional?: boolean;
}

const minutesOf = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m - GRID_START_HOUR * 60;
};

interface Placed {
  cita: Cita;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

/** Posición vertical (minutos desde el inicio de la rejilla) y carriles para las citas que se cruzan. */
function placeCitas(citas: Cita[], day: string): Placed[] {
  const items = citas
    .map((cita) => {
      const start = localDay(cita.inicio) < day ? 0 : minutesOf(localTime(cita.inicio));
      const end = localDay(cita.fin) > day ? TOTAL_MIN : minutesOf(localTime(cita.fin));
      const top = Math.min(Math.max(start, 0), TOTAL_MIN - MIN_BLOCK_PX / PX_PER_MIN);
      return { cita, start: top, end: Math.max(Math.min(end, TOTAL_MIN), top + MIN_BLOCK_PX / PX_PER_MIN), lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const closeCluster = () => {
    cluster.forEach((p) => placed.push({ ...p, lanes: laneEnds.length }));
    cluster = [];
    laneEnds = [];
  };
  for (const item of items) {
    if (item.start >= clusterEnd) closeCluster();
    const free = laneEnds.findIndex((laneEnd) => laneEnd <= item.start);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = item.end;
    cluster.push({ ...item, lane });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  closeCluster();
  return placed;
}

const hourLabel = (slot: number) => {
  const minutes = GRID_START_HOUR * 60 + slot * SLOT_MINUTES;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

/**
 * Rejilla de horas (6:00–20:00, cada 30 min) con una columna por profesional o
 * por día. Es el único contenedor con scroll de la pantalla: encabezados de
 * columna y columna de horas quedan fijos.
 */
export function AgendaTimeGrid({ columns, onOpen, minColumnWidth, showProfessional }: AgendaTimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const placedByColumn = useMemo(() => columns.map((c) => placeCitas(c.citas, c.day)), [columns]);
  const firstStart = useMemo(() => {
    const starts = placedByColumn.flat().map((p) => p.start);
    return starts.length ? Math.min(...starts) : (DEFAULT_SCROLL_HOUR - GRID_START_HOUR) * 60;
  }, [placedByColumn]);
  const scrollKey = columns.map((c) => `${c.id}:${c.day}`).join("|");

  // Al cambiar de día, semana o profesional, se lleva la vista a la primera cita (o a las 7:00).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: Math.max(0, firstStart * PX_PER_MIN - SLOT_HEIGHT / 2) });
    // Solo al cambiar las columnas, no con cada recarga de datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  const gridStyle: CSSProperties = { minWidth: HOUR_COLUMN_PX + columns.length * minColumnWidth };

  return (
    <div
      ref={scrollRef}
      className="scroll-tabla relative min-h-0 flex-1 overflow-auto rounded-card bg-card shadow-card dark:border dark:border-border dark:shadow-none"
    >
      <div style={gridStyle}>
        <div className="sticky top-0 z-20 flex border-b border-border/70 bg-card">
          <div className="sticky left-0 z-30 shrink-0 bg-card" style={{ width: HOUR_COLUMN_PX }} />
          {columns.map((c) => (
            <div key={c.id} className="min-w-0 flex-1 border-l border-border/50 px-3 py-2.5" style={{ minWidth: minColumnWidth }}>
              {c.header}
            </div>
          ))}
        </div>
        <div className="flex">
          <div className="sticky left-0 z-10 shrink-0 bg-card" style={{ width: HOUR_COLUMN_PX }} aria-hidden>
            {Array.from({ length: SLOTS }, (_, i) => (
              <div key={i} className="relative" style={{ height: SLOT_HEIGHT }}>
                {i % 2 === 0 && (
                  <span className="absolute right-2 top-1 text-[11px] tabular-nums text-muted-foreground">{hourLabel(i)}</span>
                )}
              </div>
            ))}
          </div>
          {columns.map((c, index) => (
            <div key={c.id} className="relative min-w-0 flex-1 border-l border-border/50" style={{ minWidth: minColumnWidth, height: SLOTS * SLOT_HEIGHT }}>
              {Array.from({ length: SLOTS }, (_, i) => (
                <div
                  key={i}
                  className={cn("border-b", i % 2 === 0 ? "border-border/25" : "border-border/60")}
                  style={{ height: SLOT_HEIGHT }}
                />
              ))}
              {placedByColumn[index].map((p) => (
                <CitaBlock key={p.cita.id} placed={p} onOpen={onOpen} showProfessional={showProfessional} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CitaBlock({ placed, onOpen, showProfessional }: { placed: Placed; onOpen: (cita: Cita) => void; showProfessional?: boolean }) {
  const { cita, start, end, lane, lanes } = placed;
  const height = (end - start) * PX_PER_MIN - 2;
  const compact = height < COMPACT_BLOCK_PX;
  const faded = FADED_STATES.includes(cita.estado);
  const style = {
    top: start * PX_PER_MIN + 1,
    height,
    left: `calc(${(lane / lanes) * 100}% + 3px)`,
    width: `calc(${100 / lanes}% - 6px)`,
    "--block-bg": tint(cita.color, 16),
    "--block-bg-hover": tint(cita.color, 26),
  } as CSSProperties;
  const time = `${localTime(cita.inicio)} – ${localTime(cita.fin)}`;
  const detail = faded ? STATE_LABEL[cita.estado] : showProfessional ? `${MODALITY_LABEL[cita.modalidad]} · ${cita.profesional}` : MODALITY_LABEL[cita.modalidad];

  return (
    <button
      type="button"
      onClick={() => onOpen(cita)}
      style={style}
      aria-label={`${cita.paciente}, ${time}, ${MODALITY_LABEL[cita.modalidad]}, ${STATE_LABEL[cita.estado]}`}
      className={cn(
        "absolute z-[1] overflow-hidden rounded-lg bg-[var(--block-bg)] px-2 py-1 text-left transition-[background-color,box-shadow] duration-150",
        "hover:z-[2] hover:bg-[var(--block-bg-hover)] hover:shadow-card focus-visible:z-[2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        faded && "opacity-60",
      )}
    >
      {compact ? (
        <p className="truncate text-[12px] leading-tight text-foreground">
          <span className="tabular-nums text-muted-foreground">{localTime(cita.inicio)}</span>{" "}
          <span className="font-medium">{cita.paciente}</span>
        </p>
      ) : (
        <>
          <p className="truncate text-[11.5px] tabular-nums leading-tight text-muted-foreground">{time}</p>
          <p className="truncate text-[13px] font-medium leading-snug text-foreground">{cita.paciente}</p>
          <p className="truncate text-[12px] leading-tight text-muted-foreground">{detail}</p>
        </>
      )}
    </button>
  );
}
