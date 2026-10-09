import { useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FilterMenu } from "./FilterMenu";
import { OptionsMenu, SortMenu } from "./SortOptionsMenus";
import type { TableState } from "./useDataTable";

interface TableToolbarProps<T> {
  t: TableState<T>;
  /** [singular, plural] para el conteo: ["contrato", "contratos"]. */
  name: [string, string];
  placeholder?: string;
  /** Acciones sobre la selección (aparecen cuando hay filas marcadas). */
  selectionActions?: ReactNode;
  /** Contenido al inicio de la barra (p. ej. selectores que definen qué se consulta). */
  leading?: ReactNode;
  /** Nombre del CSV descargado (por defecto, el plural de `name`). */
  fileName?: string;
  /** Acción principal de la vista (p. ej. «Registrar movimiento»), al final de la barra. */
  actions?: ReactNode;
  /** Columna angosta (p. ej. lista de un maestro-detalle): solo íconos en Filtrar y Ordenar. */
  compact?: boolean;
  /** Muestra «Opciones» (columnas y CSV). Una lista sin columnas no lo necesita. */
  showOptions?: boolean;
}

function SearchToggle<T>({ t, placeholder, compact }: { t: TableState<T>; placeholder: string; compact: boolean }) {
  const [expanded, setExpanded] = useState(false);
  // Con texto escrito el campo sigue visible aunque pierda el foco.
  const open = expanded || !!t.search;
  return (
    <div className="flex items-center">
      {open && (
        <Input
          autoFocus
          value={t.search}
          aria-label={placeholder}
          onChange={(e) => t.setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") { t.setSearch(""); setExpanded(false); } }}
          onBlur={() => { if (!t.search) setExpanded(false); }}
          placeholder={placeholder}
          className={cn("mr-1 h-8 rounded-lg text-[13px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 [animation-duration:150ms]", compact ? "w-36" : "w-44 sm:w-60")}
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Cerrar búsqueda" : "Buscar"}
        onClick={() => { if (open) t.setSearch(""); setExpanded((v) => !v); }}
        className={cn("h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground", open && "bg-muted text-foreground")}
      >
        {open ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/**
 * Barra de la tabla (va dentro de la tarjeta de DataTable): segmentos con
 * conteo, total y chips de filtros activos a la izquierda; Filtrar, Ordenar,
 * Opciones y búsqueda desplegable a la derecha. Todo en una sola línea.
 * En modo compacto (columna angosta) usa dos: segmentos arriba; filtros activos e íconos abajo.
 */
export function TableToolbar<T>({ t, name, placeholder = "Buscar…", selectionActions, leading, actions, fileName, compact = false, showOptions = true }: TableToolbarProps<T>) {
  const filtersById = Object.fromEntries(t.filters.map((f) => [f.id, f]));
  const segments = (
    <>
      {t.segments.length > 0 && (
        <div role="tablist" aria-label="Vistas" className="scroll-suave flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted/60 p-0.5">
          {t.segments.map((s) => {
            const isActive = t.segment === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => t.setSegment(s.id)}
                className={cn(
                  "flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] transition-[color,background-color,box-shadow] duration-200",
                  isActive ? "bg-background font-medium text-foreground shadow-sm" : "hover:text-foreground",
                )}
              >
                {s.title}
                <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", isActive ? "bg-primary/10 text-primary" : "bg-background/70")}>
                  {t.segmentCounts[s.id]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
  const status = (
    <>
      {/* El total ya se ve en pestañas y segmentos: el conteo solo aparece cuando la búsqueda o los filtros lo cambian. */}
      {t.filtered.length !== (t.segments.length ? t.segmentCounts[t.segment] : t.total) && (
        <span className="pl-1 tabular-nums">
          {t.filtered.length} {t.filtered.length === 1 ? name[0] : name[1]}
        </span>
      )}
      {t.selection.size > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{t.selection.size} seleccionados</span>
          {selectionActions}
        </span>
      )}
      {Object.entries(t.filterValues).map(([id, value]) => (
        <span key={id} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 [animation-duration:150ms]">
          <span className="text-muted-foreground">{filtersById[id]?.title}:</span>
          {t.filterOptions[id]?.find((o) => o.value === value)?.label ?? value}
          <button type="button" aria-label={`Quitar filtro ${filtersById[id]?.title ?? ""}`} onClick={() => t.setFilter(id, "")} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </>
  );
  const tools = (
    <div className="ml-auto flex shrink-0 items-center gap-0.5">
      <FilterMenu t={t} compact={compact} />
      <SortMenu t={t} compact={compact} />
      {showOptions && <OptionsMenu t={t} fileName={fileName ?? name[1]} />}
      <span className="mx-1 h-5 w-px bg-border" />
      <SearchToggle t={t} placeholder={placeholder} compact={compact} />
      {actions && <><span className="mx-1 h-5 w-px bg-border" /><div className="flex items-center gap-1">{actions}</div></>}
    </div>
  );

  if (compact) {
    return (
      <div className="grid w-full gap-2 text-[13px] text-muted-foreground">
        {(leading || t.segments.length > 0) && <div className="flex min-w-0 flex-wrap items-center gap-2">{leading}{segments}</div>}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {status}
          {tools}
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {leading}
        {segments}
        {status}
      </div>
      {tools}
    </div>
  );
}
