import { z } from "zod";
import { localDay, localTime, toIso } from "@/components/agenda/agenda-api";
import { db } from "@/integrations/data/client";
import {
  AUDIENCE_LABEL, AUDIENCES, CONTENT_BUCKET, CONTENT_TYPE_LABEL, CONTENT_TYPES, DATED_TYPES,
  type Audience, type ContentInput, type ContentItem, type ContentType,
} from "./content-api";

/** Claves de React Query del contenido de la app. */
export const contentKeys = {
  list: ["contenido", "admin"] as const,
};

export const LIMITS = { titulo: 120, resumen: 280, cuerpo: 5000, lugar: 160, enlace: 500, orden: 999 } as const;

export const TYPE_OPTIONS = CONTENT_TYPES.map((value) => ({ value, label: CONTENT_TYPE_LABEL[value] }));
export const AUDIENCE_OPTIONS = AUDIENCES.map((value) => ({ value, label: AUDIENCE_LABEL[value] }));

export const isDated = (tipo: ContentType) => DATED_TYPES.includes(tipo);

/** Estado del formulario: fechas en formato `datetime-local` y el orden como texto. */
export interface ContentForm {
  tipo: ContentType;
  titulo: string;
  resumen: string;
  cuerpo: string;
  imagenRuta: string | null;
  inicio: string;
  fin: string;
  lugar: string;
  enlace: string;
  audiencia: Audience;
  orden: string;
  destacado: boolean;
  publicado: boolean;
}

export const emptyContentForm = (): ContentForm => ({
  tipo: "noticia",
  titulo: "",
  resumen: "",
  cuerpo: "",
  imagenRuta: null,
  inicio: "",
  fin: "",
  lugar: "",
  enlace: "",
  audiencia: "todos",
  orden: "0",
  destacado: false,
  publicado: true,
});

/** Instante ISO → valor de `datetime-local` en hora de Colombia. */
const toLocalInput = (iso: string | null) => (iso ? `${localDay(iso)}T${localTime(iso)}` : "");
/** Valor de `datetime-local` → ISO con la zona de Colombia. */
const fromLocalInput = (v: string) => toIso(v.slice(0, 10), v.slice(11, 16));

export const formFromItem = (i: ContentItem): ContentForm => ({
  tipo: i.tipo,
  titulo: i.titulo,
  resumen: i.resumen ?? "",
  cuerpo: i.cuerpo ?? "",
  imagenRuta: i.imagenRuta,
  inicio: toLocalInput(i.fechaInicio),
  fin: toLocalInput(i.fechaFin),
  lugar: i.lugar ?? "",
  enlace: i.enlace ?? "",
  audiencia: i.audiencia,
  orden: String(i.orden),
  destacado: i.destacado,
  publicado: i.publicado,
});

/** El cuerpo exacto que espera la API (la API rechaza claves de más). */
export const inputFromItem = (i: ContentItem): ContentInput => ({
  tipo: i.tipo,
  titulo: i.titulo,
  resumen: i.resumen,
  cuerpo: i.cuerpo,
  imagenRuta: i.imagenRuta,
  fechaInicio: i.fechaInicio,
  fechaFin: i.fechaFin,
  lugar: i.lugar,
  enlace: i.enlace,
  audiencia: i.audiencia,
  destacado: i.destacado,
  publicado: i.publicado,
  orden: i.orden,
});

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const YEARS = { min: 2000, max: 2100 } as const;
const optionalDate = z.string()
  .refine((v) => !v || LOCAL_DATETIME.test(v), "Revisa la fecha y la hora.")
  .refine((v) => !v || (Number(v.slice(0, 4)) >= YEARS.min && Number(v.slice(0, 4)) <= YEARS.max), `Las fechas van del año ${YEARS.min} al ${YEARS.max}.`);

/** Enlace https sin usuario ni contraseña incrustados (la API los rechaza). */
const isSafeLink = (v: string) => {
  if (!/^https:\/\/\S+$/i.test(v)) return false;
  try {
    const url = new URL(v);
    return !url.username && !url.password;
  } catch {
    return false;
  }
};

