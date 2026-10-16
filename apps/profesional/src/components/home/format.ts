import { localDay, localTime } from '@kerhub/core/agenda';
import { dayOfMonth } from '@kerhub/core/calendar';

const monthShort = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const at = (day: string) => new Date(`${day}T12:00:00Z`);

/** Día y mes corto de una fecha ISO en hora de Colombia: { day: 20, month: 'oct' }. */
export function dateBlock(iso: string) {
  const day = localDay(iso);
  return { day: dayOfMonth(day), month: monthShort.format(at(day)).replace('.', '') };
}

/** «lunes 20 de octubre, 10:00» (o «… 10:00 – 12:00» si termina el mismo día). */
export function formatWhen(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const day = localDay(start);
  const base = `${longDate.format(at(day))}, ${localTime(start)}`;
  if (!end) return base;
  return localDay(end) === day ? `${base} – ${localTime(end)}` : `${base} al ${longDate.format(at(localDay(end)))}`;
}

export const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

/** Saludo según la hora del teléfono. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}
