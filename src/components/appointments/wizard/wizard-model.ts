import type { CitaPriority, Modality, RequestChannel } from "@/components/agenda/agenda-api";

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
