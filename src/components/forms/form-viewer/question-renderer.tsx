import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SignaturePad } from "@/components/ui/question-types";
import { QuestionData, ScoredOption } from "../question/types";
import { Check, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreTotalViewer } from "./score-total-viewer";
import { VitalsViewer } from "./vitals-viewer";
import { DiagnosisSearch, type SelectedDiagnosis } from "@/components/admissions/DiagnosisSearch";

const ICD10_URI = "http://hl7.org/fhir/sid/icd-10";

interface QuestionRendererProps {
  question: QuestionData;
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
  errors: any;
  /** Todas las preguntas del formato: el total de una escala calcula su máximo con ellas. */
  allQuestions?: QuestionData[];
  /** En la consulta: abre otra pestaña del área de trabajo (p. ej. Medicamentos). */
  onOpenTab?: (tabId: string) => void;
}

/** Opciones cortas (≤ 3, ≤ 28 caracteres) caben en una fila de columnas; el resto va una debajo de otra. */
export const isShortChoice = (options: string[] = []) =>
  options.length > 0 && options.length <= 3 && options.every((o) => o.length <= 28);

/** Indicador de la fila de opción: círculo (única) o casilla (varias). Sin chips (decisión del usuario). */
const OptionMark = ({ checked, multiple }: { checked: boolean; multiple?: boolean }) => (
  <span aria-hidden className={cn(
    "grid h-5 w-5 shrink-0 place-items-center border-2 transition-colors",
    multiple ? "rounded-md" : "rounded-full",
    checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-card",
  )}>
    {checked && (multiple ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-primary-foreground" />)}
  </span>
);

const optionGrid = (q: QuestionData, options: string[]) => {
  if (q.optionLayout === "horizontal") return { className: "grid gap-2", style: { gridTemplateColumns: `repeat(${Math.min(q.optionColumns || 2, 3)}, minmax(0, 1fr))` } };
  return { className: cn("grid gap-2", isShortChoice(options) && "sm:grid-cols-3"), style: undefined };
};

/** Etiqueta común de las preguntas: 15 px, con asterisco de obligatorio. */
export const QuestionLabel = ({ htmlFor, id, children, required }: { htmlFor?: string; id?: string; children: React.ReactNode; required?: boolean }) => (
  <label htmlFor={htmlFor} id={id} className="kh-label block">
    {children}
    {required && <span className="ml-0.5 text-primary" aria-hidden="true">*</span>}
  </label>
);

const Field = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("grid min-w-0 gap-2", className)}>{children}</div>
);

