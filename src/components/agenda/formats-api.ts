/**
 * Formatos de la atención para Ker Hub web: los de cada admisión y la
 * configuración por tipo de profesional. La lógica vive en @kerhub/core
 * (compartida con la app del profesional); aquí solo se conecta a apiFetch.
 */
import { apiFetch } from "@/integrations/api/client";
import { createFormatsApi } from "@kerhub/core/forms/attention";

export type { AttentionFormat, AvailableForm, FormatConfigRow } from "@kerhub/core/forms/attention";

export const {
  fetchAdmissionFormats,
  addAdmissionFormat,
  removeAdmissionFormat,
  fetchAvailableForms,
  fetchFormatConfig,
  saveFormatConfig,
} = createFormatsApi(apiFetch);

/** Claves de React Query de los formatos de la atención. */
export const formatKeys = {
  config: ["atencion", "formatos-tipo"] as const,
  available: ["atencion", "formularios"] as const,
  admission: (admisionId: string) => ["atencion", "admision", admisionId, "formatos"] as const,
};

/** Máximo de formatos por tipo de profesional (lo valida también la API). */
export const MAX_FORMATS_PER_TYPE = 10;

/** Nombre legible del tipo de formulario (los mismos que usa el creador de formatos). */
const FORM_TYPE_LABEL: Record<string, string> = {
  historia_clinica: "Historia clínica",
  formato: "Formato",
  escala: "Escala",
  encuesta: "Encuesta",
  forms: "Formulario",
};

export const formTypeLabel = (tipo: string | null | undefined) => FORM_TYPE_LABEL[tipo || "historia_clinica"] ?? tipo ?? "—";
