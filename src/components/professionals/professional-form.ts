import { z } from "zod";
import {
  PRO_TYPE_LABEL,
  type Modality,
  type ProfessionalDetail,
  type ProfessionalInput,
} from "@/components/agenda/agenda-api";

/** Claves de React Query de la agenda de profesionales. */
export const professionalKeys = {
  list: ["agenda", "profesionales"] as const,
  detail: (id: string) => ["agenda", "professional", id] as const,
  appointments: (id: string, from: string, to: string) => ["agenda", "citas", { profesionalId: id, from, to }] as const,
};

export const MODALITIES: Modality[] = ["sede", "domicilio", "telemedicina"];

/** Color que se propone al habilitar a alguien (morado de marca); el admin lo cambia. */
export const DEFAULT_COLOR = "#8b35e9";
export const DEFAULT_DURATION_MIN = 30;

export const PRO_TYPE_OPTIONS = Object.entries(PRO_TYPE_LABEL).map(([value, label]) => ({ value, label }));

/** Estado del formulario de la ficha: los números se escriben como texto y se validan al guardar. */
export interface ProfessionalForm {
  tipo: string;
  especialidad: string;
  registroProfesional: string;
  modalidades: Modality[];
  duracionCitaMin: string;
  color: string;
  activo: boolean;
}

export const emptyProfessionalForm = (): ProfessionalForm => ({
  tipo: "",
  especialidad: "",
  registroProfesional: "",
  modalidades: ["sede"],
  duracionCitaMin: String(DEFAULT_DURATION_MIN),
  color: DEFAULT_COLOR,
  activo: true,
});

export const formFromDetail = (d: ProfessionalDetail): ProfessionalForm => ({
  tipo: d.tipo,
  especialidad: d.especialidad ?? "",
  registroProfesional: d.registroProfesional ?? "",
  modalidades: [...d.modalidades],
  duracionCitaMin: String(d.duracionCitaMin),
  color: d.color ?? DEFAULT_COLOR,
  activo: d.activo,
});

const inputSchema = z.object({
  tipo: z.string().refine((v) => v in PRO_TYPE_LABEL, "Elige el tipo de profesional."),
  especialidad: z.string().trim().max(120, "La especialidad admite hasta 120 caracteres."),
  registroProfesional: z.string().trim().max(40, "El registro profesional admite hasta 40 caracteres."),
  modalidades: z.array(z.enum(["sede", "domicilio", "telemedicina"])).min(1, "Elige al menos una modalidad."),
  duracionCitaMin: z.coerce
    .number({ invalid_type_error: "La duración de la cita debe ser un número." })
    .int("La duración de la cita va en minutos enteros.")
    .min(5, "La duración de la cita va de 5 a 480 minutos.")
    .max(480, "La duración de la cita va de 5 a 480 minutos."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color no válido."),
  activo: z.boolean(),
});

export type FormResult = { ok: true; input: ProfessionalInput } | { ok: false; error: string };

/** Convierte el formulario en el cuerpo que espera la API, o devuelve el primer error en español. */
export function toProfessionalInput(form: ProfessionalForm): FormResult {
  const parsed = inputSchema.safeParse({ ...form, duracionCitaMin: form.duracionCitaMin.trim() || "x" });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const v = parsed.data;
  return {
    ok: true,
    input: {
      tipo: v.tipo,
      especialidad: v.especialidad || null,
      registroProfesional: v.registroProfesional || null,
      modalidades: MODALITIES.filter((m) => v.modalidades.includes(m)),
      duracionCitaMin: v.duracionCitaMin,
      color: v.color.toLowerCase(),
      activo: v.activo,
    },
  };
}

const normalized = (f: ProfessionalForm) => ({
  ...f,
  especialidad: f.especialidad.trim(),
  registroProfesional: f.registroProfesional.trim(),
  duracionCitaMin: f.duracionCitaMin.trim(),
  color: f.color.toLowerCase(),
  modalidades: MODALITIES.filter((m) => f.modalidades.includes(m)),
});

export const sameForm = (a: ProfessionalForm, b: ProfessionalForm) =>
  JSON.stringify(normalized(a)) === JSON.stringify(normalized(b));

/** Mensaje de error de la API (ApiError ya trae el texto en español). */
export const errorMessage = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ocurrió un error inesperado.");
