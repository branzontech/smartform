/**
 * Reglas del contrato con pagadores (Decreto 441 de 2022, Colombia):
 * modalidades, estado por fechas, requisitos para activar y cálculo de tarifas.
 * Sin React ni base de datos: se prueba aparte (contract-model.test.ts).
 */

export type Modality = "evento" | "pgp" | "paquete" | "capita" | "particular";
export type StoredStatus = "borrador" | "activo" | "bloqueado" | "terminado" | "liquidado";
export type PayerType = "eps" | "aseguradora" | "prepagada" | "ente_territorial" | "arl" | "soat" | "empresa" | "particular" | "otro";

export const MODALITY_LABEL: Record<Modality, string> = {
  evento: "Por evento",
  pgp: "Pago global prospectivo (PGP)",
  paquete: "Paquete o conjunto integral",
  capita: "Capitación",
  particular: "Particular",
};

/** Modalidades prospectivas: exigen nota técnica y ajuste de riesgo (art. 2.5.3.4.2.3). */
export const PROSPECTIVE: ReadonlySet<Modality> = new Set(["pgp", "paquete", "capita"]);

export const PAYER_TYPE_LABEL: Record<PayerType, string> = {
  eps: "EPS",
  aseguradora: "Aseguradora",
  prepagada: "Medicina prepagada",
  ente_territorial: "Ente territorial",
  arl: "ARL",
  soat: "SOAT",
  empresa: "Empresa",
  particular: "Particular",
  otro: "Otro",
};

export const PGP_PERIODS = ["mensual", "bimestral", "trimestral", "semestral", "anual"] as const;
export type PgpPeriod = (typeof PGP_PERIODS)[number];

/** Días antes del fin en que un contrato pasa a «Por vencer». */
export const EXPIRING_DAYS = 45;
const DAY_MS = 86_400_000;

export type DisplayStatus = "borrador" | "por_iniciar" | "vigente" | "por_vencer" | "vencido" | "bloqueado" | "terminado" | "liquidado";
export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  borrador: "Borrador",
  por_iniciar: "Por iniciar",
  vigente: "Vigente",
  por_vencer: "Por vencer",
  vencido: "Vencido",
  bloqueado: "Bloqueado",
  terminado: "Terminado",
  liquidado: "Liquidado",
};

export const STATUS_TONE: Record<DisplayStatus, StatusTone> = {
  borrador: "neutral",
  por_iniciar: "info",
  vigente: "success",
  por_vencer: "warning",
  vencido: "danger",
  bloqueado: "neutral",
  terminado: "neutral",
  liquidado: "neutral",
};

/** Fecha YYYY-MM-DD como día local, sin corrimiento por zona horaria. */
export const parseDay = (d: string) => new Date(d.length === 10 ? `${d}T00:00:00` : d);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Estado que ve el usuario: el guardado y, si está activo, el que dicen las fechas. */
export function displayStatus(
  c: { estado: StoredStatus | string; fecha_inicio: string; fecha_fin: string | null },
  today = new Date(),
): DisplayStatus {
  if (c.estado !== "activo") return (["borrador", "bloqueado", "terminado", "liquidado"].includes(c.estado) ? c.estado : "borrador") as DisplayStatus;
  const now = startOfDay(today).getTime();
  if (parseDay(c.fecha_inicio).getTime() > now) return "por_iniciar";
  if (!c.fecha_fin) return "vigente";
  const daysLeft = Math.round((parseDay(c.fecha_fin).getTime() - now) / DAY_MS);
  if (daysLeft < 0) return "vencido";
  if (daysLeft <= EXPIRING_DAYS) return "por_vencer";
  return "vigente";
}

/** Lo mínimo para activar un contrato. */
export interface ActivationInput {
  pagador_id: string | null;
  nombre_convenio: string;
  numero_contrato: string;
  objeto: string;
  tipo_contratacion: Modality;
  fecha_inicio: string;
  fecha_fin: string;
  tarifario_id: string | null;
  plazo_pago_dias: string;
  pgp_valor_periodo: string;
  pgp_periodicidad: string;
  pgp_poblacion: string;
  numero_usuarios: string;
  valor_por_usuario: string;
  paquetes: number;
}

