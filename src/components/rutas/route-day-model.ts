/**
 * Lógica de la vista del coordinador (Rutas del día): estado de cada
 * profesional, visitas atrasadas, última señal y enlaces a Google Maps.
 */
import type { ParadaDia, ProfesionalDia } from "./rutas-api";
import type { LatLng } from "./MapMarker";

/** Minutos de gracia antes de dar una visita por atrasada. */
const LATE_GRACE_MIN = 10;
/** Google Maps abre máximo 10 paradas por enlace (destino incluido). */
const MAPS_STOPS_PER_LINK = 10;

const NOT_STARTED: ParadaDia["estado"][] = ["programada", "confirmada"];
const DONE: ParadaDia["estado"][] = ["atendida", "no_asistio"];

export const isDone = (p: Pick<ParadaDia, "estado">) => DONE.includes(p.estado);
export const isLocatedStop = (p: Pick<ParadaDia, "latitud" | "longitud">) => p.latitud != null && p.longitud != null;
export const pointOf = (p: Pick<ParadaDia, "latitud" | "longitud">): LatLng => ({ lat: Number(p.latitud), lng: Number(p.longitud) });
export const firstName = (name: string) => name.split(" ").slice(0, 2).join(" ");

/** Visitas que no han empezado y ya pasaron su hora (con gracia). */
export function lateStops(p: ProfesionalDia, now = new Date()): ParadaDia[] {
  const limit = now.getTime() - LATE_GRACE_MIN * 60_000;
  return p.paradas.filter((s) => NOT_STARTED.includes(s.estado) && Date.parse(s.inicio) < limit);
}

export type StatusTone = "success" | "info" | "warning" | "neutral";

/** Una línea con lo que está haciendo el profesional ahora. */
export function proStatus(p: ProfesionalDia, now = new Date()): { text: string; tone: StatusTone } {
  const late = lateStops(p, now).length;
  const lateText = late ? ` · ${late} ${late === 1 ? "visita atrasada" : "visitas atrasadas"}` : "";
  if (p.ruta?.estado === "terminada") return { text: "Terminó la ruta", tone: "neutral" };
  const attending = p.paradas.find((s) => s.estado === "en_atencion");
  if (attending) return { text: `Atendiendo a ${firstName(attending.paciente)}`, tone: "success" };
  const going = p.paradas.find((s) => s.estado === "en_camino");
  if (going) return { text: `Va donde ${firstName(going.paciente)}`, tone: "info" };
  if (p.paradas.length > 0 && p.pendientes === 0) return { text: "Visitas resueltas", tone: "neutral" };
  if (p.ruta?.estado === "en_curso") return { text: `En ruta${lateText}`, tone: late ? "warning" : "success" };
  return { text: `Sin salir${lateText}`, tone: late ? "warning" : "neutral" };
}

/** «ahora», «hace 3 min», «hace 1 h 30 min», o null sin señal. */
export function signalAgo(iso: string | null, now = new Date()): string | null {
  if (!iso) return null;
  const min = Math.floor((now.getTime() - Date.parse(iso)) / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h${min % 60 ? ` ${min % 60} min` : ""}`;
}

/**
 * Enlaces de Google Maps para seguir las visitas pendientes en orden (como en
 * el software de rutas): de a 10 paradas, cada uno sale de donde terminó el anterior.
 */
export function googleMapsLinks(origin: LatLng | null, points: LatLng[]): string[] {
  const coord = (p: LatLng) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  const links: string[] = [];
  let from = origin;
  for (let i = 0; i < points.length; i += MAPS_STOPS_PER_LINK) {
    const block = points.slice(i, i + MAPS_STOPS_PER_LINK);
    const destination = block[block.length - 1];
    const params = new URLSearchParams({ api: "1", destination: coord(destination), travelmode: "driving" });
    if (from) params.set("origin", coord(from));
    const middle = block.slice(0, -1);
    if (middle.length) params.set("waypoints", middle.map(coord).join("|"));
    links.push(`https://www.google.com/maps/dir/?${params}`);
    from = destination;
  }
  return links;
}