const inputSchema = z.object({
  tipo: z.enum(CONTENT_TYPES as [ContentType, ...ContentType[]]),
  titulo: z.string().trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(LIMITS.titulo, `El título admite hasta ${LIMITS.titulo} caracteres.`),
  resumen: z.string().trim().max(LIMITS.resumen, `El resumen admite hasta ${LIMITS.resumen} caracteres.`),
  cuerpo: z.string().trim().max(LIMITS.cuerpo, `El contenido admite hasta ${LIMITS.cuerpo} caracteres.`),
  imagenRuta: z.string().nullable(),
  inicio: optionalDate,
  fin: optionalDate,
  lugar: z.string().trim().max(LIMITS.lugar, `El lugar admite hasta ${LIMITS.lugar} caracteres.`),
  enlace: z.string().trim()
    .max(LIMITS.enlace, `El enlace admite hasta ${LIMITS.enlace} caracteres.`)
    .refine((v) => !v || /^https:\/\//i.test(v), "El enlace debe empezar por https://.")
    .refine((v) => !v || isSafeLink(v), "Revisa el enlace: debe ser una dirección web válida, sin usuario ni contraseña."),
  audiencia: z.enum(AUDIENCES as [Audience, ...Audience[]]),
  orden: z.string().trim()
    .regex(/^\d+$/, "El orden debe ser un número entero.")
    .refine((v) => Number(v) <= LIMITS.orden, `El orden va de 0 a ${LIMITS.orden}.`),
  destacado: z.boolean(),
  publicado: z.boolean(),
}).superRefine((v, ctx) => {
  const dated = isDated(v.tipo);
  if (dated && !v.inicio) ctx.addIssue({ code: "custom", message: `Indica cuándo empieza ${v.tipo === "evento" ? "el evento" : "la actividad"}.` });
  if (dated && v.fin && v.fin < v.inicio) ctx.addIssue({ code: "custom", message: "El fin no puede ser antes del inicio." });
});

export type FormResult = { ok: true; input: ContentInput } | { ok: false; error: string };

/** Convierte el formulario en el cuerpo de la API, o devuelve el primer error en español. */
export function toContentInput(form: ContentForm): FormResult {
  const parsed = inputSchema.safeParse(form);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const v = parsed.data;
  // Solo los eventos y actividades llevan fechas.
  const dated = isDated(v.tipo);
  return {
    ok: true,
    input: {
      tipo: v.tipo,
      titulo: v.titulo,
      resumen: v.resumen || null,
      cuerpo: v.cuerpo || null,
      imagenRuta: v.imagenRuta,
      fechaInicio: dated && v.inicio ? fromLocalInput(v.inicio) : null,
      fechaFin: dated && v.fin ? fromLocalInput(v.fin) : null,
      lugar: v.lugar || null,
      enlace: v.enlace || null,
      audiencia: v.audiencia,
      destacado: v.destacado,
      publicado: v.publicado,
      orden: Number(v.orden),
    },
  };
}

/* Imágenes */

export const MAX_IMAGE_MB = 5;
const IMAGE_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
export const IMAGE_ACCEPT = Object.keys(IMAGE_EXT).join(",");

/** Extensión de la imagen, o el motivo por el que no se acepta. */
export function checkImage(file: File): { ext: string } | { error: string } {
  const ext = IMAGE_EXT[file.type];
  if (!ext) return { error: "La imagen debe ser PNG, JPG, WebP o GIF." };
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return { error: `La imagen pesa más de ${MAX_IMAGE_MB} MB. Usa una más liviana.` };
  return { ext };
}

/** Borra imágenes subidas que no quedaron en ninguna publicación. Si falla, no se interrumpe nada. */
export function removeImages(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length) void db.storage.from(CONTENT_BUCKET).remove(list).catch(() => undefined);
}

/* Presentación */

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** «20 oct 2026, 10:00» en hora de Colombia. */
export function formatDateTime(iso: string) {
  const [y, m, d] = localDay(iso).split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}, ${localTime(iso)}`;
}

/** Mensaje de error de la API (ApiError ya trae el texto en español). */
export const errorMessage = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ocurrió un error inesperado.");
