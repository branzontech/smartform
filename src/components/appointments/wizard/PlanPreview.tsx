import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatShortDay } from "@/components/agenda/agenda-api";
import type { SessionCheck } from "@/components/agenda/plans-api";

interface PlanPreviewProps {
  checks: SessionCheck[];
  /** Sesiones que quien agenda dejó por fuera. */
  removed: ReadonlySet<number>;
  onToggle: (sesion: number, included: boolean) => void;
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1);

function resolution(s: SessionCheck): string | null {
  if (!s.problema) return null;
  return s.alternativa
    ? `${s.problema} Se mueve a ${formatShortDay(s.alternativa.fecha)}, ${s.alternativa.hora}.`
    : `${s.problema} Sin cupo cercano: no se agenda.`;
}

/** Las sesiones que genera el plan, con lo que se movió o no se puede, para revisar antes de agendar. */
export function PlanPreview({ checks, removed, onToggle }: PlanPreviewProps) {
  const moved = checks.filter((s) => s.problema && s.alternativa).length;
  const impossible = checks.filter((s) => s.problema && !s.alternativa).length;
  const scheduled = checks.filter((s) => !removed.has(s.sesion) && (!s.problema || s.alternativa)).length;

  return (
    <div className="grid gap-2">
      <p className="text-[13px] text-muted-foreground">
        <span className="font-semibold text-foreground">
          {scheduled} {scheduled === 1 ? "sesión" : "sesiones"} por agendar
        </span>
        {moved > 0 && ` · ${moved} ${moved === 1 ? "movida" : "movidas"}`}
        {impossible > 0 && ` · ${impossible} sin cupo`}
      </p>
      <ol className="grid gap-0.5">
        {checks.map((s) => {
          const blocked = !!s.problema && !s.alternativa;
          const included = !blocked && !removed.has(s.sesion);
          const day = s.problema && s.alternativa ? s.alternativa.fecha : s.fecha;
          const hour = s.problema && s.alternativa ? s.alternativa.hora : s.hora;
          const note = resolution(s);
          return (
            <li key={s.sesion} className={cn("flex items-start gap-3 rounded-xl px-2 py-2 transition-colors duration-200", included ? "hover:bg-muted/50" : "opacity-55")}>
              <Checkbox
                className="mt-0.5"
                checked={included}
                disabled={blocked}
                aria-label={`Incluir la sesión ${s.sesion}`}
                onCheckedChange={(v) => onToggle(s.sesion, v === true)}
              />
              <span className="w-8 shrink-0 text-xs tabular-nums text-muted-foreground">{s.sesion}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-foreground">
                  {capitalize(formatShortDay(day))} · <span className="tabular-nums">{hour}</span> · {s.profesional}
                </span>
                {note && <span className={cn("block text-xs", s.alternativa ? "text-muted-foreground" : "text-[hsl(var(--warning))]")}>{note}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
