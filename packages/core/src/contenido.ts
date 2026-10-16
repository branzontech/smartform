/**
 * Contenido de la app (Inicio): lo que la IPS publica para sus profesionales
 * y pacientes. Lo comparten Doctor Ker web (lo administra) y las apps (lo muestran).
 */
import type { Fetcher } from "./agenda";

export type ContentType = "noticia" | "evento" | "actividad" | "cultura" | "servicio" | "sede";
export type Audience = "profesionales" | "pacientes" | "todos";

export const CONTENT_TYPES: ContentType[] = ["noticia", "evento", "actividad", "cultura", "servicio", "sede"];
export const AUDIENCES: Audience[] = ["todos", "profesionales", "pacientes"];

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  noticia: "Noticia",
  evento: "Evento",
  actividad: "Actividad",
  cultura: "Cultura empresarial",
  servicio: "Servicio",
  sede: "Sede",
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  todos: "Profesionales y pacientes",
  profesionales: "Solo profesionales",
  pacientes: "Solo pacientes",
};

/** Tipos que ocurren en una fecha: llevan inicio y salen del Inicio al pasar. */
export const DATED_TYPES: ContentType[] = ["evento", "actividad"];

export interface ContentItem {
  id: string;
  tipo: ContentType;
  titulo: string;
  resumen: string | null;
  cuerpo: string | null;
  imagenRuta: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  lugar: string | null;
  enlace: string | null;
  audiencia: Audience;
  destacado: boolean;
  publicado: boolean;
  orden: number;
  creadoEn: string;
  actualizadoEn: string;
}

export type ContentInput = Pick<
  ContentItem,
  "tipo" | "titulo" | "resumen" | "cuerpo" | "imagenRuta" | "fechaInicio" | "fechaFin" | "lugar" | "enlace" | "audiencia" | "destacado" | "publicado" | "orden"
>;

export interface ContentFeed {
  institucion: { nombre: string | null; logoUrl: string | null } | null;
  items: ContentItem[];
}

/** Almacén y carpeta de las imágenes del contenido (carpeta de la propia empresa). */
export const CONTENT_BUCKET = "institution-assets";
export const contentImagePath = (empresaId: string, fileName: string) => `${empresaId}/contenido/${fileName}`;

/** URL pública de un archivo servido por la API. */
export const apiFileUrl = (apiBase: string, bucket: string, path: string) =>
  `${apiBase}/api/files/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;

/** El Inicio ordenado por bloques. Los fechados van del más próximo al más lejano. */
export function groupFeed(items: ContentItem[]) {
  const by = (tipo: ContentType) => items.filter((i) => i.tipo === tipo);
  const dated = items
    .filter((i) => DATED_TYPES.includes(i.tipo))
    .sort((a, b) => (a.fechaInicio ?? "").localeCompare(b.fechaInicio ?? ""));
  return {
    destacados: items.filter((i) => i.destacado),
    agenda: dated,
    cultura: by("cultura"),
    noticias: by("noticia"),
    servicios: by("servicio"),
    sedes: by("sede"),
  };
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

/** Cliente de /api/contenido sobre el fetcher de cada plataforma. */
export function createContentApi(fetcher: Fetcher) {
  return {
    fetchFeed: () => fetcher<ContentFeed>("/api/contenido"),
    fetchAll: () => fetcher<ContentItem[]>("/api/contenido/admin"),
    createContent: (input: ContentInput) => fetcher<{ id: string }>("/api/contenido", json("POST", input)),
    updateContent: (id: string, input: ContentInput) => fetcher<{ id: string }>(`/api/contenido/${id}`, json("PUT", input)),
    deleteContent: (id: string) => fetcher<{ id: string; imagenRuta: string | null }>(`/api/contenido/${id}`, json("DELETE")),
  };
}