/**
 * Número escrito como se escribe en Colombia: punto para miles y coma para decimales
 * («1.200.000», «36,6»). Un punto que no agrupa de a tres se toma como decimal («2.5»).
 * Vacío = null; lo que no es número = NaN.
 */
export function parseAmount(raw: string): number | null {
  const v = raw.trim().replace(/\s/g, "").replace(/\$/g, "");
  if (v === "") return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(v)) return Number(v.replace(/\./g, "").replace(",", "."));
  if (/^-?\d+(,\d+)?$/.test(v)) return Number(v.replace(",", "."));
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return NaN;
}

const blank = (v: string | null | undefined) => !v || v.trim() === "";
const positive = (v: string) => (parseAmount(v) ?? 0) > 0;

/** Lo que falta para activar el contrato. Vacío = se puede activar. */
export function activationIssues(c: ActivationInput): string[] {
  const issues: string[] = [];
  if (!c.pagador_id) issues.push("Elegir el pagador");
  if (blank(c.nombre_convenio)) issues.push("Nombre del convenio");
  if (c.tipo_contratacion !== "particular") {
    if (blank(c.numero_contrato)) issues.push("Número del contrato");
    if (blank(c.objeto)) issues.push("Objeto del contrato");
    if (blank(c.fecha_fin)) issues.push("Fecha de fin (plazo del contrato)");
    if (blank(c.plazo_pago_dias)) issues.push("Plazo de pago en días");
  }
  if (blank(c.fecha_inicio)) issues.push("Fecha de inicio");
  if (!blank(c.fecha_inicio) && !blank(c.fecha_fin) && parseDay(c.fecha_fin) < parseDay(c.fecha_inicio)) {
    issues.push("La fecha de fin es anterior a la de inicio");
  }
  if ((c.tipo_contratacion === "evento" || c.tipo_contratacion === "particular") && !c.tarifario_id) {
    issues.push("Manual tarifario de procedimientos");
  }
  if (c.tipo_contratacion === "pgp") {
    if (!positive(c.pgp_valor_periodo)) issues.push("Valor del PGP por periodo");
    if (blank(c.pgp_periodicidad)) issues.push("Periodicidad del PGP");
    if (!positive(c.pgp_poblacion)) issues.push("Población del PGP");
  }
  if (c.tipo_contratacion === "capita") {
    if (!positive(c.numero_usuarios)) issues.push("Número de usuarios capitados");
    if (!positive(c.valor_por_usuario)) issues.push("Valor por usuario al mes");
  }
  if (c.tipo_contratacion === "paquete" && c.paquetes === 0) issues.push("Al menos un paquete con su valor");
  return issues;
}

/** El manual tarifario SOAT en UVB se redondea a la centena más cercana (Anexo técnico 1, Decreto 780 de 2016). */
export const roundToHundred = (n: number) => Math.round(n / 100) * 100;

export interface PriceInput {
  /** Valor del servicio en el manual base. */
  base: number;
  /** Unidad del manual: pesos o UVB. */
  unit: "COP" | "UVB" | string;
  /** Valor de la UVB del año de la prestación (obligatorio si la unidad es UVB). */
  uvb?: number | null;
  /** Ajuste pactado sobre el manual, en porcentaje (−10 = 10 % menos). */
  pct: number;
}

/** Tarifa del contrato para un servicio: manual base convertido a pesos y ajustado. Null si falta la UVB. */
export function contractPrice({ base, unit, uvb, pct }: PriceInput): number | null {
  let pesos = base;
  if (unit === "UVB") {
    if (!uvb || uvb <= 0) return null;
    pesos = roundToHundred(base * uvb);
  }
  const adjusted = pesos * (1 + pct / 100);
  return unit === "UVB" ? roundToHundred(adjusted) : Math.round(adjusted);
}
