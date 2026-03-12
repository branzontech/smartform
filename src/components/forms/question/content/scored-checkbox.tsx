import React, { useState, useRef, useEffect } from "react";
import { CheckSquare, Circle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentComponentProps, ScoredOption } from "../types";
import { nanoid } from "nanoid";

export const ScoredCheckbox: React.FC<ContentComponentProps> = ({
  question,
  onUpdate,
  readOnly,
}) => {
  const migrateOptions = (): ScoredOption[] => {
    if (question.scoredItems && question.scoredItems.length > 0) {
      return question.scoredItems;
    }
    if (question.scoredOptions && question.scoredOptions.length > 0) {
      return question.scoredOptions.map((o) => ({
        id: nanoid(),
        text: o.label,
        score: o.score,
      }));
    }
    return [
      { id: nanoid(), text: "", score: 0 },
      { id: nanoid(), text: "", score: 0 },
    ];
  };

  const [options, setOptions] = useState<ScoredOption[]>(migrateOptions);
  const selectionMode = question.selectionMode || question.scoredSelectionMode || "single";
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track raw string values for score inputs to allow empty state while editing
  const [rawScores, setRawScores] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const opt of migrateOptions()) {
      map[opt.id] = opt.score === 0 ? "" : String(opt.score);
    }
    return map;
  });

  useEffect(() => {
    if (focusIndex !== null && containerRef.current) {
      const inputs = containerRef.current.querySelectorAll<HTMLInputElement>(
        "input[data-role='label']"
      );
      inputs[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex, options.length]);

  const sync = (updated: ScoredOption[]) => {
    setOptions(updated);
    onUpdate({ scoredItems: updated });
  };

  const handleTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], text };
    sync(updated);
  };

  const handleScoreChange = (index: number, value: string) => {
    if (value !== "" && !/^-?\d*\.?\d*$/.test(value)) return;
    const opt = options[index];
    setRawScores((prev) => ({ ...prev, [opt.id]: value }));
    const score = value === "" ? 0 : parseFloat(value);
    const updated = [...options];
    updated[index] = { ...updated[index], score: isNaN(score) ? 0 : score };
    sync(updated);
  };

  const handleScoreBlur = (index: number) => {
    const opt = options[index];
    const raw = rawScores[opt.id] ?? "";
    const parsed = parseFloat(raw);
    const finalScore = isNaN(parsed) ? 0 : parsed;
    setRawScores((prev) => ({ ...prev, [opt.id]: raw === "" ? "" : String(finalScore) }));
    if (opt.score !== finalScore) {
      const updated = [...options];
      updated[index] = { ...updated[index], score: finalScore };
      sync(updated);
    }
  };

  const addOption = () => {
    const newId = nanoid();
    const updated = [...options, { id: newId, text: "", score: 0 }];
    setRawScores((prev) => ({ ...prev, [newId]: "" }));
    sync(updated);
    setFocusIndex(updated.length - 1);
  };

  const addOptionAfter = (index: number) => {
    const newId = nanoid();
    const updated = [...options];
    updated.splice(index + 1, 0, { id: newId, text: "", score: 0 });
    setRawScores((prev) => ({ ...prev, [newId]: "" }));
    sync(updated);
    setFocusIndex(index + 1);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const removed = options[index];
    setRawScores((prev) => {
      const next = { ...prev };
      delete next[removed.id];
      return next;
    });
    const updated = options.filter((_, i) => i !== index);
    sync(updated);
  };

  const OptionIcon = selectionMode === "single" ? Circle : CheckSquare;

  if (readOnly) {
    return (
      <div className="space-y-2">
        {options.map((opt, index) => (
          <div key={opt.id} className="flex items-center gap-2">
            {selectionMode === "single" ? (
              <input type="radio" disabled className="text-primary" />
            ) : (
              <input type="checkbox" disabled className="text-primary" />
            )}
            <span>{opt.text || `Opción ${index + 1}`}</span>
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
      {options.map((opt, index) => (
        <div key={opt.id} className="flex items-center gap-2 mb-2 animate-fade-in">
          <OptionIcon size={18} className="text-muted-foreground shrink-0" />
          <input
            data-role="label"
            type="text"
            value={opt.text}
            onChange={(e) => handleTextChange(index, e.target.value)}
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
            type="text"
            inputMode="decimal"
            value={rawScores[opt.id] ?? ""}
            onChange={(e) => handleScoreChange(index, e.target.value)}
            onBlur={() => handleScoreBlur(index)}
            placeholder="Pts"
            className="w-20 text-right border-b border-border focus:border-primary focus:outline-none py-1 px-1 bg-transparent text-sm font-mono"
          />
          <button
            onClick={() => removeOption(index)}
            disabled={options.length <= 2}
            className={cn(
              "p-1 rounded-full transition-all",
              options.length > 2
                ? "text-muted-foreground hover:bg-muted"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            <X size={16} />
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

      <div className="flex items-center gap-1 mt-4 p-1 bg-muted rounded-md w-fit">
        <button
          type="button"
          onClick={() => onUpdate({ selectionMode: "single" })}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
            selectionMode === "single"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Circle size={14} />
          Selección única
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ selectionMode: "multiple" })}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
            selectionMode === "multiple"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckSquare size={14} />
          Selección múltiple
        </button>
      </div>
    </div>
  );
};
