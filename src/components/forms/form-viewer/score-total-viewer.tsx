import React, { useMemo, useEffect } from "react";
import { scoreSummary } from "@kerhub/core/forms/scoring";
import { cn } from "@/lib/utils";
import { QuestionData, ScoringRange } from "../question/types";

export { maxScoreOf } from "@kerhub/core/forms/scoring";

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

export const ScoreTotalViewer: React.FC<ScoreTotalViewerProps> = ({ question, formData, onChange, allQuestions }) => {
  const sourceIds = question.sourceQuestionIds || [];

  const summary = useMemo(() => scoreSummary(question, formData, allQuestions), [question, formData, allQuestions]);
  const { total: totalScore, answered, complete, maxScore, range: matchedRange, interpretation } = summary;
  const scoring = question.scoring;

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
