/// <reference types="@types/google.maps" />
import { useEffect, useMemo, useState } from "react";
import { ControlPosition, Map, useMap } from "@vis.gl/react-google-maps";
import { Info, Layers, RotateCcw, X } from "lucide-react";
import { professionalColor } from "@/components/agenda/agenda-ui";
import { cn } from "@/lib/utils";
import { decodePolyline, type ProfesionalDia } from "./rutas-api";
import { DEFAULT_CENTER, MAP_STYLE } from "./map-style";
import { MapMarker, RouteIcon3D, type LatLng, type RouteIconName } from "./MapMarker";
import { RoutePin } from "./RoutePin";
import { RouteTraces, type TraceRoute } from "./RouteTraces";
import { firstName, isDone, isLocatedStop, pointOf } from "./route-day-model";

interface CoordinatorMapProps {
  pros: ProfesionalDia[];
  /** Profesional elegido: su ruta se resalta y el carro la recorre. */
  selectedId: string | null;
  activeStopId: string | null;
  onSelectPro: (id: string | null) => void;
  onActivateStop: (id: string | null) => void;
}

const positionOf = (p: ProfesionalDia): LatLng | null =>
  p.ruta?.posicionLatitud != null && p.ruta.posicionLongitud != null ? { lat: Number(p.ruta.posicionLatitud), lng: Number(p.ruta.posicionLongitud) } : null;

const floating = "shadow-[0_8px_28px_rgb(20_20_20/0.14)]";

/**
 * Mapa de coordinación con los elementos del software de rutas: mapa limpio,
 * pines 3D numerados, el carro de cada profesional en su última posición, la
 * ruta trazada, tráfico a pedido y la leyenda de los pines.
 */
export function CoordinatorMap({ pros, selectedId, activeStopId, onSelectPro, onActivateStop }: CoordinatorMapProps) {
  const [liveTraffic, setLiveTraffic] = useState(false);
  const [replay, setReplay] = useState(0);

  const traces = useMemo<TraceRoute[]>(
    () =>
      pros
        .filter((p) => p.ruta?.polilinea)
        .map((p) => ({
          id: p.profesionalId,
          color: professionalColor(p.color),
          points: decodePolyline(p.ruta!.polilinea!).map((c) => ({ lat: c.latitude, lng: c.longitude })),
        })),
    [pros],
  );
  const selected = pros.find((p) => p.profesionalId === selectedId) ?? null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#f2f4f7]">
      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={12}
        styles={MAP_STYLE}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        zoomControlOptions={{ position: ControlPosition.RIGHT_BOTTOM }}
        clickableIcons={false}
        onClick={() => onActivateStop(null)}
        className="h-full w-full"
      >
        {pros.map((p) => {
          const color = professionalColor(p.color);
          const other = !!selectedId && p.profesionalId !== selectedId;
          const pending = p.paradas.filter((s) => !isDone(s));
          const last = pending[pending.length - 1]?.id;
          return p.paradas.filter(isLocatedStop).map((s) => {
            const n = p.paradas.indexOf(s) + 1;
            const active = s.id === activeStopId;
            const done = isDone(s);
            const icon: RouteIconName = s.geoEstado === "aproximada" ? "por-confirmar" : s.id === last && pending.length > 1 ? "llegada" : "visita";
            return (
              <MapMarker
                key={s.id}
                position={pointOf(s)}
                zIndex={active ? 60 : other ? 5 : done ? 10 : 40 - n}
                title={s.paciente}
                onClick={() => {
                  onSelectPro(p.profesionalId);
                  onActivateStop(active ? null : s.id);
                }}
              >
                <RoutePin
                  icon={icon}
                  color={color}
                  number={n}
                  done={done}
                  active={active}
                  faded={other || done}
                  bubble={active ? { title: s.paciente, detail: s.direccion ?? "Sin dirección" } : undefined}
                />
              </MapMarker>
            );
          });
        })}

        {pros.map((p) => {
          const pos = positionOf(p);
          if (!pos || p.ruta?.estado !== "en_curso") return null;
          const other = !!selectedId && p.profesionalId !== selectedId;
          return (
            <MapMarker key={`car-${p.profesionalId}`} position={pos} zIndex={other ? 6 : 70} title={p.profesional} onClick={() => onSelectPro(p.profesionalId)}>
              <RoutePin icon="carro" color={professionalColor(p.color)} label={firstName(p.profesional)} faded={other} />
            </MapMarker>
          );
        })}

        <RouteTraces routes={traces} activeId={selected?.ruta?.polilinea ? selectedId : null} replay={replay} />
        <LiveTraffic on={liveTraffic} />
        <FitBounds pros={pros} selectedId={selectedId} traces={traces} />
        <FollowStop pros={pros} activeStopId={activeStopId} />
      </Map>

      <button
        type="button"
        onClick={() => setLiveTraffic((t) => !t)}
        aria-pressed={liveTraffic}
        title="Tráfico ahora"
        className={cn(
          floating,
          "absolute right-3 top-3 flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-[.97]",
          liveTraffic ? "bg-[#141414] text-white" : "bg-white text-[#141414]/80 hover:bg-[#f1f2f4]",
        )}
      >
        <RouteIcon3D name="trafico" size={22}>
          <Layers className="h-4 w-4" />
        </RouteIcon3D>
        Tráfico ahora
      </button>

      {selected?.ruta?.polilinea && (
        <button
          type="button"
          onClick={() => setReplay((n) => n + 1)}
          title="Ver el recorrido otra vez"
          className={cn(floating, "absolute left-3 top-3 flex min-h-11 items-center gap-2 rounded-full bg-white pl-2 pr-4 text-sm font-semibold text-[#141414]/80 transition hover:bg-[#f1f2f4] active:scale-[.97]")}
        >
          <RouteIcon3D name="carro" size={26}>
            <RotateCcw className="h-4 w-4" />
          </RouteIcon3D>
          Ver el recorrido
        </button>
      )}

      <Legend />
    </div>
  );
}

