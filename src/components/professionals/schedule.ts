import { WEEKDAYS, type Modality, type ScheduleBlock } from "@/components/agenda/agenda-api";

/** Bloque del editor: lleva una clave local para la lista de React. */
export interface DraftBlock extends ScheduleBlock {
  key: string;
}

/** El servidor admite como máximo 70 bloques por profesional. */
export const MAX_BLOCKS = 70;
const WORKDAYS = [2, 3, 4, 5];

let counter = 0;
const nextKey = () => `b${++counter}`;

export const toDraft = (blocks: ScheduleBlock[]): DraftBlock[] =>
  [...blocks]
    .sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio))
    .map((b) => ({ key: nextKey(), diaSemana: b.diaSemana, horaInicio: b.horaInicio, horaFin: b.horaFin, modalidad: b.modalidad, sedeId: b.sedeId }));

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/** Bloque nuevo para un día: empieza donde termina el último (o a las 08:00) y dura 4 horas, sin pasar de medianoche. */
export function newBlock(day: number, existing: DraftBlock[], modalidad: Modality): DraftBlock {
  const ends = existing.filter((b) => b.diaSemana === day && /^\d{2}:\d{2}$/.test(b.horaFin)).map((b) => toMinutes(b.horaFin));
  const start = ends.length ? Math.min(Math.max(...ends), 23 * 60) : 8 * 60;
  const end = Math.min(start + 4 * 60, 23 * 60 + 59);
  return { key: nextKey(), diaSemana: day, horaInicio: fromMinutes(start), horaFin: fromMinutes(end), modalidad, sedeId: null };
}

/** Copia los bloques del lunes a martes–viernes (reemplaza lo que esos días tuvieran). */
export function copyMondayToWorkdays(blocks: DraftBlock[]): DraftBlock[] {
  const monday = blocks.filter((b) => b.diaSemana === 1);
  const kept = blocks.filter((b) => !WORKDAYS.includes(b.diaSemana));
  const copies = WORKDAYS.flatMap((day) => monday.map((b) => ({ ...b, key: nextKey(), diaSemana: day })));
  return [...kept, ...copies];
}

/** Problemas del horario antes de enviarlo: horas vacías, fin no posterior al inicio y cruces del mismo día. */
export function scheduleIssues(blocks: DraftBlock[]): string[] {
  const issues: string[] = [];
  if (blocks.length > MAX_BLOCKS) issues.push(`El horario admite como máximo ${MAX_BLOCKS} bloques.`);
  for (let day = 1; day <= 7; day++) {
    const name = WEEKDAYS[day - 1];
    const list = blocks.filter((b) => b.diaSemana === day);
    if (list.some((b) => !b.horaInicio || !b.horaFin)) {
      issues.push(`${name}: completa la hora de inicio y de fin de cada bloque.`);
      continue;
    }
    if (list.some((b) => b.horaFin <= b.horaInicio)) issues.push(`${name}: la hora de fin debe ser posterior a la de inicio.`);
    const sorted = [...list].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    if (sorted.some((b, i) => i > 0 && b.horaInicio < sorted[i - 1].horaFin)) issues.push(`${name}: hay bloques que se cruzan.`);
  }
  return issues;
}

const signature = (blocks: ScheduleBlock[]) =>
  JSON.stringify(
    [...blocks]
      .map(({ diaSemana, horaInicio, horaFin, modalidad, sedeId }) => ({ diaSemana, horaInicio, horaFin, modalidad, sedeId: modalidad === "sede" ? sedeId : null }))
      .sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio) || a.horaFin.localeCompare(b.horaFin)),
  );

export const sameSchedule = (a: ScheduleBlock[], b: ScheduleBlock[]) => signature(a) === signature(b);

/** Cuerpo para la API: la sede solo aplica a los bloques en sede. */
export const toScheduleBlocks = (blocks: DraftBlock[]): ScheduleBlock[] =>
  blocks.map(({ diaSemana, horaInicio, horaFin, modalidad, sedeId }) => ({
    diaSemana, horaInicio, horaFin, modalidad, sedeId: modalidad === "sede" ? sedeId : null,
  }));
