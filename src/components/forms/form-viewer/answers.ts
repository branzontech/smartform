import type { QuestionData } from "../question/types";

const filledText = (v: unknown) => typeof v === "string" ? v.trim() !== "" : v !== null && v !== undefined && v !== "";

/** Signos vitales básicos: los que exige un registro clínico. Peso y talla no siempre se toman (p. ej. en casa). */
const CORE_VITALS = ["heart_rate", "respiratory_rate", "systolic_bp", "diastolic_bp", "temperature", "oxygen_saturation"];

/** Tipos que el profesional no diligencia: se calculan, se formulan en otra pestaña o son títulos. */
export const isAnswerable = (q: QuestionData) => !["section", "score_total", "calculation", "medication"].includes(q.type);

/**
 * ¿La pregunta tiene respuesta? Cada tipo guarda distinto en formData:
 * texto plano, arreglos, claves compuestas (`<id>_<campo>`) u objetos.
 * Los tipos no diligenciables cuentan como respondidos.
 */
export function hasAnswer(q: QuestionData, formData: Record<string, any>): boolean {
  const v = formData[q.id];
  switch (q.type) {
    case "section":
    case "score_total":
    case "calculation":
    case "medication":
      return true;
    case "checkbox":
    case "diagnosis":
      return Array.isArray(v) && v.length > 0;
    case "scored_checkbox":
      return (v?.selectedOptions?.length ?? 0) > 0;
    case "file":
      return !!v && (typeof v === "string" || typeof (v as File).name === "string");
    case "clinical":
      return filledText(formData[`${q.id}_title`]) || filledText(formData[`${q.id}_detail`]);
    case "multifield":
      return (q.multifields ?? []).length > 0 && (q.multifields ?? []).every((f) => filledText(formData[`${q.id}_${f.id}`]));
    case "vitals": {
      const vitals = q.predefinedVitals;
      // Sin configuración propia, el visor usa sus signos por defecto (todos los básicos).
      const keys = vitals ? CORE_VITALS.filter((k) => vitals[k]?.enabled) : CORE_VITALS;
      return keys.length > 0 && keys.every((k) => filledText(formData[`${q.id}_${k}`]));
    }
    default:
      return filledText(v);
  }
}

/** ¿Hay algo escrito en la pregunta, aunque no esté completa? (para autoguardar borradores). */
export function hasPartialAnswer(q: QuestionData, formData: Record<string, any>): boolean {
  if (!isAnswerable(q)) return false;
  if (q.type === "vitals" || q.type === "multifield" || q.type === "clinical") {
    return Object.keys(formData).some((k) => k.startsWith(`${q.id}_`) && filledText(formData[k]));
  }
  return hasAnswer(q, formData);
}

/** Preguntas obligatorias sin respuesta. */
export const missingRequired = (questions: QuestionData[], formData: Record<string, any>) =>
  questions.filter((q) => q.required && !q.inactive && !hasAnswer(q, formData));

/** Preguntas que se muestran al diligenciar: las desactivadas solo si el registro ya las tiene respondidas. */
export const visibleQuestions = (questions: QuestionData[], formData: Record<string, any>) =>
  questions.filter((q) => !q.inactive || hasPartialAnswer(q, formData));
