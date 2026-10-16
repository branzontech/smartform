import { NEXT_STATES, type Cita, type CitaState } from "./agenda";

/* Reglas de interfaz de las acciones sobre una cita, iguales en web y app (las del servidor están en NEXT_STATES). */

/** Texto del botón que lleva la cita a cada estado. */
export const ACTION_LABEL: Partial<Record<CitaState, string>> = {
  confirmada: "Confirmar",
  en_camino: "Salir en camino",
  en_atencion: "Iniciar atención",
  atendida: "Marcar atendida",
  no_asistio: "Marcar no asistió",
  cancelada_paciente: "Cancelar por el paciente",
  cancelada_ips: "Cancelar por la IPS",
};

/** Aviso al terminar el cambio de estado. */
export const SUCCESS_LABEL: Partial<Record<CitaState, string>> = {
  confirmada: "Cita confirmada",
  en_camino: "Saliste en camino",
  en_atencion: "Atención iniciada",
  atendida: "Atención finalizada",
  no_asistio: "Inasistencia registrada",
  cancelada_paciente: "Cita cancelada",
  cancelada_ips: "Cita cancelada",
};

/** Estados que registran la ubicación del dispositivo. */
export const LOCATION_STATES: CitaState[] = ["en_camino", "en_atencion"];
/** Estados que exigen motivo (el servidor lo valida). */
export const REASON_REQUIRED: CitaState[] = ["cancelada_paciente", "cancelada_ips"];
/** Estados en los que se pide motivo sin exigirlo. */
export const REASON_OPTIONAL: CitaState[] = ["no_asistio"];

export const needsReason = (s: CitaState) => REASON_REQUIRED.includes(s) || REASON_OPTIONAL.includes(s);
export const canReschedule = (s: CitaState) => s === "programada" || s === "confirmada";
export const showsClinicalRecord = (s: CitaState) => s === "en_atencion" || s === "atendida";

type CitaLike = Pick<Cita, "estado" | "modalidad">;

/** Estados a los que se puede pasar a mano; «en camino» solo tiene sentido en domicilio. */
export function allowedNext(cita: CitaLike): CitaState[] {
  return (NEXT_STATES[cita.estado] ?? []).filter((s) => s !== "en_camino" || cita.modalidad === "domicilio");
}

/** Siguiente paso lógico: Confirmar → Salir en camino (domicilio) → Iniciar atención → Marcar atendida. */
export function primaryNext(cita: CitaLike): CitaState | null {
  const allowed = allowedNext(cita);
  const preferred: Partial<Record<CitaState, CitaState>> = {
    programada: "confirmada",
    confirmada: cita.modalidad === "domicilio" ? "en_camino" : "en_atencion",
    en_camino: "en_atencion",
    en_atencion: "atendida",
  };
  const next = preferred[cita.estado];
  return next && allowed.includes(next) ? next : null;
}

/** El resto de acciones (van en «Más acciones»), con las cancelaciones al final. */
export function secondaryNext(cita: CitaLike): CitaState[] {
  const primary = primaryNext(cita);
  const rest = allowedNext(cita).filter((s) => s !== primary);
  return [...rest.filter((s) => !REASON_REQUIRED.includes(s)), ...rest.filter((s) => REASON_REQUIRED.includes(s))];
}

/**
 * Trabajo en terreno (app del profesional). El profesional no confirma la cita
 * (eso lo hace recepción con el paciente) ni la marca atendida a mano: la cita
 * queda atendida al terminar la atención, con sus formatos diligenciados.
 *   domicilio: Salir hacia el paciente → Llegué · Iniciar atención
 *   sede / telemedicina: Iniciar atención
 */
export const FIELD_LABEL: Partial<Record<CitaState, string>> = {
  en_camino: "Salir hacia el paciente",
  en_atencion: "Iniciar atención",
  no_asistio: "El paciente no estaba",
  cancelada_paciente: "Cancelada por el paciente",
  cancelada_ips: "Cancelar por la IPS",
};

/** Paso siguiente del profesional, o null si la cita ya no avanza por estado. */
export function fieldPrimary(cita: CitaLike): CitaState | null {
  const allowed = allowedNext(cita);
  const next: CitaState | null =
    cita.estado === "programada" || cita.estado === "confirmada"
      ? cita.modalidad === "domicilio" ? "en_camino" : "en_atencion"
      : cita.estado === "en_camino" ? "en_atencion" : null;
  return next && allowed.includes(next) ? next : null;
}

/** Lo que va en «Más acciones» del profesional: solo novedades (no asistió, cancelaciones). */
export function fieldSecondary(cita: CitaLike): CitaState[] {
  return allowedNext(cita).filter((s) => ["no_asistio", "cancelada_paciente", "cancelada_ips"].includes(s));
}

/** Etiqueta del paso del profesional: al llegar al domicilio, «Llegué · Iniciar atención». */
export const fieldLabel = (cita: CitaLike, s: CitaState) =>
  s === "en_atencion" && cita.estado === "en_camino" ? "Llegué · Iniciar atención" : FIELD_LABEL[s] ?? ACTION_LABEL[s] ?? s;

