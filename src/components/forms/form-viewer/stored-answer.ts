import type { QuestionData } from "../question/types";

/** Tipos cuya respuesta tiene varias partes (cada signo vital, cada subcampo…). */
const COMPOSITE_TYPES = new Set(["vitals", "multifield", "clinical"]);

/**
 * Respuesta guardada de una pregunta. Las compuestas se guardan agrupadas
 * (`{ heart_rate: "78" }`), pero los registros antiguos las tienen en claves
 * planas (`<id>_heart_rate`): en ese caso se reconstruye el objeto.
 */
export function storedAnswer(q: QuestionData, data: Record<string, unknown>): unknown {
  const value = data[q.id];
  if (!COMPOSITE_TYPES.has(q.type)) return value;
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  const prefix = `${q.id}_`;
  const parts = Object.entries(data).filter(([k]) => k.startsWith(prefix));
  return parts.length ? Object.fromEntries(parts.map(([k, v]) => [k.slice(prefix.length), v])) : value;
}
