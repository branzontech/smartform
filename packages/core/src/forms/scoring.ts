import type { FormAnswers, QuestionData, ScoredOption, ScoringRange } from "./types";

/** Opciones con puntaje de una pregunta (formato nuevo o heredado). */
export const scoredItemsOf = (q: QuestionData): ScoredOption[] =>
  q.scoredItems || q.scoredOptions?.map((o, i) => ({ id: `opt${i}`, text: o.label, score: o.score })) || [];

export const selectionModeOf = (q: QuestionData): "single" | "multiple" => q.selectionMode || q.scoredSelectionMode || "single";

export interface ScoredAnswer {
  selectedOptions: string[];
  score: number;
}

/** Marca o desmarca una opción con puntaje y recalcula el puntaje de la pregunta. */
export function toggleScored(q: QuestionData, current: ScoredAnswer | undefined, optId: string): ScoredAnswer {
  const items = scoredItemsOf(q);
  const selected = current?.selectedOptions ?? [];
  const next =
    selectionModeOf(q) === "single"
      ? selected.includes(optId) ? [] : [optId]
      : selected.includes(optId) ? selected.filter((id) => id !== optId) : [...selected, optId];
  const score = items.filter((it) => next.includes(it.id)).reduce((sum, it) => sum + it.score, 0);
  return { selectedOptions: next, score };
}

/** Puntaje máximo de una pregunta con puntaje: la mejor opción, o la suma si es de selección múltiple. */
export function maxScoreOf(q: QuestionData | undefined): number {
  if (!q) return 0;
  const scores = (q.scoredItems ?? q.scoredOptions?.map((o) => ({ score: o.score })) ?? []).map((i) => i.score);
  if (!scores.length) return 0;
  const multiple = (q.selectionMode || q.scoredSelectionMode) === "multiple";
  return multiple ? scores.filter((s) => s > 0).reduce((a, b) => a + b, 0) : Math.max(...scores);
}

export interface ScoreSummary {
  total: number;
  answered: number;
  sourceCount: number;
  complete: boolean;
  /** null si no se conocen las preguntas de origen. */
  maxScore: number | null;
  range: ScoringRange | null;
  interpretation: string;
}

/** Total de una escala (score_total) y su interpretación según los rangos del formato. */
export function scoreSummary(q: QuestionData, formData: FormAnswers, allQuestions?: QuestionData[]): ScoreSummary {
  const sourceIds = q.sourceQuestionIds || [];
  const total = sourceIds.reduce((sum, id) => sum + (formData[id]?.score || 0), 0);
  const answered = sourceIds.filter((id) => (formData[id]?.selectedOptions?.length ?? 0) > 0).length;
  const maxScore = allQuestions ? sourceIds.reduce((sum, id) => sum + maxScoreOf(allQuestions.find((x) => x.id === id)), 0) : null;
  const scoring = q.scoring;
  const range = scoring?.enabled && scoring.ranges?.length ? scoring.ranges.find((r) => total >= r.min && total <= r.max) ?? null : null;
  return {
    total,
    answered,
    sourceCount: sourceIds.length,
    complete: sourceIds.length > 0 && answered === sourceIds.length,
    maxScore,
    range,
    interpretation: range?.label || "",
  };
}

/** Total de un campo múltiple calculado (suma, resta, multiplicación o división en orden). */
export function multifieldTotal(q: QuestionData, formData: FormAnswers): number {
  const values = (q.multifields || []).map((f) => parseFloat(formData[`${q.id}_${f.id}`]) || 0);
  if (values.length === 0) return 0;
  let result = values[0];
  for (let i = 1; i < values.length; i++) {
    switch (q.calculationType || "sum") {
      case "sum": result += values[i]; break;
      case "subtract": result -= values[i]; break;
      case "multiply": result *= values[i]; break;
      case "divide": result = values[i] !== 0 ? result / values[i] : 0; break;
    }
  }
  return (q.numberType || "decimal") === "integer" ? Math.round(result) : parseFloat(result.toFixed(4));
}
