import React, { useMemo, useEffect } from "react";
import { FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { QuestionData, ScoringRange } from "../question/types";

const RANGE_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  red:    { bg: "rgba(239,68,68,0.12)",   text: "#b91c1c",  border: "rgba(239,68,68,0.3)" },
  orange: { bg: "rgba(249,115,22,0.12)",  text: "#c2410c",  border: "rgba(249,115,22,0.3)" },
  yellow: { bg: "rgba(234,179,8,0.12)",   text: "#a16207",  border: "rgba(234,179,8,0.3)" },
  lime:   { bg: "rgba(132,204,22,0.12)",  text: "#4d7c0f",  border: "rgba(132,204,22,0.3)" },
  green:  { bg: "rgba(34,197,94,0.12)",   text: "#15803d",  border: "rgba(34,197,94,0.3)" },
  blue:   { bg: "rgba(59,130,246,0.12)",  text: "#1d4ed8",  border: "rgba(59,130,246,0.3)" },
  gray:   { bg: "rgba(107,114,128,0.08)", text: "#374151",  border: "rgba(107,114,128,0.2)" },
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
                  !isActive && "text-muted-foreground"
                )}
                style={isActive ? {
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontWeight: 500,
                  border: `1px solid ${colors.border}`,
                } : undefined}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors.text }}
                />
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
