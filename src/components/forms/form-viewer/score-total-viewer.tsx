import React, { useMemo, useEffect } from "react";
import { FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { QuestionData, ScoringRange } from "../question/types";

const RANGE_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  red:    { bg: "bg-red-50",    text: "text-red-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-700" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700" },
  lime:   { bg: "bg-lime-50",   text: "text-lime-700" },
  green:  { bg: "bg-green-50",  text: "text-green-700" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-700" },
  gray:   { bg: "bg-gray-50",   text: "text-gray-700" },
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

  const ranges = scoring?.enabled && scoring.ranges?.length ? scoring.ranges : [];

  return (
    <div className="border-t-2 border-primary/20 pt-4 mt-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-semibold text-sm">{question.title}</span>
        <span className="text-3xl font-bold tabular-nums">{totalScore}</span>
      </div>
      {ranges.length > 0 && (
        <div className="space-y-0.5">
          {ranges.map((r: ScoringRange, i: number) => {
            const isActive = matchedRange === r;
            const colors = RANGE_COLOR_MAP[r.color] || RANGE_COLOR_MAP.gray;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? `${colors.bg} ${colors.text} font-medium`
                    : "text-muted-foreground"
                )}
              >
                <span className="tabular-nums w-16 shrink-0 text-right">
                  {r.min === r.max ? r.min : `${r.min} - ${r.max}`}
                </span>
                <span>{r.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
