/**
 * Rutas del profesional (módulo «rutas»): tipos, cliente de /api/rutas y
 * utilidades del recorrido. Lo comparten la app del profesional y Doctor Ker web.
 */
import type { CitaState } from "./agenda";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface Tramo {
  citaId: string;
  metros: number;
  segundos: number;
}

export interface Parada {
  id: string;
  estado: CitaState;
  inicio: string;
  fin: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  geoEstado: "pendiente" | "ubicada" | "aproximada" | "no_encontrada" | "sin_direccion" | "no_aplica";
  admisionId: string | null;
  pacienteId: string;
  paciente: string;
  telefono: string | null;
  servicio: string | null;
  /** Desde la parada anterior (o el punto de salida) hasta esta, si la ruta ya se calculó. */
  tramo: Tramo | null;
}

export interface Ruta {
  id: string;
  estado: "en_curso" | "terminada";
  iniciadaAt: string;
  terminadaAt: string | null;
  distanciaM: number | null;
  duracionS: number | null;
  polilinea: string | null;
  recalculadaAt: string;
}

export interface MiRuta {
  fecha: string;
  ruta: Ruta | null;
  paradas: Parada[];
}

export interface Posicion {
  latitud: number;
  longitud: number;
  precision?: number | null;
}

export type Velocidad = "NORMAL" | "SLOW" | "TRAFFIC_JAM";

/** Tramo del trazado (índices de puntos de la polilínea) con su velocidad por tráfico. */
export interface TraficoTramo {
  inicio: number;
  fin: number;
  velocidad: Velocidad;
}

/** Un camino hasta la próxima visita: el recomendado o una alterna. */
export interface Camino {
  segundos: number;
  segundosSinTrafico: number;
  metros: number;
  polilinea: string | null;
  descripcion: string | null;
  trafico: TraficoTramo[];
}

/** Camino hasta una visita concreta, con sus alternas y el punto de destino. */
export type CaminoCita = Camino & { alternativas: Camino[]; destino: { latitud: number; longitud: number } };

/** Lo que se ve en el mapa desde donde está el profesional (calculado en vivo, no se guarda). */
/** «optimo»: el orden que menos recorre (calculado por Google); «citas»: el de las horas de cita. */
export type ModoRuta = "optimo" | "citas";

export interface VistaRuta extends MiRuta {
  vista: {
    modo: ModoRuta;
    /** Ids de las visitas pendientes en el orden propuesto. */
    orden: string[];
    polilinea: string | null;
    trafico: TraficoTramo[];
    distanciaM: number;
    duracionS: number;
    tramos: Tramo[];
  } | null;
  siguiente: (Camino & { citaId: string; alternativas: Camino[] }) | null;
}

/** Visita de un profesional en el día del coordinador. */
export type ParadaDia = Omit<Parada, "tramo"> & { profesionalId: string; profesional: string; color: string | null };

/** Ruta en curso (o terminada) de un profesional, con su última posición conocida. */
export interface RutaDia {
  id: string;
  estado: "en_curso" | "terminada";
  iniciadaAt: string;
  terminadaAt: string | null;
  distanciaM: number | null;
  duracionS: number | null;
  polilinea: string | null;
  orden: string[];
  tramos: Tramo[];
  recalculadaAt: string;
  posicionLatitud: number | null;
  posicionLongitud: number | null;
  posicionAt: string | null;
}

export interface ProfesionalDia {
  profesionalId: string;
  profesional: string;
  color: string | null;
  ruta: RutaDia | null;
  /** En el orden de su ruta si ya salió; si no, por hora de cita. */
  paradas: ParadaDia[];
  resueltas: number;
  pendientes: number;
}

