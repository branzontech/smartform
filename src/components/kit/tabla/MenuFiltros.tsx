import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import type { EstadoTabla } from "./useTablaDatos";

/** Botón primario de una vista (uno solo por vista): oscuro y discreto. */
export const botonPrimario =
  "group h-8 gap-1.5 rounded-lg bg-foreground px-3 text-[13px] font-medium text-background shadow-none hover:bg-foreground/90";

export const botonBarra =
  "h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground";

const TODOS = "__todos__";

/** «Filtrar»: todos los filtros en una ventana compacta en lugar de una fila de selects. */
export function MenuFiltros<T>({ t }: { t: EstadoTabla<T> }) {
  if (t.filtros.length === 0) return null;
  const n = t.filtrosActivos;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn(botonBarra, n > 0 && "font-medium text-foreground")}>
          <ListFilter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtrar</span>
          {n > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{n}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-xl p-3 shadow-lg">
        <div className="space-y-2.5">
          {t.filtros.map((f) => {
            const idCampo = `filtro-${f.id}`;
            return (
              <div key={f.id} className="grid grid-cols-[88px_1fr] items-center gap-2">
                <Label htmlFor={idCampo} className="text-xs font-normal text-muted-foreground">{f.titulo}</Label>
                {/* Más de 7 opciones: con buscador. */}
                {t.opcionesFiltro[f.id].length > 7 ? (
                  <SearchableSelect
                    value={t.valoresFiltro[f.id] || ""}
                    onValueChange={(v) => t.setFiltro(f.id, v)}
                    options={t.opcionesFiltro[f.id].map((o) => ({ value: o.valor, label: o.etiqueta }))}
                    placeholder="Todos"
                    clearable
                    triggerClassName="h-8 rounded-lg bg-transparent border-input text-[13px]"
                  />
                ) : (
                  <Select value={t.valoresFiltro[f.id] || TODOS} onValueChange={(v) => t.setFiltro(f.id, v === TODOS ? "" : v)}>
                    <SelectTrigger id={idCampo} className="h-8 rounded-lg text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TODOS} className="text-[13px]">Todos</SelectItem>
                      {t.opcionesFiltro[f.id].map((o) => (
                        <SelectItem key={o.valor} value={o.valor} className="text-[13px]">{o.etiqueta}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
          <div className="flex justify-end border-t border-border pt-2">
            <Button variant="ghost" size="sm" disabled={n === 0} onClick={t.limpiarFiltros} className="h-7 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground">
              Limpiar filtros
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
