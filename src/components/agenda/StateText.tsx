import { cn } from "@/lib/utils";
import { STATE_LABEL, STATE_TONE, type CitaState } from "./agenda-api";

const TONE_TEXT: Record<(typeof STATE_TONE)[CitaState], string> = {
  success: "text-[hsl(var(--success))]",
  warning: "text-[hsl(var(--warning))]",
  error: "text-destructive",
  info: "text-[hsl(var(--info))]",
  neutral: "text-muted-foreground",
};

/** Estado de la cita como texto coloreado (sin puntos ni píldoras). */
export function StateText({ state, className }: { state: CitaState; className?: string }) {
  return <span className={cn("text-[13px] font-medium", TONE_TEXT[STATE_TONE[state]], className)}>{STATE_LABEL[state]}</span>;
}