const PINS: { icon: RouteIconName; title: string; detail: string }[] = [
  { icon: "carro", title: "Profesional en ruta", detail: "Su última posición. Se actualiza cada medio minuto." },
  { icon: "visita", title: "Visita", detail: "Casa del paciente. El número es el orden de la ruta." },
  { icon: "llegada", title: "Última visita", detail: "Donde termina la ruta del día." },
  { icon: "por-confirmar", title: "Dirección aproximada", detail: "Google no la ubicó con exactitud: conviene revisarla." },
];

const LEGEND_KEY = "rutas.leyenda.vista";

function readSeen() {
  try {
    return localStorage.getItem(LEGEND_KEY) === "1";
  } catch {
    return false;
  }
}

/** Qué significa cada pin: se abre sola la primera vez y luego queda como botón (como en el software de rutas). */
function Legend() {
  const [open, setOpen] = useState(() => !readSeen());
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(LEGEND_KEY, "1");
    } catch {
      // Sin almacenamiento: se volverá a abrir la próxima vez.
    }
  };
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(floating, "absolute bottom-3 left-3 flex min-h-10 items-center gap-2 rounded-full bg-white pl-3 pr-4 text-sm font-semibold text-[#141414]/80 hover:bg-[#f1f2f4]")}
      >
        <Info className="h-4 w-4" /> ¿Qué significa cada pin?
      </button>
    );
  }
  return (
    <section aria-label="Qué significa cada pin" className={cn(floating, "absolute bottom-3 left-3 w-[300px] max-w-[calc(100%-24px)] rounded-3xl bg-white p-4 animate-in fade-in slide-in-from-bottom-2")}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-base font-bold text-[#141414]">Qué significa cada pin</p>
        <button type="button" aria-label="Cerrar" onClick={close} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-xl text-[#5f646c] hover:bg-[#f1f2f4]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-2.5">
        {PINS.map((p) => (
          <li key={p.icon} className="flex items-start gap-3">
            <RouteIcon3D name={p.icon} size={34}>
              <span className="mt-1 h-6 w-6 shrink-0 rounded-full border-[3px] border-white bg-[#141414] shadow" />
            </RouteIcon3D>
            <span>
              <span className="block text-sm font-bold text-[#141414]">{p.title}</span>
              <span className="block text-xs leading-snug text-[#5f646c]">{p.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-[#e6e7ea] pt-3 text-xs text-[#5f646c]">Cada profesional tiene su color: el de su número y el de su ruta.</p>
    </section>
  );
}

function LiveTraffic({ on }: { on: boolean }) {
  const map = useMap();
  const layer = useMemo(() => (map ? new google.maps.TrafficLayer() : null), [map]);
  useEffect(() => {
    layer?.setMap(on && map ? map : null);
    return () => layer?.setMap(null);
  }, [layer, on, map]);
  return null;
}

/** Encuadra lo que importa: el profesional elegido o todos. */
function FitBounds({ pros, selectedId, traces }: { pros: ProfesionalDia[]; selectedId: string | null; traces: TraceRoute[] }) {
  const map = useMap();
  const shown = selectedId ? pros.filter((p) => p.profesionalId === selectedId) : pros;
  const signature = `${selectedId}|${shown.map((p) => `${p.profesionalId}:${p.paradas.length}:${p.ruta?.polilinea?.length ?? 0}`).join()}`;
  useEffect(() => {
    if (!map) return;
    const points: LatLng[] = [];
    for (const p of shown) {
      points.push(...p.paradas.filter(isLocatedStop).map(pointOf));
      const pos = positionOf(p);
      if (pos) points.push(pos);
      points.push(...(traces.find((t) => t.id === p.profesionalId)?.points ?? []));
    }
    if (!points.length) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((pt) => bounds.extend(pt));
    const t = setTimeout(() => map.fitBounds(bounds, { top: 90, right: 50, bottom: 60, left: 50 }), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);
  return null;
}

/** Al elegir una visita fuera de la vista, el mapa la trae. */
function FollowStop({ pros, activeStopId }: { pros: ProfesionalDia[]; activeStopId: string | null }) {
  const map = useMap();
  useEffect(() => {
    const stop = pros.flatMap((p) => p.paradas).find((s) => s.id === activeStopId);
    if (map && stop && isLocatedStop(stop) && !map.getBounds()?.contains(pointOf(stop))) map.panTo(pointOf(stop));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, activeStopId]);
  return null;
}
