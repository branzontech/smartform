import React, { useMemo, useEffect } from "react";
import { FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { QuestionData, ScoringRange } from "../question/types";

const RANGE_COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  red:    { bg: "bg-red-50",    border: "border-red-500",    text: "text-red-700",    badge: "bg-red-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-500", text: "text-orange-700", badge: "bg-orange-500" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", badge: "bg-yellow-400" },
  lime:   { bg: "bg-lime-50",   border: "border-lime-500",   text: "text-lime-700",   badge: "bg-lime-500" },
  green:  { bg: "bg-green-50",  border: "border-green-500",  text: "text-green-700",  badge: "bg-green-600" },
  blue:   { bg: "bg-blue-50",   border: "border-blue-500",   text: "text-blue-700",   badge: "bg-blue-500" },
  gray:   { bg: "bg-gray-50",   border: "border-gray-500",   text: "text-gray-700",   badge: "bg-gray-400" },
};

interface ScoreTotalViewerProps {
  question: QuestionData;
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
}

export const ScoreTotalViewer: React.FC<ScoreTotalViewerProps> = ({ question, formData, onChange }) => {
  const sourceIds = question.sourceQuestionIds || [];

  const totalScore = useMemo(() => {
    return sourceIds.reduce((sum: number, qId: string) => {
      const answer = formData[qId];
      return sum + (answer?.score || 0);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIds.join(","), ...sourceIds.map((id: string) => JSON.stringify(formData[id]))]);

  const scoring = question.scoring;
  const matchedRange: ScoringRange | null = useMemo(() => {
    if (!scoring?.enabled || !scoring.ranges?.length) return null;
    return scoring.ranges.find(
      (r: ScoringRange) => totalScore >= r.min && totalScore <= r.max
    ) || null;
  }, [scoring, totalScore]);

  const interpretation = matchedRange?.label || "";

  useEffect(() => {
    const currentVal = formData[question.id];
    if (!currentVal || currentVal.score !== totalScore || currentVal.interpretation !== interpretation) {
      onChange(question.id, { score: totalScore, interpretation });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalScore, interpretation]);

  const colors = matchedRange ? RANGE_COLOR_MAP[matchedRange.color] || RANGE_COLOR_MAP.gray : null;

  return (
    <div
      className={cn(
        "rounded-lg p-4 border-l-4",
        colors ? `${colors.bg} ${colors.border}` : "bg-muted/30 border-border"
      )}
    >
      <FormLabel className="text-sm text-muted-foreground">{question.title}</FormLabel>
      <div className="text-2xl font-bold mt-1">{totalScore}</div>
      {matchedRange && colors && (
        <div className="flex items-center gap-2 mt-2">
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium text-white", colors.badge)}>
            {matchedRange.label}
          </span>
        </div>
      )}
    </div>
  );
};
