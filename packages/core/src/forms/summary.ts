import { visibleQuestions, hasPartialAnswer, isAnswerable } from "./answers";
import { scoreSummary, scoredItemsOf, multifieldTotal } from "./scoring";
import type { FormAnswers, QuestionData } from "./types";
import { vitalReadings, type VitalReading } from "./vitals";

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

/** Partes de una pregunta guardadas con clave compuesta `<id>_<campo>`. */
function partsOf(qId: string, data: FormAnswers): Record<string, unknown> {
  const prefix = `${qId}_`;
  return Object.fromEntries(Object.entries(data).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]));
}

/** Partes de los signos vitales; los personalizados se guardan como `<id>_custom_<signo>`. */
function vitalParts(qId: string, data: FormAnswers): Record<string, unknown> {
  const parts = partsOf(qId, data);
  for (const [k, v] of Object.entries(parts)) if (k.startsWith("custom_")) parts[k.slice("custom_".length)] = v;
  return parts;
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

/** Una pieza del resumen, en el mismo orden y estructura del formato. */
export type SummaryItem =
  | { kind: "section"; id: string; title: string }
  | { kind: "answer"; id: string; label: string; value: string }
  | { kind: "vitals"; id: string; label: string; readings: VitalReading[] };

/**
 * Lo diligenciado en un formato, en orden y legible, con sus secciones:
 * lo que el profesional revisa al terminar la atención. Omite preguntas vacías
 * y secciones que quedaron sin respuestas.
 */
export function summaryItems(questions: QuestionData[], data: FormAnswers): SummaryItem[] {
  const items: SummaryItem[] = [];
  let section: SummaryItem | null = null;
  for (const q of visibleQuestions(questions, data)) {
    if (q.type === "section") {
      section = { kind: "section", id: q.id, title: q.title };
      continue;
    }
    if (!(q.type === "score_total" || q.type === "calculation" || (isAnswerable(q) && hasPartialAnswer(q, data)))) continue;
    let item: SummaryItem | null = null;
    if (q.type === "vitals") {
      const readings = vitalReadings(q, vitalParts(q.id, data));
      if (readings.length) item = { kind: "vitals", id: q.id, label: q.title || "Signos vitales", readings };
    } else {
      const value = valueOf(q, data, questions);
      if (value) item = { kind: "answer", id: q.id, label: q.title, value };
    }
    if (!item) continue;
    // La sección se muestra solo si tiene al menos una respuesta.
    if (section) {
      items.push(section);
      section = null;
    }
    items.push(item);
  }
  return items;
}
