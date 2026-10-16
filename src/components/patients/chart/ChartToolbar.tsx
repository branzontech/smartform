import { useState } from "react";
import { Check, ListFilter, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CITA_GROUP_LABEL, EMPTY_FILTER, type CitaFilter, type CitaGroup } from "./chart-model";

const iconButton =
  "relative grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-canvas hover:text-foreground active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function Option({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="menuitemcheckbox" aria-checked={on} onClick={onClick} className="flex h-9 w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-[13px] text-foreground hover:bg-canvas">
      <span className="truncate">{label}</span>
      {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

/** Cuántos criterios del filtro se apartan de «todo». */
const activeCount = (f: CitaFilter) => (f.groups.length < EMPTY_FILTER.groups.length ? 1 : 0) + (f.professional ? 1 : 0);

/**
 * Búsqueda desplegable y, en las atenciones, Filtrar en un panel anclado al
 * botón (nunca una ventana): estado y profesional.
 */
export function ChartToolbar({
  search,
  onSearch,
  filter,
  onFilter,
  professionals = [],
}: {
  search: string;
  onSearch: (value: string) => void;
  filter?: CitaFilter;
  onFilter?: (f: CitaFilter) => void;
  professionals?: string[];
}) {
  const [searching, setSearching] = useState(!!search);
  const toggleGroup = (g: CitaGroup) => {
    if (!filter || !onFilter) return;
    const groups = filter.groups.includes(g) ? filter.groups.filter((x) => x !== g) : [...filter.groups, g];
    onFilter({ ...filter, groups: groups.length ? groups : EMPTY_FILTER.groups });
  };
  const count = filter ? activeCount(filter) : 0;

  if (searching) {
    return (
      <div className="flex h-8 flex-1 items-center gap-2 rounded-lg bg-canvas pl-2.5 pr-1">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar en la historia"
          aria-label="Buscar en la historia"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <button type="button" aria-label="Cerrar búsqueda" onClick={() => { onSearch(""); setSearching(false); }} className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <button type="button" aria-label="Buscar en la historia" title="Buscar" onClick={() => setSearching(true)} className={iconButton}>
        <Search className="h-4 w-4" />
      </button>
      {filter && onFilter && (
        <Popover>
          <PopoverTrigger aria-label="Filtrar" title="Filtrar" className={cn(iconButton, count > 0 && "text-primary")}>
            <ListFilter className="h-4 w-4" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{count}</span>}
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={6} className="w-64 rounded-2xl border-0 p-2 shadow-[0_12px_32px_rgba(15,23,42,.14)]">
            <p className="px-2.5 pb-1 pt-1 text-[12px] text-muted-foreground">Estado</p>
            {(Object.keys(CITA_GROUP_LABEL) as CitaGroup[]).map((g) => (
              <Option key={g} label={CITA_GROUP_LABEL[g]} on={filter.groups.includes(g)} onClick={() => toggleGroup(g)} />
            ))}
            <p className="px-2.5 pb-1 pt-3 text-[12px] text-muted-foreground">Profesional</p>
            <div className="max-h-48 overflow-y-auto">
              <Option label="Todos" on={!filter.professional} onClick={() => onFilter({ ...filter, professional: null })} />
              {professionals.map((p) => (
                <Option key={p} label={p} on={filter.professional === p} onClick={() => onFilter({ ...filter, professional: p })} />
              ))}
            </div>
            {count > 0 && (
              <button type="button" onClick={() => onFilter({ ...EMPTY_FILTER, search: filter.search })} className="mt-1 h-8 w-full rounded-lg text-[13px] font-medium text-primary hover:bg-canvas">
                Quitar filtros
              </button>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
