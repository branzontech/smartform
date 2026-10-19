/**
 * Agenda de Doctor Ker: tipos, etiquetas, fechas y cliente de /api/agenda.
 * Lo comparten Doctor Ker web y la app del profesional: un cambio aquí llega a ambos.
 */

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

export type CitaPriority = "normal" | "prioritaria" | "urgente";
export const CITA_PRIORITY_LABEL: Record<CitaPriority, string> = { normal: "Normal", prioritaria: "Prioritaria", urgente: "Urgente" };

/** Cómo pidió la cita el paciente (alimenta el indicador de oportunidad junto con la fecha deseada). */
export type RequestChannel = "presencial" | "telefonica" | "whatsapp" | "correo" | "app" | "domiciliaria" | "otra";
export const REQUEST_CHANNEL_LABEL: Record<RequestChannel, string> = {
  presencial: "Presencial",
  telefonica: "Por teléfono",
  whatsapp: "WhatsApp",
  correo: "Correo",
  app: "App",
  domiciliaria: "En la visita domiciliaria",
  otra: "Otra",
};

export type TipoCitaCategory = "consulta" | "procedimiento" | "terapia" | "valoracion" | "pyp" | "otro";
export const CATEGORY_LABEL: Record<TipoCitaCategory, string> = {
  consulta: "Consulta",
  procedimiento: "Procedimiento",
  terapia: "Terapia",
  valoracion: "Valoración",
  pyp: "Promoción y prevención",
  otro: "Otro",
};

/** Qué se agenda y con qué reglas («asuntos» de SISMA). */
export interface TipoCita {
  id: string;
  codigo: string | null;
  nombre: string;
  categoria: TipoCitaCategory;
  primeraVez: boolean | null;
  especialidad: string | null;
  duracionMin: number;
  modalidades: Modality[];
  requiereAutorizacion: boolean;
  controlaSesiones: boolean;
  esPyp: boolean;
  agendaEnLinea: boolean;
  servicioId: string | null;
  servicio: string | null;
  formularioId: string | null;
  formulario: string | null;
  color: string | null;
  activo: boolean;
  /** Quiénes lo atienden; vacío = cualquier profesional con la modalidad. */
  profesionalIds: string[];
}

export type TipoCitaInput = Omit<TipoCita, "id" | "servicio" | "formulario">;

/** Cupo sugerido al agendar: el primero libre entre varios profesionales. */
export interface Sugerido {
  profesionalId: string;
  profesional: string;
  especialidad: string | null;
  color: string | null;
  fecha: string;
  hora: string;
  inicio: string;
  fin: string;
  modalidad: Modality;
  sedeId: string | null;
  sede: string | null;
  /** Ya atendió a este paciente (continuidad). */
  yaLoAtendio: boolean;
  /** Domicilio: minutos aproximados desde su visita anterior de ese día. */
  trasladoMin: number | null;
}

export interface Festivos {
  anio: number;
  nacionales: { fecha: string; nombre: string }[];
  empresa: { id: string; fecha: string; nombre: string }[];
}

/** Responsable o cuidador principal del paciente. */
export interface Responsable {
  nombre: string;
  parentesco: string | null;
  telefono: string | null;
}

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
  atiendeFestivos?: boolean | null;
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
  atiendeFestivos?: boolean;
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
  atiendeFestivos?: boolean;
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
  tipoCitaId: string | null;
  tipoCita: string | null;
  prioridad: CitaPriority;
  formaSolicitud: RequestChannel | null;
  fechaDeseada: string | null;
  /** Indicaciones para el paciente (las ve en sus recordatorios). */
  instrucciones: string | null;
  enlaceTelemedicina: string | null;
  /** El paciente llegó a la sede (o entró a la teleconsulta). */
  llegadaAt: string | null;
  responsable: Responsable | null;
  /** Plan de sesiones al que pertenece (citas recurrentes). */
  planId?: string | null;
  planSesion?: number | null;
  planTotal?: number | null;
}

export interface CitaEvent {
  id: number;
  evento: "creada" | "estado" | "reprogramada" | "actualizada" | "llegada";
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
  motivo: string;
  notas?: string | null;
  direccion?: string | null;
  tipoCitaId?: string | null;
  prioridad?: CitaPriority;
  formaSolicitud?: RequestChannel | null;
  fechaDeseada?: string | null;
  instrucciones?: string | null;
  enlaceTelemedicina?: string | null;
}

