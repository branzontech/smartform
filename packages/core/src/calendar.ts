import { addDays, localDay, weekStart } from "./agenda";

/**
 * Calendario de la agenda (semana de lunes a domingo, hora de Colombia).
 * Lo usan las vistas de semana y mes; los días son texto AAAA-MM-DD.
 */

export const WEEKDAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];

/** Los 7 días (lunes a domingo) de la semana del día dado. */
export const weekDays = (day: string) => {
  const start = weekStart(day);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const monthStart = (day: string) => `${day.slice(0, 7)}-01`;

export function addMonths(day: string, n: number): string {
  const [y, m] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 10);
}

/** Semanas completas (lunes a domingo) que cubren el mes del día dado: de 4 a 6 filas. */
export function monthWeeks(day: string): string[][] {
  const first = monthStart(day);
  const next = addMonths(first, 1);
  const weeks: string[][] = [];
  for (let cursor = weekStart(first); cursor < next; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
  }
  return weeks;
}

export const sameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);
export const dayOfMonth = (day: string) => Number(day.slice(8, 10));

const monthFormat = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });
const dayMonthFormat = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayFormat = new Intl.DateTimeFormat("es-CO", { weekday: "long", timeZone: "UTC" });
const at = (day: string) => new Date(`${day}T12:00:00Z`);

/** «octubre de 2026». */
export const formatMonth = (day: string) => monthFormat.format(at(monthStart(day)));
/** «lunes». */
export const formatWeekday = (day: string) => weekdayFormat.format(at(day));

/** «12 – 18 oct.» o «28 sept. – 4 oct.». */
export function formatWeekRange(day: string): string {
  const days = weekDays(day);
  const first = days[0];
  const last = days[6];
  if (sameMonth(first, last)) return `${dayOfMonth(first)} – ${dayMonthFormat.format(at(last))}`;
  return `${dayMonthFormat.format(at(first))} – ${dayMonthFormat.format(at(last))}`;
}

/** Agrupa elementos con fecha de inicio por su día local. */
export function groupByDay<T extends { inicio: string }>(items: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) (out[localDay(item.inicio)] ??= []).push(item);
  return out;
}
