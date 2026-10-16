import { useState } from "react";
import { cn } from "@/lib/utils";

/** Desde este largo un texto se recorta a tres líneas con «Ver todo». */
export const LONG_TEXT_CHARS = 240;

/**
 * Texto largo de un registro (enfermedad actual, evolución, plan): se lee en
 * tres líneas y se abre en su sitio, sin ventanas ni scroll propio.
 */
export function ClampText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="grid justify-items-start gap-1">
      <span className={cn("whitespace-pre-wrap", !open && "line-clamp-3")}>{text}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="rounded-md text-[13px] font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {open ? "Ver menos" : "Ver todo"}
      </button>
    </span>
  );
}