/** El día de rutas de la empresa, para coordinación. */
export interface DiaRutas {
  fecha: string;
  profesionales: ProfesionalDia[];
}

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export function createRoutesApi(fetcher: Fetcher) {
  return {
    fetchMyRoute: (fecha?: string) => fetcher<MiRuta>(`/api/rutas/mi-ruta${fecha ? `?fecha=${fecha}` : ""}`),
    /** Recorrido con tráfico y camino a la próxima visita desde donde está (en vivo). */
    viewMyRoute: (pos: Posicion, orden: ModoRuta = "optimo") => fetcher<VistaRuta>("/api/rutas/mi-ruta/vista", send("POST", { ...pos, orden })),
    /** Camino desde donde está hasta una visita (vista previa en la ficha de la cita). */
    fetchLegToCita: (citaId: string, pos: Posicion) => fetcher<CaminoCita>(`/api/rutas/citas/${citaId}/camino`, send("POST", pos)),
    /** Inicia la ruta o la recalcula desde donde está el profesional. */
    computeMyRoute: (pos: Posicion, orden: ModoRuta = "optimo") => fetcher<MiRuta>("/api/rutas/mi-ruta/calcular", send("POST", { ...pos, orden })),
    sendPosition: (pos: Posicion) => fetcher<{ guardada: boolean }>("/api/rutas/mi-ruta/posicion", send("POST", pos)),
    finishMyRoute: () => fetcher<MiRuta>("/api/rutas/mi-ruta/terminar", send("POST")),
    /** Coordinación: todos los profesionales con visitas a domicilio ese día. */
    fetchDay: (fecha?: string) => fetcher<DiaRutas>(`/api/rutas/dia${fecha ? `?fecha=${fecha}` : ""}`),
  };
}

const PENDING: CitaState[] = ["programada", "confirmada", "en_camino", "en_atencion"];
export const isPending = (p: Pick<Parada, "estado">) => PENDING.includes(p.estado);
export const isLocated = (p: Pick<Parada, "latitud" | "longitud">) => p.latitud != null && p.longitud != null;

/** La próxima visita: la primera pendiente en el orden del día. */
export const nextStop = (paradas: Parada[]): Parada | null => paradas.find(isPending) ?? null;

/**
 * Minutos que llegaría tarde a la hora de la cita (con 10 min de gracia), o 0.
 * Sirve para avisar cuando el orden más corto no respeta una cita.
 */
export function lateMinutes(eta: string, inicio: string): number {
  const cita = new Date(Date.parse(inicio) - 5 * 3_600_000).toISOString().slice(11, 16);
  const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  const late = toMin(eta) - toMin(cita);
  return late > 10 ? late : 0;
}

/** «8 min», «1 h 05 min». */
export function formatDuration(seconds: number | null | undefined): string {
  const min = Math.max(1, Math.round((seconds ?? 0) / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
}

/** «850 m», «2,1 km». */
export function formatDistance(meters: number | null | undefined): string {
  const m = Math.max(0, meters ?? 0);
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Hora de llegada estimada en hora de Colombia («14:52»). */
export function arrivalAt(seconds: number, now = Date.now()): string {
  return new Date(now + seconds * 1000 - 5 * 3_600_000).toISOString().slice(11, 16);
}

/** Decodifica la polilínea de Google (algoritmo estándar) a coordenadas. */
export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let shift = 0;
      let result = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index < encoded.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

type Coord = { latitude: number; longitude: number };

/**
 * Corta el trazado en tramos según el tráfico, para pintarlo verde, naranja o
 * rojo. Lo que Google no clasifica queda como normal.
 */
export function trafficSegments(points: Coord[], intervals: TraficoTramo[]): { coords: Coord[]; velocidad: Velocidad }[] {
  if (points.length < 2) return [];
  if (intervals.length === 0) return [{ coords: points, velocidad: "NORMAL" }];
  const out: { coords: Coord[]; velocidad: Velocidad }[] = [];
  let cursor = 0;
  for (const it of [...intervals].sort((a, b) => a.inicio - b.inicio)) {
    const start = Math.max(it.inicio, 0);
    const end = Math.min(it.fin, points.length - 1);
    if (start > cursor) out.push({ coords: points.slice(cursor, start + 1), velocidad: "NORMAL" });
    if (end > start) out.push({ coords: points.slice(start, end + 1), velocidad: it.velocidad });
    cursor = Math.max(cursor, end);
  }
  if (cursor < points.length - 1) out.push({ coords: points.slice(cursor), velocidad: "NORMAL" });
  return out.filter((s) => s.coords.length > 1);
}

/** «8 min de demora por tráfico», o null si el tráfico no agrega tiempo apreciable. */
export function trafficDelay(c: Pick<Camino, "segundos" | "segundosSinTrafico">): string | null {
  const extra = c.segundos - c.segundosSinTrafico;
  return extra >= 120 ? `${formatDuration(extra)} de demora por tráfico` : null;
}

/** Enlaces para navegar a una parada con la app que prefiera el profesional. */
export function navigationLinks(p: { latitud: number; longitud: number }) {
  const at = `${p.latitud},${p.longitud}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${at}&travelmode=driving`,
    waze: `https://waze.com/ul?ll=${at}&navigate=yes`,
    apple: `https://maps.apple.com/?daddr=${at}&dirflg=d`,
  };
}
