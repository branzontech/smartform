import { cn } from "@/lib/utils";

export interface BarTab<K extends string> {
  id: K;
  title: string;
  count?: number;
  /** Resalta el conteo (p. ej. tareas pendientes o vencidas). */
  alert?: boolean;
}

/**
 * Pestañas de página (cambian de lista, no de filtro). Estilo subrayado para
 * distinguirlas a simple vista de los segmentos de filtro de TableToolbar. En móvil se desplazan en horizontal.
 */
export function BarTabs<K extends string>({ tabs, active, onChange, label }: {
  tabs: BarTab<K>[];
  active: K;
  onChange: (id: NoInfer<K>) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="scroll-suave -mx-1 flex items-end gap-1 overflow-x-auto px-1">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-[13px] transition-colors duration-200",
              "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
              selected ? "font-semibold text-foreground after:bg-primary" : "text-muted-foreground after:bg-transparent hover:text-foreground",
            )}
          >
            {tab.title}
            {tab.count !== undefined && (
              <span className={cn(
                "rounded-full px-1.5 text-[11px] font-medium tabular-nums",
                tab.alert && tab.count > 0 ? "bg-destructive text-destructive-foreground" : selected ? "bg-primary/10 text-primary" : "bg-muted",
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
