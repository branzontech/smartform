import type { CitaPriority, Modality, RequestChannel } from "@/components/agenda/agenda-api";
import type { Frequency, PlanCita, Recurrence, SessionCheck, Turn } from "@kerhub/core/planes";

/** Lo que pide el paciente: qué cita, cómo, con qué urgencia y desde cuándo. */
export interface NeedData {
  tipoCitaId: string | null;
  tipoCita: string | null;
  modalidad: Modality;
  duracionMin: number;
  especialidad: string | null;
  motivo: string;
  prioridad: CitaPriority;
  formaSolicitud: RequestChannel | null;
  fechaDeseada: string | null;
  direccion: string;
  enlaceTelemedicina: string;
}

/** El cupo elegido: profesional, día y hora. */
export interface PickedSlot {
  profesionalId: string;
  profesional: string;
  fecha: string;
  hora: string;
  inicio: string;
  sedeId: string | null;
  sede: string | null;
}

/** Cobertura y textos finales de la cita. */
export interface ConfirmData {
  contratoId: string | null;
  servicioId: string | null;
  formularioId: string | null;
  instrucciones: string;
  notas: string;
}

/** El servidor exige un motivo de al menos 3 caracteres. */
export const MIN_MOTIVE = 3;
const DEFAULT_DURATION = 30;

export function emptyNeed(address: string): NeedData {
  return {
    tipoCitaId: null, tipoCita: null, modalidad: "sede", duracionMin: DEFAULT_DURATION, especialidad: null, motivo: "",
    prioridad: "normal", formaSolicitud: null, fechaDeseada: null, direccion: address, enlaceTelemedicina: "",
  };
}

export const emptyConfirm = (): ConfirmData => ({ contratoId: null, servicioId: null, formularioId: null, instrucciones: "", notas: "" });

/** Lo que falta para seguir; vacío = listo. */
export function needMissing(need: NeedData): string[] {
  const link = need.enlaceTelemedicina.trim();
  return [
    need.motivo.trim().length < MIN_MOTIVE && "el motivo",
    need.modalidad === "domicilio" && !need.direccion.trim() && "la dirección",
    need.modalidad === "telemedicina" && link && !link.startsWith("https://") && "un enlace que empiece por https://",
  ].filter(Boolean) as string[];
}

/** Cambiar el tipo, la modalidad o la duración da otros cupos: el elegido deja de valer. */
export const invalidatesSlot = (prev: NeedData, next: NeedData) =>
  prev.tipoCitaId !== next.tipoCitaId || prev.modalidad !== next.modalidad || prev.duracionMin !== next.duracionMin;

// ───────────────────────── Plan de sesiones ─────────────────────────

/** Sesiones por defecto de un plan nuevo (un mes de terapias tres veces por semana). */
const DEFAULT_PLAN_SESSIONS = 12;
export const MAX_PLAN_SESSIONS = 120;

export interface PlanTurn {
  hora: string;
  profesionalId: string;
}

/** Borrador de la repetición tal como se edita en pantalla. */
export interface PlanDraft {
  frecuencia: Frequency;
  cadaDias: number;
  cadaSemanas: number;
  /** Turno de «cada N días» y «mensual». */
  unico: PlanTurn;
  /** Turnos de la semanal por día (1 = lunes … 7 = domingo). */
  dias: Partial<Record<number, PlanTurn>>;
  desde: string;
  termina: "sesiones" | "fecha";
  sesiones: number;
  hasta: string;
}

export function emptyPlanDraft(desde: string): PlanDraft {
  return {
    frecuencia: "semanal", cadaDias: 2, cadaSemanas: 1, unico: { hora: "08:00", profesionalId: "" }, dias: {},
    desde, termina: "sesiones", sesiones: DEFAULT_PLAN_SESSIONS, hasta: "",
  };
}

const turnReady = (t: PlanTurn) => !!t.hora && !!t.profesionalId;

