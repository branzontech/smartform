import { apiFetch } from "@/integrations/api/client";

/** Estados de la cita (los mismos del servidor, src/agenda/rules.ts). */
export type CitaState =
  | "programada" | "confirmada" | "en_camino" | "en_atencion" | "atendida"
  | "cancelada_paciente" | "cancelada_ips" | "no_asistio" | "reprogramada";
export type Modality = "sede" | "domicilio" | "telemedicina";

export const STATE_LABEL: Record<CitaState, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  en_camino: "En camino",
  en_atencion: "En atención",
  atendida: "Atendida",
  cancelada_paciente: "Cancelada por el paciente",
  cancelada_ips: "Cancelada por la IPS",
  no_asistio: "No asistió",
  reprogramada: "Reprogramada",
};

export const STATE_TONE: Record<CitaState, "info" | "success" | "warning" | "error" | "neutral"> = {
  programada: "neutral",
  confirmada: "info",
  en_camino: "warning",
  en_atencion: "warning",
  atendida: "success",
  cancelada_paciente: "error",
  cancelada_ips: "error",
  no_asistio: "error",
  reprogramada: "neutral",
};

export const ACTIVE_STATES: CitaState[] = ["programada", "confirmada", "en_camino", "en_atencion"];

/** Siguientes estados que se pueden marcar a mano desde cada uno. */
export const NEXT_STATES: Partial<Record<CitaState, CitaState[]>> = {
  programada: ["confirmada", "en_camino", "en_atencion", "no_asistio", "cancelada_paciente", "cancelada_ips"],
  confirmada: ["en_camino", "en_atencion", "no_asistio", "cancelada_paciente", "cancelada_ips"],
  en_camino: ["en_atencion", "no_asistio", "cancelada_paciente", "cancelada_ips"],
  en_atencion: ["atendida"],
};

export const MODALITY_LABEL: Record<Modality, string> = { sede: "En sede", domicilio: "Domiciliaria", telemedicina: "Telemedicina" };

export const PRO_TYPE_LABEL: Record<string, string> = {
  medico: "Médico", enfermeria: "Enfermería", terapia: "Terapia", psicologia: "Psicología",
  nutricion: "Nutrición", odontologia: "Odontología", otro: "Otro",
};

export const BLOCK_REASON_LABEL: Record<string, string> = {
  vacaciones: "Vacaciones", incapacidad: "Incapacidad", capacitacion: "Capacitación", permiso: "Permiso", otro: "Otro",
};

export const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export interface ProfessionalRow {
  userId: string;
  nombre: string;
  rol: string;
  id: string | null;
  tipo: string | null;
  especialidad: string | null;
  registroProfesional: string | null;
  modalidades: Modality[] | null;
  duracionCitaMin: number | null;
  color: string | null;
  activo: boolean | null;
  bloquesHorario: number;
}

export interface ScheduleBlock {
  id?: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modalidad: Modality;
  sedeId: string | null;
  sede?: string | null;
}

export interface Unavailability {
  id: string;
  inicio: string;
  fin: string;
  motivo: string;
  nota: string | null;
}

export interface ProfessionalDetail {
  id: string;
  userId: string;
  nombre: string;
  tipo: string;
  especialidad: string | null;
  registroProfesional: string | null;
  modalidades: Modality[];
  duracionCitaMin: number;
  color: string | null;
  activo: boolean;
  horario: ScheduleBlock[];
  bloqueos: Unavailability[];
}

export interface ProfessionalInput {
  tipo: string;
  especialidad: string | null;
  registroProfesional: string | null;
  modalidades: Modality[];
  duracionCitaMin: number;
  color: string | null;
  activo: boolean;
}

export interface Slot {
  hora: string;
  inicio: string;
  fin: string;
  modalidad: Modality;
  sedeId: string | null;
}

export interface Cita {
  id: string;
  estado: CitaState;
  modalidad: Modality;
  inicio: string;
  fin: string;
  motivo: string | null;
  notas: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  motivoCancelacion: string | null;
  reprogramadaDesde: string | null;
  admisionId: string | null;
  pacienteId: string;
  paciente: string;
  tipoDocumento: string | null;
  documento: string | null;
  telefono: string | null;
  profesionalId: string;
  profesional: string;
  profesionalUserId: string;
  color: string | null;
  servicioId: string | null;
  servicio: string | null;
  servicioCodigo: string | null;
  contratoId: string | null;
  convenio: string | null;
  sedeId: string | null;
  sede: string | null;
  formularioId: string | null;
  creadaEn: string;
}

