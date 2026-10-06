import { cn } from "@/lib/utils";

export interface PestanaBarra<K extends string> {
  id: K;
  titulo: string;
  conteo?: number;
  /** Resalta el conteo (p. ej. tareas pendientes o vencidas). */
  alerta?: boolean;
}

/**
 * Pestañas de página (cambian de lista, no de filtro). Estilo subrayado para
 * distinguirlas a simple vista de los segmentos de filtro de BarraTabla. Van
 * en el slot `pestanas` de SeccionHeader. En móvil se desplazan en horizontal.
 */
export function PestanasBarra<K extends string>({ pestanas, activa, onCambio, etiqueta }: {
  pestanas: PestanaBarra<K>[];
  activa: K;
  onCambio: (id: NoInfer<K>) => void;
  etiqueta: string;
}) {
  return (
    <div role="tablist" aria-label={etiqueta} className="scroll-suave -mx-1 flex items-end gap-1 overflow-x-auto px-1">
      {pestanas.map((p) => {
        const sel = activa === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={sel}
            onClick={() => onCambio(p.id)}
            className={cn(
              "relative flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-[13px] transition-colors duration-200",
              "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
              sel ? "font-semibold text-foreground after:bg-primary" : "text-muted-foreground after:bg-transparent hover:text-foreground",
            )}
          >
            {p.titulo}
            {p.conteo !== undefined && (
              <span className={cn(
                "rounded-full px-1.5 text-[11px] font-medium tabular-nums",
                p.alerta && p.conteo > 0 ? "bg-destructive text-destructive-foreground" : sel ? "bg-primary/10 text-primary" : "bg-muted",
              )}>
                {p.conteo}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
