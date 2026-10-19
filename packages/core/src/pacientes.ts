/**
 * «Mis pacientes» del profesional (los que tienen citas con él): tipos, cliente
 * de /api/agenda/mis-pacientes y utilidades del listado. Lo usa la app.
 */
import type { Responsable } from "./agenda";

type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface MyPatient {
  id: string;
  nombre: string;
  tipoDocumento: string | null;
  documento: string;
  /** «AAAA-MM-DD». */
  fechaNacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  /** Citas con el profesional (sin las reprogramadas). */
  citas: number;
  ultima: string | null;
  /** Próxima cita programada o confirmada. */
  proxima: string | null;
}

export interface MyPatientDetail extends MyPatient {
  email: string | null;
  telefonoSecundario: string | null;
  regimen: string | null;
  tipoAfiliacion: string | null;
  numeroHistoria: string | null;
  ocupacion: string | null;
  zona: string | null;
  /** Responsable o cuidador principal. */
  responsable: Responsable | null;
}

export function createPatientsApi(fetcher: Fetcher) {
  return {
    fetchMyPatients: (q?: string) =>
      fetcher<MyPatient[]>(`/api/agenda/mis-pacientes${q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`),
    fetchMyPatient: (id: string) => fetcher<MyPatientDetail>(`/api/agenda/mis-pacientes/${id}`),
  };
}

/** Años cumplidos a la fecha (hora de Colombia), o null sin fecha válida. */
export function ageFrom(fechaNacimiento: string | null, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaNacimiento ?? "");
  if (!m) return null;
  const today = new Date(now.getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
  const birthdayPassed = today.slice(5) >= `${m[2]}-${m[3]}`;
  return Number(today.slice(0, 4)) - Number(m[1]) - (birthdayPassed ? 0 : 1);
}

/** «CC 123 · 36 años · Cartagena», sin lo que falte. */
export function patientSubtitle(p: MyPatient, now = new Date()): string {
  const age = ageFrom(p.fechaNacimiento, now);
  return [
    [p.tipoDocumento, p.documento].filter(Boolean).join(" "),
    age == null ? null : `${age} ${age === 1 ? "año" : "años"}`,
    p.ciudad,
  ]
    .filter(Boolean)
    .join(" · ");
}

const initialOf = (name: string) => {
  const ch = name.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
  return /[A-ZÑ]/.test(ch) ? ch : "#";
};

/** Secciones por inicial, como los contactos del teléfono; «#» al final. */
export function groupByInitial<T extends { nombre: string }>(rows: T[]): { letra: string; pacientes: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = initialOf(row.nombre);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b, "es")))
    .map(([letra, pacientes]) => ({ letra, pacientes }));
}
