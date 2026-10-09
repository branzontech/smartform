import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
  /** Lo ya elegido en ese paso (p. ej. el paciente); reemplaza a la descripción. */
  summary?: ReactNode;
}

interface VerticalStepperProps {
  steps: StepItem[];
  /** Índice del paso actual (desde 0). */
  current: number;
  /** Solo los pasos ya hechos se pueden volver a abrir. */
  onStepClick?: (index: number) => void;
  className?: string;
}

function Marker({ state }: { state: "done" | "current" | "upcoming" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
        state === "done" && "bg-primary",
        state === "current" && "bg-card ring-2 ring-primary shadow-[0_0_0_5px_hsl(var(--primary)/0.15)]",
        state === "upcoming" && "border border-border bg-muted",
      )}
    >
      <span
        className={cn(
          "rounded-full",
          state === "done" && "h-2 w-2 bg-primary-foreground",
          state === "current" && "h-2.5 w-2.5 bg-primary",
          state === "upcoming" && "h-2 w-2 bg-muted-foreground/30",
        )}
      />
    </span>
  );
}

/**
 * Asistente en vertical (docs/ux-ui/sistema-diseno.md): marcador por paso,
 * línea que se pinta con lo completado y, bajo cada paso hecho, lo elegido.
 */
export function VerticalStepper({ steps, current, onStepClick, className }: VerticalStepperProps) {
  return (
    <ol className={cn("space-y-1", className)}>
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        const clickable = state === "done" && !!onStepClick;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.id} className="relative">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute -bottom-2 left-[21px] top-[40px] w-0.5 rounded-full transition-colors duration-200",
                  i < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(i)}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex w-full items-start gap-3 rounded-tile p-2 text-left transition-colors duration-200",
                clickable && "hover:bg-muted/70",
                state === "current" && "bg-muted/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-default",
              )}
            >
              <Marker state={state} />
              <span className="min-w-0 pt-0.5">
                <span
                  className={cn(
                    "block text-sm font-semibold leading-tight",
                    state === "upcoming" ? "text-muted-foreground/70" : "text-foreground",
                  )}
                >
                  {step.title}
                </span>
                {(step.summary || step.description) && (
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[13px]",
                      state === "upcoming" ? "text-muted-foreground/50" : "text-muted-foreground",
                    )}
                  >
                    {state === "done" && step.summary ? step.summary : step.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