export const QuestionRenderer = ({ question, formData, onChange, allQuestions, onOpenTab }: QuestionRendererProps) => {
  const form = useFormContext();
  const inputId = `q-${question.id}`;
  const labelId = `q-${question.id}-label`;

  // Las secciones las pinta SectionedForm como tarjetas; aquí solo queda el título.
  if (question.type === "section") {
    return <h2 className="text-lg font-semibold text-foreground">{question.title || "Sección"}</h2>;
  }

  // Sincroniza react-hook-form con el estado del formulario de la página.
  const syncChange = (fieldOnChange: (...event: any[]) => void, questionId: string) => {
    return (value: any) => {
      fieldOnChange(value);
      onChange(questionId, value);
    };
  };

  switch (question.type) {
    case "short":
    case "paragraph": {
      const long = question.type === "paragraph";
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <QuestionLabel htmlFor={inputId} required={question.required}>{question.title}</QuestionLabel>
              <FormControl>
                {long ? (
                  <textarea
                    {...field}
                    id={inputId}
                    value={field.value || ""}
                    onChange={(e) => syncChange(field.onChange, question.id)(e.target.value)}
                    rows={3}
                    className="kh-field min-h-[96px] resize-y leading-relaxed"
                  />
                ) : (
                  <input
                    {...field}
                    id={inputId}
                    value={field.value || ""}
                    onChange={(e) => syncChange(field.onChange, question.id)(e.target.value)}
                    className="kh-field"
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    case "dropdown": {
      const options = question.options?.filter((o) => o.trim() !== "") ?? [];
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <QuestionLabel htmlFor={inputId} required={question.required}>{question.title}</QuestionLabel>
              <Select onValueChange={syncChange(field.onChange, question.id)} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger id={inputId} className="kh-field h-auto min-h-[50px] border-transparent bg-[hsl(var(--field))] focus:border-primary [&>span]:text-left">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((option, i) => <SelectItem key={`${option}-${i}`} value={option} className="py-2.5 text-[15px]">{option}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    case "multiple": {
      const options = question.options?.filter((o) => o.trim() !== "") ?? [];
      const grid = optionGrid(question, options);
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <QuestionLabel id={labelId} required={question.required}>{question.title}</QuestionLabel>
              <div role="radiogroup" aria-labelledby={labelId} className={grid.className} style={grid.style}>
                {options.map((option, i) => (
                  <button
                    key={`${option}-${i}`}
                    type="button"
                    role="radio"
                    aria-checked={field.value === option}
                    onClick={() => syncChange(field.onChange, question.id)(field.value === option ? "" : option)}
                    className="kh-row justify-start"
                  >
                    <OptionMark checked={field.value === option} />
                    <span>{option}</span>
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    case "checkbox": {
      const options = question.options?.filter((o) => o.trim() !== "") ?? [];
      const grid = optionGrid(question, options);
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => {
            const values: string[] = Array.isArray(field.value) ? field.value : [];
            const toggle = (option: string) => {
              const next = values.includes(option) ? values.filter((v) => v !== option) : [...values, option];
              syncChange(field.onChange, question.id)(next);
            };
            return (
              <FormItem className="grid gap-2 space-y-0">
                <QuestionLabel id={labelId} required={question.required}>{question.title}</QuestionLabel>
                <span className="kh-help">Puedes elegir varias</span>
                <div role="group" aria-labelledby={labelId} className={grid.className} style={grid.style}>
                  {options.map((option, i) => (
                    <button
                      key={`${option}-${i}`}
                      type="button"
                      role="checkbox"
                      aria-checked={values.includes(option)}
                      onClick={() => toggle(option)}
                      className="kh-row justify-start"
                    >
                      <OptionMark checked={values.includes(option)} multiple />
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      );
    }

    case "calculation":
      return (
        <Field>
          <QuestionLabel htmlFor={inputId}>{question.title}</QuestionLabel>
          <input id={inputId} value={formData[question.id] ?? ""} placeholder="Se calcula automáticamente" disabled className="kh-field" />
        </Field>
      );

    case "vitals":
      return <VitalsViewer question={question} formData={formData} onChange={onChange} />;

    case "diagnosis":
      // El profesional busca el diagnóstico al atender (CIE-10/CIE-11). Los que el
      // diseñador dejó en el formulario se ofrecen como sugerencias de un clic.
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{
            validate: (v) => !question.required || (Array.isArray(v) && v.length > 0) || "Agrega al menos un diagnóstico",
          }}
          render={({ field }) => {
            const selected: SelectedDiagnosis[] = Array.isArray(field.value) ? field.value : [];
            const setSelected = syncChange(field.onChange, question.id);
            const suggestions = (question.diagnoses ?? []).filter((d) => !selected.some((s) => s.codigo === d.code));
            return (
              <FormItem className="grid gap-2 space-y-0">
                <QuestionLabel required={question.required}>{question.title}</QuestionLabel>
                <DiagnosisSearch diagnoses={selected} onChange={setSelected} />
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="kh-help">Sugeridos:</span>
                    {suggestions.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelected([...selected, { codigo: d.code, descripcion: d.name, sistema: "CIE-10", fhir_system_uri: ICD10_URI }])}
                        className="rounded-md px-1 text-[13px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        + {d.code} {d.name}
                      </button>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />
      );

    case "clinical":
      return (
        <Field>
          <QuestionLabel htmlFor={`${inputId}-title`} required={question.required}>{question.title}</QuestionLabel>
          <input
            id={`${inputId}-title`}
            value={formData[`${question.id}_title`] || ""}
            onChange={(e) => onChange(`${question.id}_title`, e.target.value)}
            placeholder="Título"
            className="kh-field"
          />
          <textarea
            aria-label={`${question.title}: detalle`}
            value={formData[`${question.id}_detail`] || ""}
            onChange={(e) => onChange(`${question.id}_detail`, e.target.value)}
            placeholder="Detalle"
            rows={3}
            className="kh-field min-h-[96px] resize-y leading-relaxed"
          />
        </Field>
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
        <Field>
          <QuestionLabel required={question.required}>{question.title}</QuestionLabel>
          <div className={cn("grid gap-4", question.orientation === "horizontal" && "sm:grid-cols-2")}>
            {question.multifields?.map((field) => (
              <div key={field.id} className="grid gap-1.5">
                <label htmlFor={`${inputId}-${field.id}`} className="kh-help font-medium">{field.label}</label>
                <input
                  id={`${inputId}-${field.id}`}
                  type={isCalc ? "number" : "text"}
                  step={isCalc && numType === "decimal" ? "any" : undefined}
                  value={formData[`${question.id}_${field.id}`] || ""}
                  onChange={(e) => onChange(`${question.id}_${field.id}`, e.target.value)}
                  className="kh-field"
                />
              </div>
            ))}
          </div>
          {isCalc && (
            <div className="flex items-baseline justify-between rounded-[14px] bg-primary/5 px-4 py-3">
              <span className="kh-help font-semibold">Total calculado</span>
              <span className="text-2xl font-bold tabular-nums text-foreground">{totalValue ?? "—"}</span>
            </div>
          )}
        </Field>
      );
    }

    case "signature":
      return (
        <FormField
          control={form.control}
          name={question.id}
          rules={{ required: question.required }}
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <QuestionLabel required={question.required}>{question.title}</QuestionLabel>
              <FormControl>
                <div className="overflow-hidden rounded-[16px] bg-[hsl(var(--field))]">
                  <SignaturePad value={field.value || ""} onChange={syncChange(field.onChange, question.id)} readOnly={false} />
                </div>
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
            <FormItem className="grid gap-2 space-y-0">
              <QuestionLabel htmlFor={`file-upload-${question.id}`} required={question.required}>{question.title}</QuestionLabel>
              <FormControl>
                <label
                  htmlFor={`file-upload-${question.id}`}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[16px] border-[1.5px] border-dashed border-border bg-[hsl(var(--field))] px-4 py-6 text-center transition-colors hover:border-primary"
                >
                  <FileUp size={22} className="text-primary" />
                  <span className="text-[15px] font-medium text-foreground">
                    {field.value?.name ? field.value.name : "Elige un archivo"}
                  </span>
                  <span className="kh-help">
                    {field.value?.size
                      ? `${(field.value.size / (1024 * 1024)).toFixed(2)} MB`
                      : `${question.fileTypes?.join(", ") || "PDF, JPG, PNG"} · máx. ${question.maxFileSize || 2} MB`}
                  </span>
                  <input
                    id={`file-upload-${question.id}`}
                    type="file"
                    className="sr-only"
                    accept={question.fileTypes?.join(',') || ".pdf,.jpg,.jpeg,.png"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        field.onChange(file);
                        onChange(question.id, file);
                      }
                    }}
                  />
                </label>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "medication":
      // La fórmula se hace en la pestaña Medicamentos de la consulta, no en medio de la historia.
      return (
        <Field>
          <QuestionLabel>{question.title}</QuestionLabel>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[hsl(var(--field))] px-4 py-3">
            <span className="text-[15px] text-muted-foreground">Los medicamentos se formulan en la pestaña Medicamentos, sin salir de la consulta.</span>
            {onOpenTab && (
              <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenTab("orden-medicamento")}>
                Abrir Medicamentos
              </Button>
            )}
          </div>
        </Field>
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
          next = selectedIds.includes(optId) ? [] : [optId];
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
        <Field>
          <QuestionLabel id={labelId} required={question.required}>{question.title}</QuestionLabel>
          {mode !== "single" && <span className="kh-help">Puedes elegir varias</span>}
          <div role={mode === "single" ? "radiogroup" : "group"} aria-labelledby={labelId} className="grid gap-2">
            {items.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  role={mode === "single" ? "radio" : "checkbox"}
                  aria-checked={isSelected}
                  onClick={() => handleToggle(opt.id)}
                  className="kh-row"
                >
                  <span>{opt.text}</span>
                  <span className={cn(
                    "grid h-8 min-w-11 shrink-0 place-items-center rounded-full px-2 text-[15px] font-semibold tabular-nums",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}>
                    {opt.score}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      );
    }

    case "score_total":
      return <ScoreTotalViewer question={question} formData={formData} onChange={onChange} allQuestions={allQuestions} />;

    default:
      return <div className="kh-help">Tipo de pregunta no soportado</div>;
  }
};
