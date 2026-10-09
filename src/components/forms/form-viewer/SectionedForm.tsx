import { cn } from "@/lib/utils";
import type { QuestionData } from "../question/types";
import { QuestionRenderer } from "./question-renderer";
import { hasAnswer, visibleQuestions } from "./answers";

interface SectionedFormProps {
  questions: QuestionData[];
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
  errors: any;
  /** Preguntas obligatorias sin responder que se deben resaltar. */
  invalidIds?: string[];
  /** En la consulta: abre otra pestaña del área de trabajo. */
  onOpenTab?: (tabId: string) => void;
}

export interface Group {
  key: string;
  title?: string;
  questions: QuestionData[];
}

/** Las preguntas se agrupan en tarjetas por cada «sección» del formato. */
export function groupBySection(questions: QuestionData[]): Group[] {
  const groups: Group[] = [];
  let current: Group = { key: "inicio", questions: [] };
  for (const q of questions) {
    if (q.type === "section") {
      if (current.questions.length || current.title) groups.push(current);
      current = { key: q.id, title: q.title || "Sección", questions: [] };
    } else {
      current.questions.push(q);
    }
  }
  if (current.questions.length || current.title) groups.push(current);
  return groups;
}

/** Solo comparten fila dos listas desplegables seguidas; el resto va a ancho completo. */
const isPairable = (q: QuestionData) => q.type === "dropdown";

function rowsOf(questions: QuestionData[]): QuestionData[][] {
  const rows: QuestionData[][] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const next = questions[i + 1];
    if (next && isPairable(q) && isPairable(next)) {
      rows.push([q, next]);
      i++;
    } else {
      rows.push([q]);
    }
  }
  return rows;
}

/**
 * Diligenciamiento de cualquier formato con el diseño de Ker Hub
 * (docs/ux-ui/sistema-diseno.md §7): una tarjeta por sección con su avance de
 * obligatorios, campos a ancho completo y errores marcados en su sitio.
 */
export function SectionedForm({ questions, formData, onChange, errors, invalidIds = [], onOpenTab }: SectionedFormProps) {
  return (
    <div className="grid gap-4">
      {groupBySection(visibleQuestions(questions, formData)).map((group) => {
        const required = group.questions.filter((q) => q.required);
        const done = required.filter((q) => hasAnswer(q, formData)).length;
        return (
          <section
            key={group.key}
            aria-label={group.title}
            className="grid gap-6 rounded-card border border-transparent bg-card p-5 shadow-card dark:border-border dark:shadow-none md:p-6"
          >
            {group.title && (
              <header className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
                {required.length > 0 && (
                  <span className={cn("text-[13px] tabular-nums", done === required.length ? "font-semibold text-primary" : "text-muted-foreground")}>
                    {done}/{required.length}
                  </span>
                )}
              </header>
            )}
            {rowsOf(group.questions).map((row) => (
              <div key={row.map((q) => q.id).join("+")} className={cn("grid gap-6", row.length === 2 && "sm:grid-cols-2")}>
                {row.map((q) => {
                  const invalid = invalidIds.includes(q.id);
                  return (
                    <div key={q.id} className={cn("min-w-0", invalid && "rounded-[16px] p-3 ring-[1.5px] ring-destructive")}>
                      <QuestionRenderer question={q} formData={formData} onChange={onChange} errors={errors} allQuestions={questions} onOpenTab={onOpenTab} />
                      {invalid && <p className="mt-2 text-[13px] font-medium text-destructive">Este campo es obligatorio</p>}
                    </div>
                  );
                })}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
