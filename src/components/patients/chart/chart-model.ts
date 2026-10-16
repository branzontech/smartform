import { apiFetch } from "@/integrations/api/client";
import { createOrdersApi, type Order } from "@kerhub/core/ordenes";
import { STATE_LABEL, localDay, type Cita, type CitaState } from "@/components/agenda/agenda-api";

export const { fetchPatientOrders } = createOrdersApi(apiFetch);

export const chartKeys = {
  patient: (id: string) => ["patient", id] as const,
  admissions: (id: string) => ["patient", id, "admisiones"] as const,
  citas: (id: string) => ["agenda", "paciente", id] as const,
  orders: (id: string) => ["ordenes", "paciente", id] as const,
};

/** Vistas de la ficha (pestañas de carpeta). */
export type ChartView = "atenciones" | "registros" | "ordenes";
export const CHART_VIEWS: ChartView[] = ["atenciones", "registros", "ordenes"];

/** Grupo de estados para filtrar las atenciones. */
export type CitaGroup = "atendidas" | "pendientes" | "canceladas";
export const CITA_GROUP_LABEL: Record<CitaGroup, string> = { atendidas: "Atendidas", pendientes: "Pendientes", canceladas: "Canceladas" };

const GROUP_OF: Record<CitaState, CitaGroup> = {
  atendida: "atendidas",
  programada: "pendientes",
  confirmada: "pendientes",
  en_camino: "pendientes",
  en_atencion: "pendientes",
  cancelada_paciente: "canceladas",
  cancelada_ips: "canceladas",
  no_asistio: "canceladas",
  reprogramada: "canceladas",
};
export const citaGroup = (c: Cita): CitaGroup => GROUP_OF[c.estado];

export interface CitaFilter {
  groups: CitaGroup[];
  /** Nombre del profesional, o null para todos. */
  professional: string | null;
  search: string;
}

export const EMPTY_FILTER: CitaFilter = { groups: ["atendidas", "pendientes", "canceladas"], professional: null, search: "" };

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Atenciones que cumplen el filtro (estado, profesional y texto en servicio, profesional o motivo). */
export function filterCitas(citas: Cita[], f: CitaFilter): Cita[] {
  const term = fold(f.search.trim());
  return citas.filter(
    (c) =>
      f.groups.includes(citaGroup(c)) &&
      (!f.professional || c.profesional === f.professional) &&
      (!term || fold([c.servicio, c.profesional, c.motivo, STATE_LABEL[c.estado]].filter(Boolean).join(" ")).includes(term)),
  );
}

const monthName = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });

/** Mes de una fecha en hora de Colombia («Octubre de 2026»), para agrupar la línea de tiempo. */
export function monthOf(iso: string): string {
  const label = monthName.format(new Date(`${localDay(iso)}T12:00:00Z`));
  return label.charAt(0).toLocaleUpperCase("es") + label.slice(1);
}

/** Agrupa por mes conservando el orden recibido (de la más reciente a la más antigua). */
export function groupByMonth<T>(items: T[], dateOf: (item: T) => string): { month: string; items: T[] }[] {
  const groups: { month: string; items: T[] }[] = [];
  for (const item of items) {
    const month = monthOf(dateOf(item));
    const last = groups[groups.length - 1];
    if (last?.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }
  return groups;
}

/** La próxima cita pendiente (la más cercana desde ahora), o null. */
export function nextCita(citas: Cita[], now = Date.now()): Cita | null {
  return (
    citas
      .filter((c) => citaGroup(c) === "pendientes" && new Date(c.inicio).getTime() >= now)
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())[0] ?? null
  );
}

/** Órdenes de una atención, en el orden en que se dieron. */
export const ordersOf = (orders: Order[], admisionId: string | null) =>
  admisionId ? orders.filter((o) => o.admisionId === admisionId).sort((a, b) => a.fecha.localeCompare(b.fecha)) : [];
