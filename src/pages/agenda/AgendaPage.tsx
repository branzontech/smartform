import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { BarTabs, type BarTab } from "@/components/kit/table";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  PRO_TYPE_LABEL, WEEKDAYS, addDays, fetchCitas, fetchProfessionals, formatLongDay, formatShortDay, localDay, toIso, today, weekStart,
  type Cita, type ProfessionalRow,
} from "@/components/agenda/agenda-api";
import { capitalizeFirst, errorMessage, isDay, tint } from "@/components/agenda/agenda-ui";
import { AgendaTimeGrid, type GridColumn } from "@/components/agenda/AgendaTimeGrid";
import { AgendaListView } from "@/components/agenda/AgendaListView";

type View = "day" | "week" | "list";
const VIEWS: BarTab<View>[] = [
  { id: "day", title: "Día" },
  { id: "week", title: "Semana" },
  { id: "list", title: "Lista" },
];
const ALL = "all";
const WEEK_DAYS = 7;
const DAY_COLUMN_MIN_PX = 180;
const WEEK_COLUMN_MIN_PX = 132;
const COLLATOR = new Intl.Collator("es", { sensitivity: "base" });

const isView = (v: string | null): v is View => v === "day" || v === "week" || v === "list";
type ActiveProfessional = ProfessionalRow & { id: string };
const hasId = (p: ProfessionalRow): p is ActiveProfessional => !!p.id && p.activo !== false;

/** Baldosa con el color del profesional (leyenda, misma forma del bloque). */
function ColorTile({ color }: { color: string | null }) {
  return <span aria-hidden className="h-3 w-3 shrink-0 rounded-[4px]" style={{ backgroundColor: tint(color, 45) }} />;
}