export interface CitaEvent {
  id: number;
  evento: "creada" | "estado" | "reprogramada" | "actualizada";
  estadoAnterior: CitaState | null;
  estadoNuevo: CitaState | null;
  detalle: Record<string, unknown>;
  latitud: number | null;
  longitud: number | null;
  fecha: string;
  actor: string;
}

export interface NewCita {
  pacienteId: string;
  profesionalId: string;
  inicio: string;
  duracionMin: number;
  modalidad: Modality;
  sedeId?: string | null;
  contratoId?: string | null;
  servicioId?: string | null;
  formularioId?: string | null;
  motivo?: string | null;
  notas?: string | null;
  direccion?: string | null;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
const qs = (params: Record<string, string | number | null | undefined>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();

export const fetchProfessionals = () => apiFetch<ProfessionalRow[]>("/api/agenda/profesionales");
export const fetchProfessional = (id: string) => apiFetch<ProfessionalDetail>(`/api/agenda/profesionales/${id}`);
export const saveProfessional = (userId: string, input: ProfessionalInput) =>
  apiFetch<{ id: string }>(`/api/agenda/profesionales/${userId}`, json("PUT", input));
export const saveSchedule = (id: string, bloques: ScheduleBlock[]) =>
  apiFetch(
    `/api/agenda/profesionales/${id}/horario`,
    json("PUT", { bloques: bloques.map(({ diaSemana, horaInicio, horaFin, modalidad, sedeId }) => ({ diaSemana, horaInicio, horaFin, modalidad, sedeId })) }),
  );
export const addUnavailability = (id: string, input: { inicio: string; fin: string; motivo: string; nota?: string | null }) =>
  apiFetch<{ id: string }>(`/api/agenda/profesionales/${id}/bloqueos`, json("POST", input));
export const removeUnavailability = (id: string) => apiFetch(`/api/agenda/bloqueos/${id}`, json("DELETE"));

export const fetchSlots = (params: { profesionalId: string; fecha: string; duracionMin?: number; modalidad?: Modality | null; excludeCitaId?: string | null }) =>
  apiFetch<{ fecha: string; duracionMin: number; sinHorario: boolean; slots: Slot[] }>(`/api/agenda/disponibilidad?${qs(params)}`);

export const fetchCitas = (params: { desde: string; hasta: string; profesionalId?: string | null; pacienteId?: string | null }) =>
  apiFetch<Cita[]>(`/api/agenda/citas?${qs(params)}`);
export const fetchCita = (id: string) => apiFetch<Cita & { eventos: CitaEvent[] }>(`/api/agenda/citas/${id}`);
export const fetchMyDay = (fecha?: string) => apiFetch<{ fecha: string; citas: Cita[] }>(`/api/agenda/mi-dia${fecha ? `?fecha=${fecha}` : ""}`);
export const createCita = (input: NewCita) => apiFetch<{ id: string }>("/api/agenda/citas", json("POST", input));
export const changeCitaState = (id: string, input: { estado: CitaState; motivo?: string | null; latitud?: number | null; longitud?: number | null }) =>
  apiFetch(`/api/agenda/citas/${id}/estado`, json("POST", input));
export const rescheduleCita = (id: string, input: { inicio: string; duracionMin?: number; profesionalId?: string | null; motivo?: string | null }) =>
  apiFetch<{ id: string }>(`/api/agenda/citas/${id}/reprogramar`, json("POST", input));

// ───────────── Fechas: la agenda trabaja en hora de Colombia (−05:00, sin horario de verano) ─────────────

export const AGENDA_OFFSET = "-05:00";
const OFFSET_MS = -5 * 60 * 60 * 1000;

/** Hoy en la zona de la agenda (YYYY-MM-DD). */
export const today = () => new Date(Date.now() + OFFSET_MS).toISOString().slice(0, 10);
/** Fecha local (YYYY-MM-DD) de un instante. */
export const localDay = (iso: string) => new Date(new Date(iso).getTime() + OFFSET_MS).toISOString().slice(0, 10);
/** Hora local (HH:mm) de un instante. */
export const localTime = (iso: string) => new Date(new Date(iso).getTime() + OFFSET_MS).toISOString().slice(11, 16);
/** Instante ISO con zona a partir de fecha y hora locales. */
export const toIso = (day: string, time: string) => `${day}T${time}:00${AGENDA_OFFSET}`;
export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** Lunes de la semana de una fecha. */
export const weekStart = (day: string) => {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay() || 7;
  return addDays(day, 1 - weekday);
};

const longDate = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const formatLongDay = (day: string) => longDate.format(new Date(`${day}T12:00:00Z`));
export const formatShortDay = (day: string) => shortDate.format(new Date(`${day}T12:00:00Z`));
