import { visibleQuestions, hasPartialAnswer, isAnswerable } from "./answers";
import { scoreSummary, scoredItemsOf, multifieldTotal } from "./scoring";
import type { FormAnswers, QuestionData } from "./types";
import { vitalReadings } from "./vitals";

/** Una respuesta del formato lista para leer en el resumen de la atención. */
export interface AnswerLine {
  id: string;
  label: string;
  value: string;
  /** Texto largo (párrafos): se muestra debajo del título y no en la misma línea. */
  long?: boolean;
}

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

/** Partes de una pregunta guardadas con clave compuesta `<id>_<campo>`. */
function partsOf(qId: string, data: FormAnswers): Record<string, unknown> {
  const prefix = `${qId}_`;
  return Object.fromEntries(Object.entries(data).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]));
}

function valueOf(q: QuestionData, data: FormAnswers, all: QuestionData[]): string {
  const v = data[q.id];
  switch (q.type) {
    case "checkbox":
      return Array.isArray(v) ? v.join(", ") : "";
    case "scored_checkbox": {
      const chosen: string[] = v?.selectedOptions ?? [];
      const items = scoredItemsOf(q).filter((it) => chosen.includes(it.id));
      return items.length ? `${items.map((it) => it.text).join(", ")} · ${v?.score ?? 0} pts` : "";
    }
    case "score_total": {
      const s = scoreSummary(q, data, all);
      if (s.answered === 0) return "";
      const total = s.maxScore ? `${s.total} / ${s.maxScore}` : String(s.total);
      return s.complete && s.interpretation ? `${total} · ${s.interpretation}` : total;
    }
    case "vitals":
      return vitalReadings(q, partsOf(q.id, data)).map((r) => `${r.label} ${r.value} ${r.unit}`.trim()).join(" · ");
    case "diagnosis":
      return Array.isArray(v) ? v.map((d: { codigo?: string; descripcion?: string }) => `${d.codigo ?? ""} ${d.descripcion ?? ""}`.trim()).join("\n") : "";
    case "clinical": {
      const title = text(data[`${q.id}_title`]);
      const detail = text(data[`${q.id}_detail`]);
      return [title, detail].filter(Boolean).join(" — ");
    }
    case "multifield": {
      const rows = (q.multifields ?? []).map((f) => [f.label, text(data[`${q.id}_${f.id}`])]).filter(([, val]) => val);
      const lines = rows.map(([label, val]) => `${label}: ${val}`);
      if (q.isCalculated && rows.length) lines.push(`Total: ${multifieldTotal(q, data)}`);
      return lines.join("\n");
    }
    case "signature":
      return v ? "Firmado" : "";
    case "file":
      return v ? "Adjunto cargado" : "";
    default:
      return text(v);
  }
}

/**
 * Lo diligenciado en un formato, en orden y legible: lo que el profesional
 * revisa al terminar la atención. Omite títulos de sección y preguntas vacías.
 */
export function answerLines(questions: QuestionData[], data: FormAnswers): AnswerLine[] {
  return visibleQuestions(questions, data)
    .filter((q) => q.type === "score_total" || q.type === "calculation" || (isAnswerable(q) && hasPartialAnswer(q, data)))
    .map((q) => ({
      id: q.id,
      label: q.type === "vitals" ? q.title || "Signos vitales" : q.title,
      value: valueOf(q, data, questions),
      long: ["paragraph", "clinical", "diagnosis", "multifield"].includes(q.type),
    }))
    .filter((l) => l.value !== "");
}
