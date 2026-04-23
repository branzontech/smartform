import { useEffect, useMemo, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DiffEditableFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date";

export interface DiffEditableField {
  key: string;
  label: string;
  type: DiffEditableFieldType;
  placeholder?: string;
}

export interface DiffHighlightFormProps {
  originalData: Record<string, unknown>;
  editableFields: DiffEditableField[];
  onChange: (replacementData: Record<string, unknown>) => void;
}

function toInputValue(value: unknown, type: DiffEditableFieldType): string {
  if (value === null || value === undefined) return "";
  if (type === "date" && typeof value === "string") {
    // ISO date → yyyy-MM-dd
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return value;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value);
}

function valuesEqual(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

function castOutput(
  value: string,
  type: DiffEditableFieldType
): unknown {
  if (type === "number") {
    if (value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  return value;
}

export function DiffHighlightForm({
  originalData,
  editableFields,
  onChange,
}: DiffHighlightFormProps) {
  const originals = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of editableFields) {
      map[f.key] = toInputValue(originalData[f.key], f.type);
    }
    return map;
  }, [originalData, editableFields]);

  const [values, setValues] = useState<Record<string, string>>(originals);

  // Reset cuando cambia originalData / editableFields
  useEffect(() => {
    setValues(originals);
  }, [originals]);

  // Emitir SOLO los campos modificados
  useEffect(() => {
    const diff: Record<string, unknown> = {};
    for (const f of editableFields) {
      if (!valuesEqual(values[f.key] ?? "", originals[f.key] ?? "")) {
        diff[f.key] = castOutput(values[f.key] ?? "", f.type);
      }
    }
    onChange(diff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, originals]);

  const modifiedKeys = editableFields.filter(
    (f) => !valuesEqual(values[f.key] ?? "", originals[f.key] ?? "")
  );

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    setValues(originals);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {modifiedKeys.length} de {editableFields.length} campos modificados
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={modifiedKeys.length === 0}
          className="h-7 text-[11px] gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Restaurar todos
        </Button>
      </div>

      <div className="space-y-3">
        {editableFields.map((field) => {
          const current = values[field.key] ?? "";
          const original = originals[field.key] ?? "";
          const isModified = !valuesEqual(current, original);

          const baseInputClasses = cn(
            "border-x-0 border-t-0 border-b rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors",
            isModified &&
              "bg-amber-50/60 dark:bg-amber-950/20 border-b-amber-400"
          );

          return (
            <div key={field.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`diff-${field.key}`}
                  className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"
                >
                  {field.label}
                  {isModified && (
                    <Pencil className="h-2.5 w-2.5 text-amber-600" />
                  )}
                </Label>
              </div>
              {field.type === "textarea" ? (
                <Textarea
                  id={`diff-${field.key}`}
                  value={current}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={cn(baseInputClasses, "min-h-[60px] resize-y")}
                />
              ) : (
                <Input
                  id={`diff-${field.key}`}
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "date"
                        ? "date"
                        : "text"
                  }
                  value={current}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={cn(baseInputClasses, "h-8 text-sm")}
                />
              )}
              {isModified && (
                <p className="text-[10px] text-muted-foreground italic">
                  Original:{" "}
                  <span className="font-mono">
                    {original === "" ? "(vacío)" : original}
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
