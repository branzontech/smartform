/**
 * Planes de sesiones: citas que se repiten para un paciente crónico o en
 * terapia (cada N días, ciertos días de la semana o mensual), con uno o varios
 * profesionales. Tipos, cliente de /api/agenda/planes y textos del plan.
 */
import type { Cita, Fetcher, Modality, NewCita } from "./agenda";

export type Frequency = "cada_n_dias" | "semanal" | "mensual";

/** Hora y profesional; en la semanal, de un día de la semana (1 = lunes … 7 = domingo). */
export interface Turn {
  dia: number | null;
  hora: string;
  profesionalId: string;
}

export interface Recurrence {
  frecuencia: Frequency;
  cadaDias?: number | null;
  cadaSemanas?: number | null;
  turnos: Turn[];
  desde: string;
  sesiones?: number | null;
  hasta?: string | null;
}

/** Datos de las citas del plan: los de una cita suelta, sin profesional ni hora. */
export type PlanCita = Omit<NewCita, "profesionalId" | "inicio">;

export interface Alternative {
  fecha: string;
  hora: string;
  inicio: string;
  sedeId: string | null;
}

/** Una sesión de la vista previa: lo pedido, por qué no se puede (si es el caso) y el cupo libre más cercano. */
export interface SessionCheck {
  sesion: number;
  fecha: string;
  hora: string;
  inicio: string;
  profesionalId: string;
  profesional: string;
  sedeId: string | null;
  problema: string | null;
  alternativa: Alternative | null;
}

/** La sesión que se agenda, tal como la dejó quien agenda. */
export interface ChosenSession {
  inicio: string;
  profesionalId: string;
}

export type PlanState = "activo" | "terminado" | "cancelado";

export interface PlanSummary {
  id: string;
  tipoCita: string | null;
  motivo: string;
  modalidad: Modality;
  creadoEn: string;
  total: number;
  atendidas: number;
  pendientes: number;
  proxima: string | null;
  estado: PlanState;
}

export interface PlanDetail {
  id: string;
  pacienteId: string;
  paciente: string;
  tipoCitaId: string | null;
  tipoCita: string | null;
  motivo: string;
  modalidad: Modality;
  duracionMin: number;
  recurrencia: Recurrence;
  estado: PlanState;
  creadoEn: string;
  citas: Cita[];
}

export const PLAN_STATE_LABEL: Record<PlanState, string> = { activo: "Activo", terminado: "Terminado", cancelado: "Cancelado" };

export const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const joinWords = (words: string[]) => (words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} y ${words[words.length - 1]}`);
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1);

/** La frecuencia en palabras: «Cada 2 días», «Lunes y miércoles», «Cada 2 semanas: martes», «Cada mes». */
export function frequencyText(r: Pick<Recurrence, "frecuencia" | "cadaDias" | "cadaSemanas" | "turnos">): string {
  if (r.frecuencia === "cada_n_dias") return r.cadaDias === 1 ? "Todos los días" : `Cada ${r.cadaDias} días`;
  if (r.frecuencia === "mensual") return "Cada mes";
  const days = [...r.turnos].sort((a, b) => (a.dia ?? 0) - (b.dia ?? 0)).map((t) => WEEKDAY_NAMES[(t.dia ?? 1) - 1]);
  const list = joinWords(days);
  return (r.cadaSemanas ?? 1) > 1 ? `Cada ${r.cadaSemanas} semanas: ${list}` : capitalize(list);
}

/** «Sesión 3 de 12», o null si la cita no es de un plan. */
export function sessionLabel(cita: Pick<Cita, "planId" | "planSesion" | "planTotal">): string | null {
  if (!cita.planId || !cita.planSesion) return null;
  return cita.planTotal ? `Sesión ${cita.planSesion} de ${cita.planTotal}` : `Sesión ${cita.planSesion}`;
}

/**
 * Lo que se agenda a partir de la vista previa: las sesiones sin problema tal
 * cual, las que tienen problema con su alternativa; las sin alternativa (o que
 * quien agenda quitó) quedan fuera.
 */
export function chosenFrom(checks: SessionCheck[], removed: ReadonlySet<number> = new Set()): ChosenSession[] {
  return checks
    .filter((s) => !removed.has(s.sesion) && (!s.problema || s.alternativa))
    .map((s) => ({ inicio: s.problema && s.alternativa ? s.alternativa.inicio : s.inicio, profesionalId: s.profesionalId }));
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

/** Cliente de /api/agenda/planes sobre el fetcher de cada plataforma. */
export function createPlansApi(fetcher: Fetcher) {
  return {
    previewPlan: (input: { cita?: PlanCita; planId?: string; recurrencia: Recurrence }) =>
      fetcher<{ sesiones: SessionCheck[] }>("/api/agenda/planes/vista-previa", json("POST", input)),
    createPlan: (input: { cita: PlanCita; recurrencia: Recurrence; sesiones: ChosenSession[] }) =>
      fetcher<{ id: string; citas: number }>("/api/agenda/planes", json("POST", input)),
    extendPlan: (id: string, input: { recurrencia: Recurrence; sesiones: ChosenSession[] }) =>
      fetcher<{ id: string; citas: number }>(`/api/agenda/planes/${id}/extender`, json("POST", input)),
    fetchPlan: (id: string) => fetcher<PlanDetail>(`/api/agenda/planes/${id}`),
    fetchPatientPlans: (pacienteId: string) => fetcher<PlanSummary[]>(`/api/agenda/pacientes/${pacienteId}/planes`),
    changePlanProfessional: (id: string, input: { profesionalId: string; desdeSesion?: number }) =>
      fetcher<{ cambiadas: number }>(`/api/agenda/planes/${id}/cambiar-profesional`, json("POST", input)),
    cancelPlan: (id: string, input: { motivo: string; por: "paciente" | "ips" }) =>
      fetcher<{ canceladas: number }>(`/api/agenda/planes/${id}/cancelar`, json("POST", input)),
  };
}
