import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { QuestionData } from "../question/types";
import { groupBySection } from "../form-viewer/SectionedForm";
import { vitalReadings, type VitalReading } from "../form-viewer/vitals-config";
import { storedAnswer } from "../form-viewer/stored-answer";
import { RANGE_TEXT } from "../form-viewer/score-total-viewer";
import type { ScoreSummary } from "./types";

type Data = Record<string, unknown>;

const isFilled = (v: unknown) => v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "");
const asText = (v: unknown) => (isFilled(v) ? String(v) : "");

/** Partes de una respuesta compuesta (signos vitales, subcampos), en el formato nuevo o el antiguo. */
function partsOf(q: QuestionData, data: Data): Record<string, unknown> {
  const v = storedAnswer(q, data);
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function Vitals({ tiles }: { tiles: VitalReading[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
      {tiles.map((t) => (
        <div key={t.key} className="rounded-tile bg-[hsl(var(--field))] px-3 py-2">
          <div className="text-xs text-muted-foreground">{t.label}</div>
          <div className="text-lg font-semibold tabular-nums">
            {t.value}
            {t.unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{t.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Diagnoses({ value }: { value: unknown }) {
  if (!Array.isArray(value) || value.length === 0) return null;
  return (
    <ul className="grid gap-1.5">
      {value.map((d: Record<string, unknown>, i) => (
        <li key={`${asText(d.codigo ?? d.code)}-${i}`} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="rounded-md bg-[hsl(var(--field))] px-1.5 py-0.5 font-mono text-[13px] text-primary">{asText(d.codigo ?? d.code)}</span>
          <span>{asText(d.descripcion ?? d.name)}</span>
          <span className="text-xs text-muted-foreground">{i === 0 ? "Principal" : "Relacionado"}</span>
        </li>
      ))}
    </ul>
  );
}

function scoredChoice(q: QuestionData, value: unknown) {
  const v = value as { score?: number; selectedOptions?: string[] } | undefined;
  const ids = v?.selectedOptions ?? [];
  if (ids.length === 0) return null;
  const labels = ids.map((id) => q.scoredItems?.find((i) => i.id === id)?.text ?? id);
  return (
    <span>
      {labels.join(", ")}
      <span className="ml-2 text-sm tabular-nums text-muted-foreground">{v?.score ?? 0} pts</span>
    </span>
  );
}

/** Respuesta de una pregunta en modo lectura, o null si no se diligenció. */
function answerOf(q: QuestionData, data: Data): ReactNode {
  const value = data[q.id];
  switch (q.type) {
    case "section":
    case "medication":
    case "score_total":
      return null;
    case "vitals": {
      const tiles = vitalReadings(q, partsOf(q, data));
      return tiles.length ? <Vitals tiles={tiles} /> : null;
    }
    case "diagnosis":
      return Array.isArray(value) && value.length ? <Diagnoses value={value} /> : null;
    case "scored_checkbox":
      return scoredChoice(q, value);
    case "checkbox":
      return Array.isArray(value) && value.length ? value.join(", ") : null;
    case "signature":
      return typeof value === "string" && value.startsWith("data:image") ? (
        <img src={value} alt="Firma del profesional" className="h-20 rounded-tile bg-white px-3 py-1 dark:bg-white/90" />
      ) : null;
    case "file": {
      const name = typeof value === "string" ? value : (value as { name?: string } | undefined)?.name;
      return name ? <span className="break-all">{name}</span> : null;
    }
    case "clinical": {
      const parts = partsOf(q, data);
      if (!isFilled(parts.title) && !isFilled(parts.detail)) return null;
      return (
        <span className="grid gap-0.5">
          {isFilled(parts.title) && <span className="font-medium">{asText(parts.title)}</span>}
          {isFilled(parts.detail) && <span className="whitespace-pre-wrap">{asText(parts.detail)}</span>}
        </span>
      );
    }
    case "multifield": {
      const parts = partsOf(q, data);
      const rows = (q.multifields ?? []).filter((f) => isFilled(parts[f.id]));
      if (rows.length === 0) return null;
      return (
        <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
          {rows.map((f) => (
            <div key={f.id} className="grid sm:contents">
              <dt className="text-sm text-muted-foreground">{f.label}</dt>
              <dd className="whitespace-pre-wrap">{asText(parts[f.id])}</dd>
            </div>
          ))}
        </dl>
      );
    }
    default:
      if (Array.isArray(value)) return value.length ? value.map(asText).join(", ") : null;
      if (value && typeof value === "object") return null;
      return isFilled(value) ? <span className="whitespace-pre-wrap">{asText(value)}</span> : null;
  }
}

export function ScoreResult({ score, className }: { score: ScoreSummary; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span className="text-[44px] font-extrabold leading-none tabular-nums">{score.value}</span>
      {score.max && <span className="text-lg text-muted-foreground">/ {score.max}</span>}
      {score.label && <span className={cn("text-[17px] font-bold", score.color ? RANGE_TEXT[score.color] ?? "" : "text-foreground")}>{score.label}</span>}
    </div>
  );
}

/**
 * Contenido de un registro guardado: secciones con solo lo diligenciado,
 * signos vitales en baldosas, diagnósticos con su código y escalas con su puntaje.
 */
export function RecordBody({ questions, data, score }: { questions: QuestionData[]; data: Data; score: ScoreSummary | null }) {
  const sections = groupBySection(questions)
    .map((g) => ({ ...g, answers: g.questions.map((q) => ({ q, node: answerOf(q, data) })).filter((a) => a.node !== null) }))
    .filter((g) => g.answers.length > 0);
  const answerable = questions.filter((q) => !["section", "medication", "score_total", "calculation"].includes(q.type)).length;
  // Los cálculos no se diligencian: no cuentan ni como pendientes ni como respondidos.
  const answered = sections.reduce((n, g) => n + g.answers.filter((a) => a.q.type !== "calculation").length, 0);

  return (
    <div className="grid">
      {score && (
        <section aria-label="Resultado" className="grid gap-3 border-b border-border py-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Resultado</h4>
          <ScoreResult score={score} />
        </section>
      )}
      {sections.map((g) => (
        <section key={g.key} aria-label={g.title ?? "Datos"} className="grid gap-3 border-b border-border py-5 last:border-b-0">
          {g.title && <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">{g.title}</h4>}
          <dl className="grid gap-x-6 gap-y-3 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
            {g.answers.map(({ q, node }) => (
              <div key={q.id} className="grid gap-0.5 lg:contents">
                <dt className="text-[13px] text-muted-foreground lg:pt-0.5">{q.title}</dt>
                <dd className="min-w-0 text-[15px] text-foreground">{node}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {sections.length === 0 && !score && <p className="py-8 text-center text-sm text-muted-foreground">Este registro no tiene respuestas.</p>}
      {answered < answerable && (
        <p className="pt-3 text-xs text-muted-foreground">
          {answerable - answered} {answerable - answered === 1 ? "campo quedó" : "campos quedaron"} sin diligenciar y no se muestran.
        </p>
      )}
    </div>
  );
}