function ProfessionalHeader({ name, detail, color }: { name: string; detail: string | null; color: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ColorTile color={color} />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-foreground">{name}</p>
        {detail && <p className="truncate text-[12px] text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

function DayHeader({ day }: { day: string }) {
  const weekday = WEEKDAYS[(new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % WEEK_DAYS].slice(0, 3);
  const number = Number(day.slice(8));
  const isToday = day === today();
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "flex h-8 w-8 items-center justify-center rounded-tile text-[15px] font-semibold tabular-nums",
        isToday ? "bg-highlight text-highlight-foreground" : "text-foreground",
      )}>
        {number}
      </span>
      <span className="text-[13px] text-muted-foreground">{weekday}</span>
    </div>
  );
}

/**
 * Agenda real (reemplaza a AppointmentList, que era de ejemplo): vistas Día
 * (columna por profesional), Semana (7 días) y Lista (tabla del kit). La vista,
 * la fecha y el profesional viajan en la URL para volver del detalle sin perderlos.
 */
export default function AgendaPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view: View = isView(params.get("view")) ? (params.get("view") as View) : "day";
  const day = isDay(params.get("date")) ? (params.get("date") as string) : today();
  const professionalId = params.get("professional") ?? ALL;

  const update = useCallback((patch: Record<string, string | null>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });
  }, [setParams]);

  const rangeStart = view === "day" ? day : weekStart(day);
  const rangeDays = view === "day" ? 1 : WEEK_DAYS;
  const rangeEnd = addDays(rangeStart, rangeDays);
  const filterId = professionalId === ALL ? null : professionalId;

  const professionals = useQuery({ queryKey: ["agenda", "profesionales"], queryFn: fetchProfessionals });
  const citas = useQuery({
    queryKey: ["agenda", "citas", { desde: rangeStart, hasta: rangeEnd, profesionalId: filterId }],
    queryFn: () => fetchCitas({ desde: toIso(rangeStart, "00:00"), hasta: toIso(rangeEnd, "00:00"), profesionalId: filterId }),
  });

  const activePros = useMemo(
    () => (professionals.data ?? []).filter(hasId).sort((a, b) => COLLATOR.compare(a.nombre, b.nombre)),
    [professionals.data],
  );
  const proOptions = useMemo(
    () => [{ value: ALL, label: "Todos los profesionales" }, ...activePros.map((p) => ({ value: p.id, label: p.nombre, description: p.especialidad ?? undefined }))],
    [activePros],
  );

  const rows = useMemo(() => citas.data ?? [], [citas.data]);
  const calendarCitas = useMemo(() => rows.filter((c) => c.estado !== "reprogramada"), [rows]);
  const columns = useMemo(
    () => (view === "week" ? weekColumns(rangeStart, calendarCitas) : dayColumns(day, calendarCitas, activePros, filterId)),
    [view, rangeStart, day, calendarCitas, activePros, filterId],
  );

  const step = view === "day" ? 1 : WEEK_DAYS;
  const rangeLabel = view === "day"
    ? formatLongDay(day)
    : `${formatShortDay(rangeStart)} – ${formatShortDay(addDays(rangeStart, WEEK_DAYS - 1))}`;
  const open = (cita: Cita) => navigate(`/app/citas/${cita.id}`);
  const isCalendar = view !== "list";
  const visibleCount = isCalendar ? calendarCitas.length : rows.length;

  return (
    <div className={cn("mx-auto w-full max-w-7xl py-5", isCalendar ? "flex h-full flex-col gap-4 overflow-hidden" : "space-y-4")}>
      <ModuleHeader title="Agenda" primary={{ title: "Nueva cita", onClick: () => navigate("/app/citas/nueva") }} />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" aria-label="Anterior" onClick={() => update({ date: addDays(day, -step) })} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" onClick={() => update({ date: null })} className="h-9 rounded-lg px-3 text-[13px] font-normal">Hoy</Button>
            <Button variant="ghost" size="icon" aria-label="Siguiente" onClick={() => update({ date: addDays(day, step) })} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
              <ChevronRight />
            </Button>
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">{capitalizeFirst(rangeLabel)}</h2>
          {!citas.isLoading && !citas.isError && (
            <span className="text-[13px] text-muted-foreground">
              {visibleCount === 0 ? "Sin citas" : `${visibleCount} ${visibleCount === 1 ? "cita" : "citas"}`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchableSelect
            value={professionalId}
            onValueChange={(v) => update({ professional: v && v !== ALL ? v : null })}
            options={proOptions}
            placeholder="Todos los profesionales"
            searchPlaceholder="Buscar profesional…"
            emptyMessage="Ningún profesional coincide"
            disabled={professionals.isLoading}
            className="w-60"
            triggerClassName="h-9 rounded-lg text-[13px]"
          />
          <BarTabs label="Vista de la agenda" tabs={VIEWS} active={view} onChange={(v) => update({ view: v === "day" ? null : v })} />
        </div>
      </div>

      {citas.isError ? (
        <p className="text-[13px] text-destructive">
          {errorMessage(citas.error)}{" "}
          <button type="button" onClick={() => void citas.refetch()} className="font-medium text-foreground hover:text-primary">Reintentar</button>
        </p>
      ) : view === "list" ? (
        <AgendaListView citas={rows} loading={citas.isLoading} onOpen={open} />
      ) : citas.isLoading || professionals.isLoading ? (
        <Skeleton className="min-h-0 flex-1 rounded-card" />
      ) : columns.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Aún no hay profesionales con horario. Configúralos en Profesionales para ver su agenda.
        </p>
      ) : (
        <AgendaTimeGrid
          columns={columns}
          onOpen={open}
          minColumnWidth={view === "week" ? WEEK_COLUMN_MIN_PX : DAY_COLUMN_MIN_PX}
          showProfessional={view === "week" && !filterId}
        />
      )}
    </div>
  );
}

function weekColumns(start: string, citas: Cita[]): GridColumn[] {
  return Array.from({ length: WEEK_DAYS }, (_, i) => {
    const day = addDays(start, i);
    return { id: day, day, header: <DayHeader day={day} />, citas: citas.filter((c) => localDay(c.inicio) === day) };
  });
}

/** Una columna por profesional: los que atienden (tienen horario) o tienen citas ese día. */
function dayColumns(day: string, citas: Cita[], pros: ActiveProfessional[], filterId: string | null): GridColumn[] {
  const ofDay = citas.filter((c) => localDay(c.inicio) === day);
  const known = new Map(pros.map((p) => [p.id, p]));
  const ids = filterId
    ? [filterId]
    : [...new Set([...pros.filter((p) => p.bloquesHorario > 0).map((p) => p.id), ...ofDay.map((c) => c.profesionalId)])];

  return ids
    .map((id) => {
      const pro = known.get(id);
      const sample = ofDay.find((c) => c.profesionalId === id);
      const name = pro?.nombre ?? sample?.profesional ?? "Profesional";
      const detail = pro ? pro.especialidad ?? (pro.tipo ? PRO_TYPE_LABEL[pro.tipo] ?? null : null) : null;
      const color = pro?.color ?? sample?.color ?? null;
      return { id, day, name, header: <ProfessionalHeader name={name} detail={detail} color={color} />, citas: ofDay.filter((c) => c.profesionalId === id) };
    })
    .sort((a, b) => COLLATOR.compare(a.name, b.name))
    .map(({ name: _name, ...column }) => column);
}
