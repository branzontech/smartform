/**
 * Órdenes médicas de una atención: tipos, etiquetas y cliente de /api/ordenes.
 * Lo comparten la app del profesional y Ker Hub web.
 */
import type { Fetcher } from "./agenda";

export type OrderType = "medicamento" | "laboratorio" | "imagenologia" | "interconsulta" | "procedimiento";
export type Priority = "routine" | "urgent" | "asap" | "stat";

export const ORDER_TYPES: OrderType[] = ["medicamento", "laboratorio", "imagenologia", "procedimiento", "interconsulta"];

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  medicamento: "Fórmula de medicamentos",
  laboratorio: "Laboratorio clínico",
  imagenologia: "Imágenes diagnósticas",
  procedimiento: "Procedimientos",
  interconsulta: "Interconsulta",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  routine: "Rutinaria",
  urgent: "Urgente",
  asap: "Prioritaria",
  stat: "Inmediata",
};

/** Las mismas listas de la fórmula de la web (y del servidor). */
export const DOSE_UNITS = ["mg", "ml", "g", "mcg", "UI", "gotas", "tabletas", "cápsulas"];
export const ROUTES = ["oral", "IV", "IM", "SC", "tópica", "inhalatoria", "rectal", "sublingual", "oftálmica", "ótica"];
export const ROUTE_LABEL: Record<string, string> = {
  oral: "Oral",
  IV: "Intravenosa",
  IM: "Intramuscular",
  SC: "Subcutánea",
  tópica: "Tópica",
  inhalatoria: "Inhalatoria",
  rectal: "Rectal",
  sublingual: "Sublingual",
  oftálmica: "Oftálmica",
  ótica: "Ótica",
};
/** Frecuencias habituales (cada N horas) para elegir rápido. */
export const FREQUENCIES = [4, 6, 8, 12, 24];

export interface MedicationInput {
  productoId: string | null;
  nombre: string;
  dosis: number;
  unidad: string;
  via: string;
  frecuenciaHoras: number;
  duracionDias: number;
  indicaciones: string | null;
}

export interface OrderInput {
  admisionId: string;
  tipo: OrderType;
  prioridad: Priority;
  indicaciones: string | null;
  diagnostico: { codigo: string; descripcion: string } | null;
  medicamentos?: MedicationInput[];
  procedimientos?: { procedimientoId: string; cantidad: number; notas: string | null }[];
  especialidad?: string | null;
}

/** Ítem guardado: fórmula (con sus datos numéricos), procedimiento CUPS o interconsulta. */
export interface OrderItem {
  nombre?: string;
  dosis?: string;
  unidad?: string;
  via?: string;
  frecuencia?: string;
  duracion?: string;
  indicaciones?: string;
  frecuencia_horas?: number;
  duracion_dias?: number;
  codigo?: string;
  descripcion?: string;
  cantidad?: number;
  notas?: string;
  especialidad?: string;
  motivo?: string;
}

export interface Order {
  id: string;
  numero: string;
  tipo: OrderType;
  estado: string;
  estadoRegistro: "active" | "entered-in-error" | "superseded";
  prioridad: Priority;
  items: OrderItem[];
  indicaciones: string | null;
  diagnosticoCodigo: string | null;
  diagnosticoDescripcion: string | null;
  medicoNombre: string;
  propia: boolean;
  especialidad: string | null;
  fecha: string;
  /** Atención a la que pertenece (null en órdenes sueltas antiguas). */
  admisionId: string | null;
}

export interface CatalogProcedure {
  id: string;
  codigo: string;
  descripcion: string;
  tipo: string;
}

export interface CatalogMedication {
  id: string;
  nombre: string;
  principioActivo: string | null;
  atc: string | null;
  forma: string | null;
  concentracion: string | null;
  unidad: string | null;
  via: string | null;
}

/** Una línea legible de un ítem: «Losartán 50 mg · 50 mg oral c/12 horas por 30 días». */
export function describeItem(tipo: OrderType, i: OrderItem): string {
  if (tipo === "medicamento") return `${i.nombre} · ${i.dosis} ${i.unidad} ${ROUTE_LABEL[i.via ?? ""]?.toLowerCase() ?? i.via} ${i.frecuencia} por ${i.duracion}`;
  if (tipo === "interconsulta") return `${i.especialidad}: ${i.motivo}`;
  return `${i.codigo} ${i.descripcion}${i.cantidad && i.cantidad > 1 ? ` × ${i.cantidad}` : ""}`;
}

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export function createOrdersApi(fetcher: Fetcher) {
  return {
    fetchAdmissionOrders: (admisionId: string) => fetcher<Order[]>(`/api/ordenes/admisiones/${admisionId}`),
    /** Órdenes del paciente en todas sus atenciones, de la más reciente a la más antigua (las últimas 300). */
    fetchPatientOrders: (pacienteId: string) => fetcher<Order[]>(`/api/ordenes/pacientes/${pacienteId}`),
    searchProcedures: (tipo: "laboratorio" | "imagenologia" | "procedimiento", q: string) =>
      fetcher<CatalogProcedure[]>(`/api/ordenes/catalogo/procedimientos?tipo=${tipo}&q=${encodeURIComponent(q)}`),
    searchMedications: (q: string) => fetcher<CatalogMedication[]>(`/api/ordenes/catalogo/medicamentos?q=${encodeURIComponent(q)}`),
    createOrder: (input: OrderInput) => fetcher<{ id: string; numero: string }>("/api/ordenes", send("POST", input)),
    cancelOrder: (id: string, motivo: string) => fetcher<{ id: string; anulada: true }>(`/api/ordenes/${id}/anular`, send("POST", { motivo })),
  };
}
