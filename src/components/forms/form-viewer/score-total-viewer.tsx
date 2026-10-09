import React, { useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { QuestionData, ScoringRange } from "../question/types";

/** Color de texto por rango (claro y oscuro); el color va en el texto, nunca en puntos. */
export const RANGE_TEXT: Record<string, string> = {
  red: "text-red-700 dark:text-red-400",
  orange: "text-orange-700 dark:text-orange-400",
  yellow: "text-yellow-700 dark:text-yellow-400",
  lime: "text-lime-700 dark:text-lime-400",
  green: "text-green-700 dark:text-green-400",
  blue: "text-blue-700 dark:text-blue-400",
  gray: "text-foreground",
};

interface ScoreTotalViewerProps {
  question: QuestionData;
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
  /** Para calcular el puntaje máximo posible de las preguntas de origen. */
  allQuestions?: QuestionData[];
}

/** Puntaje máximo de una pregunta con puntaje: la mejor opción, o la suma si es de selección múltiple. */
export function maxScoreOf(q: QuestionData | undefined): number {
  if (!q) return 0;
  const scores = (q.scoredItems ?? q.scoredOptions?.map((o) => ({ score: o.score })) ?? []).map((i) => i.score);
  if (!scores.length) return 0;
  const multiple = (q.selectionMode || q.scoredSelectionMode) === "multiple";
  return multiple ? scores.filter((s) => s > 0).reduce((a, b) => a + b, 0) : Math.max(...scores);
}

export const ScoreTotalViewer: React.FC<ScoreTotalViewerProps> = ({ question, formData, onChange, allQuestions }) => {
  const sourceIds = question.sourceQuestionIds || [];

  const totalScore = useMemo(() => {
    return sourceIds.reduce((sum: number, qId: string) => sum + (formData[qId]?.score || 0), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIds.join(","), ...sourceIds.map((id: string) => JSON.stringify(formData[id]))]);

  const answered = sourceIds.filter((id) => (formData[id]?.selectedOptions?.length ?? 0) > 0).length;
  const complete = sourceIds.length > 0 && answered === sourceIds.length;
  const maxScore = allQuestions ? sourceIds.reduce((sum, id) => sum + maxScoreOf(allQuestions.find((q) => q.id === id)), 0) : null;

  const scoring = question.scoring;
  const matchedRange: ScoringRange | null = useMemo(() => {
    if (!scoring?.enabled || !scoring.ranges?.length) return null;
    return scoring.ranges.find((r: ScoringRange) => totalScore >= r.min && totalScore <= r.max) || null;
  }, [scoring, totalScore]);

  const interpretation = matchedRange?.label || "";

  // Solo guarda cuando hay algo respondido: abrir el formato no debe marcarlo como modificado.
  useEffect(() => {
    const currentVal = formData[question.id];
    if (!currentVal && answered === 0) return;
    if (!currentVal || currentVal.score !== totalScore || currentVal.interpretation !== interpretation) {
      onChange(question.id, { score: totalScore, interpretation });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalScore, interpretation, answered]);

  const ranges = scoring?.enabled && scoring.ranges?.length ? scoring.ranges : [];

  return (
    <div className="grid gap-3 rounded-[16px] bg-primary/5 px-5 py-4">
      <div className="grid gap-0.5">
        <span className="kh-label">{question.title}</span>
        <span className="kh-help">
          {complete ? "Calculado automáticamente" : `Faltan ${sourceIds.length - answered} de ${sourceIds.length} ítems`}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[44px] font-extrabold leading-none tabular-nums text-foreground">{totalScore}</span>
        {maxScore ? <span className="text-base text-muted-foreground">/ {maxScore}</span> : null}
      </div>
      <div className={cn("text-[17px] font-bold", complete && matchedRange ? RANGE_TEXT[matchedRange.color] ?? RANGE_TEXT.gray : "text-muted-foreground")}>
        {complete ? interpretation || "Sin interpretación para este puntaje" : "La interpretación aparece al completar la escala"}
      </div>
      {ranges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ranges.map((r: ScoringRange) => {
            const active = complete && matchedRange === r;
            return (
              <span
                key={`${r.min}-${r.max}-${r.label}`}
                className={cn(
                  "rounded-full bg-card px-2.5 py-1 text-[13px] tabular-nums",
                  active ? cn("font-bold ring-[1.5px] ring-current", RANGE_TEXT[r.color] ?? RANGE_TEXT.gray) : "text-muted-foreground",
                )}
              >
                {r.min === r.max ? r.min : `${r.min}–${r.max}`} · {r.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
