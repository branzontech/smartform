import React, { useState, useRef, useEffect } from "react";
import { CheckSquare, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentComponentProps } from "../types";

export const ScoredCheckbox: React.FC<ContentComponentProps> = ({
  question,
  onUpdate,
  readOnly,
}) => {
  const [scoredOptions, setScoredOptions] = useState(
    question.scoredOptions || [
      { label: "", score: 0 },
      { label: "", score: 0 },
    ]
  );
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusIndex !== null && containerRef.current) {
      const inputs = containerRef.current.querySelectorAll<HTMLInputElement>(
        "input[data-role='label']"
      );
      inputs[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex, scoredOptions.length]);

  const handleLabelChange = (index: number, label: string) => {
    const updated = [...scoredOptions];
    updated[index] = { ...updated[index], label };
    setScoredOptions(updated);
    onUpdate({ scoredOptions: updated });
  };

  const handleScoreChange = (index: number, value: string) => {
    const score = value === "" ? 0 : parseFloat(value);
    const updated = [...scoredOptions];
    updated[index] = { ...updated[index], score: isNaN(score) ? 0 : score };
    setScoredOptions(updated);
    onUpdate({ scoredOptions: updated });
  };

  const addOption = () => {
    const updated = [...scoredOptions, { label: "", score: 0 }];
    setScoredOptions(updated);
    onUpdate({ scoredOptions: updated });
    setFocusIndex(updated.length - 1);
  };

  const addOptionAfter = (index: number) => {
    const updated = [...scoredOptions];
    updated.splice(index + 1, 0, { label: "", score: 0 });
    setScoredOptions(updated);
    onUpdate({ scoredOptions: updated });
    setFocusIndex(index + 1);
  };

  const removeOption = (index: number) => {
    if (scoredOptions.length <= 2) return;
    const updated = scoredOptions.filter((_, i) => i !== index);
    setScoredOptions(updated);
    onUpdate({ scoredOptions: updated });
  };

  if (readOnly) {
    return (
      <div className="space-y-2">
        {scoredOptions.map((opt, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled
              className="text-primary"
            />
            <span>{opt.label || `Opción ${index + 1}`}</span>
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              ({opt.score} pts)
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2" ref={containerRef}>
      <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
        <span>Opciones con puntaje</span>
        <span className="font-mono">Pts</span>
      </div>
      {scoredOptions.map((opt, index) => (
        <div key={index} className="flex items-center gap-2 mb-2 animate-fade-in">
          <CheckSquare size={18} className="text-muted-foreground shrink-0" />
          <input
            data-role="label"
            type="text"
            value={opt.label}
            onChange={(e) => handleLabelChange(index, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOptionAfter(index);
              }
            }}
            placeholder={`Opción ${index + 1}`}
            className="flex-1 border-b border-border focus:border-primary focus:outline-none py-1 px-0 bg-transparent text-sm"
          />
          <input
            type="number"
            step="any"
            value={opt.score}
            onChange={(e) => handleScoreChange(index, e.target.value)}
            className="w-20 text-right border-b border-border focus:border-primary focus:outline-none py-1 px-1 bg-transparent text-sm font-mono"
          />
          <button
            onClick={() => removeOption(index)}
            disabled={scoredOptions.length <= 2}
            className={cn(
              "p-1 rounded-full transition-all",
              scoredOptions.length > 2
                ? "text-muted-foreground hover:bg-muted"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            <Minus size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={addOption}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all mt-2 text-sm"
      >
        <Plus size={16} />
        <span>Agregar opción</span>
      </button>
    </div>
  );
};
