import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SignaturePad } from "@/components/ui/question-types";
import { QuestionData, ScoredOption } from "../question/types";
import { FileUp } from "lucide-react";
import { MedicationManager } from "@/components/medical/MedicationManager";
import { ScoreTotalViewer } from "./score-total-viewer";
import { VitalsViewer } from "./vitals-viewer";

interface QuestionRendererProps {
  question: QuestionData;
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
  errors: any;
}

// Minimal underline input used throughout the clinical form
const ClinicalInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full bg-transparent border-0 border-b border-border/60 focus:border-primary focus:outline-none py-1.5 text-sm transition-colors placeholder:text-muted-foreground/50",
      className
    )}
    {...props}
  />
));
ClinicalInput.displayName = "ClinicalInput";

// Minimal underline textarea
const ClinicalTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-transparent border-0 border-b border-border/60 focus:border-primary focus:outline-none py-1.5 text-sm transition-colors placeholder:text-muted-foreground/50 resize-y min-h-[80px]",
      className
    )}
    {...props}
  />
));
ClinicalTextarea.displayName = "ClinicalTextarea";

export const QuestionRenderer = ({ question, formData, onChange, errors }: QuestionRendererProps) => {
  const form = useFormContext();

  // Section separator
  if (question.type === "section") {
    return (
      <div className="pt-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            {question.title || "Sección"}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
    );
  }

  // Helper: wraps field.onChange to also sync to parent formsMap
  const syncChange = (fieldOnChange: (...event: any[]) => void, questionId: string) => {
    return (value: any) => {
      fieldOnChange(value);
      onChange(questionId, value);
    };
  };

  switch (question.type) {
    case "short":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => {
            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              field.onChange(e.target.value);
              onChange(question.id, e.target.value);
            };
            return (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
                <FormControl>
                  <ClinicalInput {...field} value={field.value || ""} onChange={handleChange} placeholder="—" required={question.required} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      );

    case "paragraph":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => {
            const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
              field.onChange(e.target.value);
              onChange(question.id, e.target.value);
            };
            return (
              <FormItem className="space-y-1 w-full">
                <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
                <FormControl>
                  <ClinicalTextarea {...field} value={field.value || ""} onChange={handleChange} placeholder="—" rows={3} required={question.required} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      );

    case "multiple":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
              <FormControl>
                <div
                  className={cn(
                    question.optionLayout === "horizontal"
                      ? "grid gap-1"
                      : "flex flex-col gap-1"
                  )}
                  style={question.optionLayout === "horizontal" ? { gridTemplateColumns: `repeat(${Math.min(question.optionColumns || 2, 3)}, minmax(0, 1fr))` } : undefined}
                >
                  {question.options?.map((option, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-2 cursor-pointer px-1 py-1 rounded hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={field.value === option}
                        onChange={() => syncChange(field.onChange, question.id)(option)}
                        className="accent-primary shrink-0"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "checkbox":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
              <FormControl>
                <div
                  className={cn(
                    question.optionLayout === "horizontal" ? "grid gap-1" : "flex flex-col gap-1"
                  )}
                  style={question.optionLayout === "horizontal" ? { gridTemplateColumns: `repeat(${Math.min(question.optionColumns || 2, 3)}, minmax(0, 1fr))` } : undefined}
                >
                  {question.options?.map((option, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer px-1 py-1 rounded hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={Array.isArray(field.value) && field.value.includes(option)}
                        onCheckedChange={(checked) => {
                          const newValues = checked
                            ? [...(field.value || []), option]
                            : Array.isArray(field.value)
                              ? field.value.filter((v: any) => v !== option)
                              : [];
                          field.onChange(newValues);
                          onChange(question.id, newValues);
                        }}
                        className="shrink-0"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "dropdown":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
              <Select onValueChange={syncChange(field.onChange, question.id)} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-0 border-b border-border/60 rounded-none shadow-none focus:ring-0 focus:border-primary h-9 text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {question.options?.map((option, i) => (
                    <SelectItem key={i} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "calculation":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
              <FormControl>
                <ClinicalInput {...field} value={field.value || ""} placeholder="Auto" disabled className="bg-slate-50/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "vitals":
      return (
        <VitalsViewer
          question={question}
          formData={formData}
          onChange={onChange}
        />
      );

    case "diagnosis":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={() => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
              <div className="space-y-1">
                {question.diagnoses && question.diagnoses.length > 0 ? (
                  question.diagnoses.map(diagnosis => (
                    <div key={diagnosis.id} className="flex items-center gap-2 text-sm py-0.5">
                      <span className="font-medium text-primary tabular-nums">{diagnosis.code}</span>
                      <span className="text-muted-foreground">—</span>
                      <span>{diagnosis.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sin diagnósticos</p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "clinical":
      return (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">{question.title}</span>
          <ClinicalInput
            value={formData[`${question.id}_title`] || ""}
            onChange={(e) => onChange(`${question.id}_title`, e.target.value)}
            placeholder="Título"
            required={question.required}
          />
          <ClinicalTextarea
            value={formData[`${question.id}_detail`] || ""}
            onChange={(e) => onChange(`${question.id}_detail`, e.target.value)}
            placeholder="Detalle"
            rows={2}
            required={question.required}
          />
        </div>
      );

    case "multifield": {
      const isCalc = question.isCalculated || false;
      const calcType = question.calculationType || "sum";
      const numType = question.numberType || "decimal";

      const computeTotal = () => {
        const values = (question.multifields || []).map(f => {
          const raw = formData[`${question.id}_${f.id}`];
          return parseFloat(raw) || 0;
        });
        if (values.length === 0) return 0;
        let result = values[0];
        for (let i = 1; i < values.length; i++) {
          switch (calcType) {
            case "sum": result += values[i]; break;
            case "subtract": result -= values[i]; break;
            case "multiply": result *= values[i]; break;
            case "divide": result = values[i] !== 0 ? result / values[i] : 0; break;
          }
        }
        return numType === "integer" ? Math.round(result) : parseFloat(result.toFixed(4));
      };

      const totalValue = isCalc ? computeTotal() : null;

      return (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">{question.title}</span>
          <div className={cn(
            "space-y-2",
            question.orientation === "horizontal" && "sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3"
          )}>
            {question.multifields?.map((field) => (
              <div key={field.id}>
                <label className="text-xs text-muted-foreground">{field.label}</label>
                <ClinicalInput
                  type={isCalc ? "number" : "text"}
                  step={isCalc && numType === "decimal" ? "any" : undefined}
                  value={formData[`${question.id}_${field.id}`] || ""}
                  onChange={(e) => onChange(`${question.id}_${field.id}`, e.target.value)}
                  required={question.required}
                />
              </div>
            ))}
          </div>
          {isCalc && (
            <div className="pt-1 border-t border-dashed">
              <label className="text-xs text-muted-foreground">Total</label>
              <ClinicalInput
                type="number"
                value={totalValue ?? ""}
                readOnly
                className="bg-slate-50/50 font-semibold"
              />
            </div>
          )}
        </div>
      );
    }

    case "signature":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
              <FormControl>
                <SignaturePad
                  value={field.value || ""}
                  onChange={field.onChange}
                  readOnly={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "file":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs text-muted-foreground">{question.title}</FormLabel>
              <FormControl>
                <div className="border border-dashed border-border/60 rounded-md p-3">
                  <label htmlFor={`file-upload-${question.id}`} className="cursor-pointer flex flex-col items-center">
                    <FileUp size={20} className="text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">
                      {question.fileTypes?.join(', ') || "PDF, JPG, PNG"} (máx. {question.maxFileSize || 2}MB)
                    </span>
                    <input
                      id={`file-upload-${question.id}`}
                      type="file"
                      className="hidden"
                      accept={question.fileTypes?.join(',') || ".pdf,.jpg,.jpeg,.png"}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                          onChange(question.id, file);
                        }
                      }}
                      required={question.required}
                    />
                  </label>
                  {field.value && (
                    <div className="mt-2 text-xs flex items-center justify-between border-t border-dashed pt-1">
                      <span className="truncate max-w-[200px]">{field.value.name}</span>
                      <span className="text-muted-foreground">{(field.value.size / (1024 * 1024)).toFixed(2)}MB</span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "medication":
      return (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{question.title}</span>
          <MedicationManager
            consultationId={formData._consultationId}
            patientId={formData._patientId}
            className="mt-1"
          />
        </div>
      );

    case "scored_checkbox": {
      const items: ScoredOption[] = question.scoredItems ||
        (question.scoredOptions?.map((o, i) => ({ id: `opt${i}`, text: o.label, score: o.score })) || []);
      const mode = question.selectionMode || question.scoredSelectionMode || "single";
      const current = formData[question.id] || { selectedOptions: [], score: 0 };
      const selectedIds: string[] = current.selectedOptions || [];

      const handleToggle = (optId: string) => {
        let next: string[];
        if (mode === "single") {
          next = [optId];
        } else {
          next = selectedIds.includes(optId)
            ? selectedIds.filter((id: string) => id !== optId)
            : [...selectedIds, optId];
        }
        const totalScore = items
          .filter((it) => next.includes(it.id))
          .reduce((sum, it) => sum + it.score, 0);
        onChange(question.id, { selectedOptions: next, score: totalScore });
      };

      return (
        <div className="border-b border-dashed pb-3">
          <span className="text-xs text-muted-foreground">{question.title}</span>
          <div className="space-y-0.5 mt-1.5">
            {items.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer px-1 py-1 rounded hover:bg-muted/50 transition-colors"
                >
                  {mode === "single" ? (
                    <input
                      type="radio"
                      name={question.id}
                      checked={isSelected}
                      onChange={() => handleToggle(opt.id)}
                      className="accent-primary shrink-0"
                    />
                  ) : (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(opt.id)}
                      className="shrink-0"
                    />
                  )}
                  <span className="flex-1 text-sm">{opt.text}</span>
                  <span className="text-xs text-muted-foreground tabular-nums ml-auto">({opt.score} pts)</span>
                </label>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground text-right pt-1">
            Puntaje: {current.score || 0}
          </div>
        </div>
      );
    }

    case "score_total":
      return (
        <ScoreTotalViewer
          question={question}
          formData={formData}
          onChange={onChange}
        />
      );

    default:
      return <div className="text-sm text-muted-foreground">Tipo de pregunta no soportado</div>;
  }
};
