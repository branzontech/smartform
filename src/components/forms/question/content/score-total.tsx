import React, { useState } from "react";
import { Plus, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentComponentProps, QuestionData, ScoringRange } from "../types";

const RANGE_COLORS = [
  { value: "red", label: "Rojo", class: "bg-red-500" },
  { value: "orange", label: "Naranja", class: "bg-orange-500" },
  { value: "yellow", label: "Amarillo", class: "bg-yellow-400" },
  { value: "lime", label: "Verde claro", class: "bg-lime-500" },
  { value: "green", label: "Verde", class: "bg-green-600" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "gray", label: "Gris", class: "bg-gray-400" },
];

interface ScoreTotalProps extends ContentComponentProps {
  allQuestions?: QuestionData[];
}

export const ScoreTotal: React.FC<ScoreTotalProps> = ({
  question,
  onUpdate,
  readOnly,
  allQuestions = [],
}) => {
  const scoredQuestions = allQuestions.filter(
    (q) => q.type === "scored_checkbox" && q.id !== question.id
  );

  const sourceIds = question.sourceQuestionIds || [];
  const scoring = question.scoring || { enabled: false, ranges: [] };

  // Track raw string values for range numeric inputs
  const [rawRanges, setRawRanges] = useState<Record<string, { min: string; max: string }>>(() => {
    const map: Record<string, { min: string; max: string }> = {};
    scoring.ranges.forEach((r: ScoringRange, i: number) => {
      map[i] = {
        min: r.min === 0 ? "" : String(r.min),
        max: r.max === 0 ? "" : String(r.max),
      };
    });
    return map;
  });

  const toggleSource = (id: string) => {
    const next = sourceIds.includes(id)
      ? sourceIds.filter((s) => s !== id)
      : [...sourceIds, id];
    onUpdate({ sourceQuestionIds: next });
  };

  const updateScoring = (patch: Partial<typeof scoring>) => {
    onUpdate({ scoring: { ...scoring, ...patch } });
  };

  const addRange = () => {
    const newIndex = scoring.ranges.length;
    const ranges: ScoringRange[] = [
      ...scoring.ranges,
      { min: 0, max: 0, label: "", color: "green" },
    ];
    setRawRanges((prev) => ({ ...prev, [newIndex]: { min: "", max: "" } }));
    updateScoring({ ranges });
  };

  const handleRangeNumChange = (index: number, field: "min" | "max", value: string) => {
    if (value !== "" && value !== "-" && !/^-?\d*\.?\d*$/.test(value)) return;
    setRawRanges((prev) => ({
      ...prev,
      [index]: { ...(prev[index] || { min: "", max: "" }), [field]: value },
    }));
    const parsed = value === "" ? 0 : parseFloat(value);
    const ranges = [...scoring.ranges];
    ranges[index] = { ...ranges[index], [field]: isNaN(parsed) ? 0 : parsed };
    updateScoring({ ranges });
  };

  const handleRangeNumBlur = (index: number, field: "min" | "max") => {
    const raw = rawRanges[index]?.[field] ?? "";
    const parsed = parseFloat(raw);
    const final = isNaN(parsed) ? 0 : parsed;
    setRawRanges((prev) => ({
      ...prev,
      [index]: { ...(prev[index] || { min: "", max: "" }), [field]: final === 0 ? "" : String(final) },
    }));
    if (scoring.ranges[index]?.[field] !== final) {
      const ranges = [...scoring.ranges];
      ranges[index] = { ...ranges[index], [field]: final };
      updateScoring({ ranges });
    }
  };

  const updateRange = (index: number, patch: Partial<ScoringRange>) => {
    const ranges = [...scoring.ranges];
    ranges[index] = { ...ranges[index], ...patch };
    updateScoring({ ranges });
  };

  const removeRange = (index: number) => {
    const newRanges = scoring.ranges.filter((_: ScoringRange, i: number) => i !== index);
    // Rebuild rawRanges indices
    const newRaw: Record<string, { min: string; max: string }> = {};
    newRanges.forEach((r: ScoringRange, i: number) => {
      const oldIdx = i >= index ? i + 1 : i;
      newRaw[i] = rawRanges[oldIdx] || { min: r.min === 0 ? "" : String(r.min), max: r.max === 0 ? "" : String(r.max) };
    });
    setRawRanges(newRaw);
    updateScoring({ ranges: newRanges });
  };

  if (readOnly) {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-mono">Σ Total calculado automáticamente</p>
        {scoring.enabled && scoring.ranges.length > 0 && (
          <div className="space-y-1">
            {scoring.ranges.map((r, i) => {
              const colorDef = RANGE_COLORS.find((c) => c.value === r.color);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={cn("w-3 h-3 rounded-full", colorDef?.class || "bg-gray-400")} />
                  <span className="font-mono">{r.min}–{r.max}:</span>
                  <span>{r.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-4">
      {/* Source questions */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Preguntas a sumar
        </h4>
        {scoredQuestions.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            <Info size={16} className="shrink-0" />
            <span>
              No hay campos tipo Escala/Puntaje en este formulario. Agrega al
              menos uno primero.
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {scoredQuestions.map((sq) => (
              <label
                key={sq.id}
                className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={sourceIds.includes(sq.id)}
                  onChange={() => toggleSource(sq.id)}
                  className="accent-primary"
                />
                <span className="text-foreground">
                  {sq.title || "Sin título"}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Scoring ranges */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer text-sm mb-3">
          <button
            type="button"
            role="switch"
            aria-checked={scoring.enabled}
            onClick={() => updateScoring({ enabled: !scoring.enabled })}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
              scoring.enabled ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform mt-0.5",
                scoring.enabled ? "translate-x-4 ml-0.5" : "translate-x-0.5"
              )}
            />
          </button>
          <span className="text-foreground font-medium">
            Habilitar rangos de interpretación
          </span>
        </label>

        {scoring.enabled && (
          <div className="space-y-2">
            {scoring.ranges.length > 0 && (
              <div className="grid grid-cols-[4rem_4rem_1fr_auto_auto] gap-1.5 text-xs text-muted-foreground mb-1">
                <span>Desde</span>
                <span>Hasta</span>
                <span>Interpretación</span>
                <span>Color</span>
                <span />
              </div>
            )}
            {scoring.ranges.map((range, i) => (
              <div
                key={i}
                className="grid grid-cols-[4rem_4rem_1fr_auto_auto] gap-1.5 items-center animate-fade-in"
              >
                <input
                  type="number"
                  value={range.min}
                  onChange={(e) =>
                    updateRange(i, { min: Number(e.target.value) })
                  }
                  className="w-16 text-sm border border-border rounded px-1.5 py-1 bg-background text-foreground font-mono"
                />
                <input
                  type="number"
                  value={range.max}
                  onChange={(e) =>
                    updateRange(i, { max: Number(e.target.value) })
                  }
                  className="w-16 text-sm border border-border rounded px-1.5 py-1 bg-background text-foreground font-mono"
                />
                <input
                  type="text"
                  value={range.label}
                  onChange={(e) => updateRange(i, { label: e.target.value })}
                  placeholder="Interpretación"
                  className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
                />
                <select
                  value={range.color}
                  onChange={(e) => updateRange(i, { color: e.target.value })}
                  className="text-sm border border-border rounded px-1.5 py-1 bg-background text-foreground"
                >
                  {RANGE_COLORS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeRange(i)}
                  className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={addRange}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all text-sm mt-1"
            >
              <Plus size={16} />
              <span>Agregar rango</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