/** Lo que falta para ver las sesiones; vacío = listo. */
export function planMissing(d: PlanDraft): string[] {
  const days = Object.values(d.dias).filter(Boolean) as PlanTurn[];
  return [
    d.frecuencia === "semanal" && days.length === 0 && "los días de la semana",
    d.frecuencia === "semanal" && days.some((t) => !turnReady(t)) && "la hora y el profesional de cada día",
    d.frecuencia !== "semanal" && !turnReady(d.unico) && "la hora y el profesional",
    !d.desde && "la fecha de inicio",
    d.termina === "fecha" && (!d.hasta || d.hasta < d.desde) && "una fecha final posterior al inicio",
    d.termina === "sesiones" && !(d.sesiones >= 1 && d.sesiones <= MAX_PLAN_SESSIONS) && `entre 1 y ${MAX_PLAN_SESSIONS} sesiones`,
  ].filter(Boolean) as string[];
}

/** La regla que entiende el servidor. */
export function recurrenceOf(d: PlanDraft): Recurrence {
  const weekly = d.frecuencia === "semanal";
  const turnos: Turn[] = weekly
    ? Object.entries(d.dias)
        .filter((entry): entry is [string, PlanTurn] => !!entry[1])
        .map(([dia, t]) => ({ dia: Number(dia), hora: t.hora, profesionalId: t.profesionalId }))
        .sort((a, b) => (a.dia as number) - (b.dia as number))
    : [{ dia: null, hora: d.unico.hora, profesionalId: d.unico.profesionalId }];
  return {
    frecuencia: d.frecuencia,
    cadaDias: d.frecuencia === "cada_n_dias" ? d.cadaDias : null,
    cadaSemanas: weekly ? d.cadaSemanas : null,
    turnos,
    desde: d.desde,
    sesiones: d.termina === "sesiones" ? d.sesiones : null,
    hasta: d.termina === "fecha" ? d.hasta : null,
  };
}

/** Estado del plan en el asistente: el borrador, su vista previa y las sesiones que se quitaron. */
export interface PlanState {
  draft: PlanDraft;
  checks: SessionCheck[] | null;
  removed: ReadonlySet<number>;
}

export const emptyPlanState = (desde: string): PlanState => ({ draft: emptyPlanDraft(desde), checks: null, removed: new Set() });

/** Datos comunes de las citas (la cita suelta o cada sesión del plan), sin profesional ni hora. */
export function citaDataOf(pacienteId: string, need: NeedData, confirm: ConfirmData): PlanCita {
  return {
    pacienteId,
    duracionMin: need.duracionMin,
    modalidad: need.modalidad,
    tipoCitaId: need.tipoCitaId,
    prioridad: need.prioridad,
    formaSolicitud: need.formaSolicitud,
    fechaDeseada: need.fechaDeseada,
    motivo: need.motivo.trim(),
    direccion: need.modalidad === "domicilio" ? need.direccion.trim() : null,
    enlaceTelemedicina: need.modalidad === "telemedicina" ? need.enlaceTelemedicina.trim() || null : null,
    contratoId: confirm.contratoId,
    servicioId: confirm.servicioId,
    formularioId: confirm.formularioId,
    instrucciones: confirm.instrucciones.trim() || null,
    notas: confirm.notas.trim() || null,
  };
}

/** Borrador para extender un plan con su misma cadencia, desde el día dado. */
export function draftFromRecurrence(r: Recurrence, desde: string): PlanDraft {
  const base = emptyPlanDraft(desde);
  const first = r.turnos[0];
  return {
    ...base,
    frecuencia: r.frecuencia,
    cadaDias: r.cadaDias ?? base.cadaDias,
    cadaSemanas: r.cadaSemanas ?? base.cadaSemanas,
    unico: first ? { hora: first.hora, profesionalId: first.profesionalId } : base.unico,
    dias:
      r.frecuencia === "semanal"
        ? Object.fromEntries(r.turnos.map((t) => [t.dia as number, { hora: t.hora, profesionalId: t.profesionalId }]))
        : {},
  };
}