export interface SuggestParams {
  tipoCitaId?: string | null;
  pacienteId?: string | null;
  profesionalId?: string | null;
  sedeId?: string | null;
  modalidad: Modality;
  especialidad?: string | null;
  desde?: string | null;
  dias?: number;
  limite?: number;
  duracionMin?: number | null;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
const qs = (params: Record<string, string | number | null | undefined>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();

/** Cómo se hace una petición: el web usa cookies; la app, un token. Devuelve el JSON o lanza el error. */
export type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

/** Cliente de /api/agenda sobre el fetcher de cada plataforma. */
export function createAgendaApi(fetcher: Fetcher) {
  return {
    fetchProfessionals: () => fetcher<ProfessionalRow[]>("/api/agenda/profesionales"),
    fetchProfessional: (id: string) => fetcher<ProfessionalDetail>(`/api/agenda/profesionales/${id}`),
    saveProfessional: (userId: string, input: ProfessionalInput) =>
  fetcher<{ id: string }>(`/api/agenda/profesionales/${userId}`, json("PUT", input)),
    saveSchedule: (id: string, bloques: ScheduleBlock[]) =>
  fetcher(
    `/api/agenda/profesionales/${id}/horario`,
    json("PUT", { bloques: bloques.map(({ diaSemana, horaInicio, horaFin, modalidad, sedeId }) => ({ diaSemana, horaInicio, horaFin, modalidad, sedeId })) }),
  ),
    addUnavailability: (id: string, input: { inicio: string; fin: string; motivo: string; nota?: string | null }) =>
  fetcher<{ id: string }>(`/api/agenda/profesionales/${id}/bloqueos`, json("POST", input)),
    removeUnavailability: (id: string) => fetcher(`/api/agenda/bloqueos/${id}`, json("DELETE")),

    fetchSlots: (params: { profesionalId: string; fecha: string; duracionMin?: number; modalidad?: Modality | null; excludeCitaId?: string | null }) =>
  fetcher<{ fecha: string; duracionMin: number; sinHorario: boolean; festivo?: string | null; slots: Slot[] }>(`/api/agenda/disponibilidad?${qs(params)}`),
    /** Primeros cupos libres entre los profesionales que atienden el tipo de cita. */
    fetchSuggestions: ({ tipoCitaId, pacienteId, profesionalId, sedeId, modalidad, especialidad, desde, dias, limite, duracionMin }: SuggestParams) =>
      fetcher<{ desde: string; sugeridos: Sugerido[] }>(
        `/api/agenda/sugeridos?${qs({ tipoCitaId, pacienteId, profesionalId, sedeId, modalidad, especialidad, desde, dias, limite, duracionMin })}`,
      ),
    fetchAppointmentTypes: (soloActivos = false) => fetcher<TipoCita[]>(`/api/agenda/tipos-cita${soloActivos ? "?activos=1" : ""}`),
    createAppointmentType: (input: TipoCitaInput) => fetcher<{ id: string }>("/api/agenda/tipos-cita", json("POST", input)),
    updateAppointmentType: (id: string, input: TipoCitaInput) => fetcher(`/api/agenda/tipos-cita/${id}`, json("PUT", input)),
    fetchHolidays: (anio: number) => fetcher<Festivos>(`/api/agenda/festivos?anio=${anio}`),
    addHoliday: (input: { fecha: string; nombre: string }) => fetcher<{ id: string }>("/api/agenda/festivos", json("POST", input)),
    removeHoliday: (id: string) => fetcher(`/api/agenda/festivos/${id}`, json("DELETE")),
    /** Confirmar asistencia: el paciente llegó (sede o telemedicina). */
    markArrival: (id: string) => fetcher(`/api/agenda/citas/${id}/llegada`, json("POST")),

    fetchCitas: (params: { desde: string; hasta: string; profesionalId?: string | null; pacienteId?: string | null }) =>
  fetcher<Cita[]>(`/api/agenda/citas?${qs(params)}`),
    /** Citas de un paciente, de la más reciente a la más antigua (las últimas 300). */
    fetchPatientCitas: (pacienteId: string) => fetcher<Cita[]>(`/api/agenda/pacientes/${pacienteId}/citas`),
    fetchCita: (id: string) => fetcher<Cita & { eventos: CitaEvent[] }>(`/api/agenda/citas/${id}`),
    fetchMyDay: (fecha?: string) => fetcher<{ fecha: string; citas: Cita[] }>(`/api/agenda/mi-dia${fecha ? `?fecha=${fecha}` : ""}`),
    /** Citas del profesional en sesión entre dos días incluidos (máx. 62 días). */
    fetchMyAgenda: (desde: string, hasta: string) =>
      fetcher<{ desde: string; hasta: string; citas: Cita[] }>(`/api/agenda/mi-agenda?${qs({ desde, hasta })}`),
    createCita: (input: NewCita) => fetcher<{ id: string }>("/api/agenda/citas", json("POST", input)),
    changeCitaState: (id: string, input: { estado: CitaState; motivo?: string | null; latitud?: number | null; longitud?: number | null }) =>
  fetcher(`/api/agenda/citas/${id}/estado`, json("POST", input)),
    rescheduleCita: (id: string, input: { inicio: string; duracionMin?: number; profesionalId?: string | null; motivo?: string | null }) =>
  fetcher<{ id: string }>(`/api/agenda/citas/${id}/reprogramar`, json("POST", input)),
  };
}

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
