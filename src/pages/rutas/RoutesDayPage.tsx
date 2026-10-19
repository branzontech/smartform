import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, formatLongDay, today } from "@/components/agenda/agenda-api";
import { capitalizeFirst, errorMessage, isDay } from "@/components/agenda/agenda-ui";
import { CoordinatorMap } from "@/components/rutas/CoordinatorMap";
import { Itinerary, ProList } from "@/components/rutas/RoutesPanel";
import { RouteIcon3D } from "@/components/rutas/MapMarker";
import { fetchDay, fetchMapsKey } from "@/components/rutas/rutas-api";
import { lateStops } from "@/components/rutas/route-day-model";
import { cn } from "@/lib/utils";

/** Cada cuánto se refresca el día de hoy (posiciones y estados). */
const LIVE_REFRESH_MS = 30_000;
const card = "rounded-card bg-card shadow-card dark:border dark:border-border dark:shadow-none";

/**
 * Rutas del día (coordinación): todos los profesionales con visitas a
 * domicilio, dónde va cada uno y cómo avanza su ruta. Reúne los elementos
 * del software de rutas de profesionales: mapa limpio, pines 3D, tarjeta del
 * resumen, itinerario y enlaces a Google Maps.
 */
export default function RoutesDayPage() {
  const [params, setParams] = useSearchParams();
  const day = isDay(params.get("fecha")) ? params.get("fecha")! : today();
  const isToday = day === today();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const key = useQuery({ queryKey: ["maps", "config"], queryFn: fetchMapsKey, staleTime: Infinity, retry: false });
  const dayQuery = useQuery({
    queryKey: ["rutas", "dia", day],
    queryFn: () => fetchDay(day),
    refetchInterval: isToday ? LIVE_REFRESH_MS : false,
  });

  // El reloj de «hace 3 min» y de las visitas atrasadas avanza aunque no lleguen datos nuevos.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), LIVE_REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const setDay = (d: string) => {
    setSelectedId(null);
    setActiveStopId(null);
    setParams(d === today() ? {} : { fecha: d }, { replace: true });
  };
  const select = (id: string | null) => {
    setSelectedId(id);
    setActiveStopId(null);
  };

  const pros = dayQuery.data?.profesionales ?? [];
  const selected = pros.find((p) => p.profesionalId === selectedId) ?? null;
  const visits = pros.reduce((n, p) => n + p.paradas.length, 0);
  const done = pros.reduce((n, p) => n + p.resueltas, 0);
  const late = isToday ? pros.reduce((n, p) => n + lateStops(p, now).length, 0) : 0;
  const onRoute = pros.filter((p) => p.ruta?.estado === "en_curso").length;
  const summary = pros.length
    ? [`${pros.length} ${pros.length === 1 ? "profesional" : "profesionales"}`, `${onRoute} en ruta`, `${done} de ${visits} visitas resueltas`].join(" · ")
    : null;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pb-5 pt-3 md:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <RouteIcon3D name="mapa" size={40} />
          <div>
            <h1 className="text-[22px] font-bold leading-tight text-foreground">Rutas del día</h1>
            <p className="text-[13px] text-muted-foreground">
              {summary ?? "Visitas a domicilio de tus profesionales"}
              {late > 0 && <span className="text-[hsl(var(--warning))]"> · {late} {late === 1 ? "visita atrasada" : "visitas atrasadas"}</span>}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" aria-label="Día anterior" onClick={() => setDay(addDays(day, -1))} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDay(today())}
            title={isToday ? undefined : "Volver a hoy"}
            className="min-w-[220px] rounded-xl px-3 py-1.5 text-center text-[14px] font-semibold text-foreground transition hover:bg-muted"
          >
            {capitalizeFirst(formatLongDay(day))}
            {isToday && <span className="font-normal text-muted-foreground"> · hoy</span>}
          </button>
          <button type="button" aria-label="Día siguiente" onClick={() => setDay(addDays(day, 1))} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3.5 md:min-h-0 md:flex-1 md:flex-row">
        <aside aria-label="Profesionales" className={cn(card, "flex shrink-0 flex-col overflow-hidden md:w-[360px]")}>
          {dayQuery.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}
            </div>
          ) : dayQuery.isError ? (
            <Empty title="No se pudieron cargar las rutas" hint={errorMessage(dayQuery.error)} />
          ) : selected ? (
            <Itinerary pro={selected} now={now} activeStopId={activeStopId} onActivateStop={setActiveStopId} onBack={() => select(null)} />
          ) : pros.length === 0 ? (
            <Empty title="No hay visitas a domicilio este día" hint="Cuando se agenden citas domiciliarias, aquí verás a cada profesional y su ruta." />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ProList pros={pros} now={now} onSelect={select} />
            </div>
          )}
        </aside>

        <section aria-label="Mapa" className="h-[60vh] min-w-0 md:h-auto md:min-h-0 md:flex-1">
          {key.data?.apiKey ? (
            <APIProvider apiKey={key.data.apiKey} language="es" region="CO">
              <CoordinatorMap pros={pros} selectedId={selectedId} activeStopId={activeStopId} onSelectPro={select} onActivateStop={setActiveStopId} />
            </APIProvider>
          ) : (
            <div className={cn(card, "flex h-full items-center justify-center p-6")}>
              {key.isLoading ? <Skeleton className="h-full w-full rounded-3xl" /> : <Empty title="El mapa no está disponible" hint={key.error ? errorMessage(key.error) : "Falta configurar Google Maps en el servidor."} />}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <RouteIcon3D name="profesional" size={72} />
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      <p className="max-w-[280px] text-[13px] text-muted-foreground">{hint}</p>
    </div>
  );
}
