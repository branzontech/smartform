import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import type { TableState } from "./useDataTable";

/** Botón primario de una vista (uno solo por vista): oscuro y discreto. */
export const primaryButtonClass =
  "group h-8 gap-1.5 rounded-lg bg-foreground px-3 text-[13px] font-medium text-background shadow-none hover:bg-foreground/90";

export const toolbarButtonClass =
  "h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground";

const ALL = "__all__";

/** «Filtrar»: todos los filtros en una ventana compacta en lugar de una fila de selects. */
export function FilterMenu<T>({ t, compact = false }: { t: TableState<T>; compact?: boolean }) {
  if (t.filters.length === 0) return null;
  const n = t.activeFilterCount;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn(toolbarButtonClass, n > 0 && "font-medium text-foreground")}>
          <ListFilter className="h-4 w-4" />
          <span className={compact ? "sr-only" : "hidden sm:inline"}>Filtrar</span>
          {n > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{n}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={12} className="w-80 rounded-xl p-3 shadow-lg">
        <div className="space-y-2.5">
          {t.filters.map((f) => {
            const fieldId = `filter-${f.id}`;
            return (
              <div key={f.id} className="grid grid-cols-[88px_1fr] items-center gap-2">
                <Label htmlFor={fieldId} className="text-xs font-normal text-muted-foreground">{f.title}</Label>
                {/* Más de 7 opciones: con buscador. */}
                {t.filterOptions[f.id].length > 7 ? (
                  <SearchableSelect
                    value={t.filterValues[f.id] || ""}
                    onValueChange={(v) => t.setFilter(f.id, v)}
                    options={t.filterOptions[f.id]}
                    placeholder="Todos"
                    clearable
                    triggerClassName="h-8 rounded-lg bg-transparent border-input text-[13px]"
                  />
                ) : (
                  <Select value={t.filterValues[f.id] || ALL} onValueChange={(v) => t.setFilter(f.id, v === ALL ? "" : v)}>
                    <SelectTrigger id={fieldId} className="h-8 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL} className="text-[13px]">Todos</SelectItem>
                      {t.filterOptions[f.id].map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
          <div className="flex justify-end border-t border-border pt-2">
            <Button variant="ghost" size="sm" disabled={n === 0} onClick={t.clearFilters} className="h-7 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground">
              Limpiar filtros
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
