import type { Cita } from "./agenda-api";

/* Piezas visuales y utilidades compartidas por Agenda, Detalle de cita y Mi día. */

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FALLBACK_COLOR = "hsl(var(--primary))";

/** Color del profesional (dato de la base); si no es un hex válido, el morado de marca. */
export const professionalColor = (color: string | null | undefined) => (color && HEX_COLOR.test(color) ? color : FALLBACK_COLOR);

/** Tinte suave del color del profesional, para fondos de bloques. */
export const tint = (color: string | null | undefined, percent: number) =>
  `color-mix(in srgb, ${professionalColor(color)} ${percent}%, transparent)`;

/** Enlace de búsqueda en Google Maps. */
export const mapsUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
export const coordsUrl = (lat: number, lng: number) => mapsUrl(`${lat},${lng}`);

/** Duración de la cita en minutos. */
export const durationMin = (cita: Pick<Cita, "inicio" | "fin">) =>
  Math.max(5, Math.round((Date.parse(cita.fin) - Date.parse(cita.inicio)) / 60_000));

/** Mensaje en español de un error de la API (ApiError ya lo trae así). */
export const errorMessage = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ocurrió un error inesperado. Intenta de nuevo.");

/**
 * Pantalla de diligenciamiento (FormViewer) de la historia clínica de la cita.
 * FormViewer lee `patientId` y `consultationId` (este último, el id de la admisión).
 * Sin formulario asociado, se abre la ficha del paciente.
 */
export function clinicalRecordUrl(cita: Pick<Cita, "formularioId" | "pacienteId" | "admisionId">) {
  if (!cita.formularioId) return `/app/pacientes/${cita.pacienteId}`;
  const params = new URLSearchParams({ patientId: cita.pacienteId });
  if (cita.admisionId) params.set("consultationId", cita.admisionId);
  return `/app/ver/${cita.formularioId}?${params.toString()}`;
}

const GEO_TIMEOUT_MS = 8_000;
const GEO_MAX_AGE_MS = 60_000;

/** Ubicación actual del dispositivo; si falla, se niega o no hay GPS, `null` (nunca bloquea). */
export function currentPosition(): Promise<{ latitud: number; longitud: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitud: p.coords.latitude, longitud: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS },
    );
  });
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Fecha YYYY-MM-DD válida (p. ej. leída de la URL). */
export const isDay = (v: string | null | undefined): v is string => !!v && DAY_PATTERN.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));

/** Primera letra en mayúscula («miércoles, 14 de octubre» → «Miércoles, 14 de octubre»). */
export const capitalizeFirst = (text: string) => (text ? text.charAt(0).toLocaleUpperCase("es") + text.slice(1) : text);
