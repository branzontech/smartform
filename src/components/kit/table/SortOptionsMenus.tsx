import { ArrowDown, ArrowUp, ArrowUpDown, Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toolbarButtonClass } from "./FilterMenu";
import { downloadCsv } from "./csv";
import type { TableState } from "./useDataTable";

export function SortMenu<T>({ t, compact = false }: { t: TableState<T>; compact?: boolean }) {
  const sortable = t.columns.visible.filter((c) => c.value && !c.unsortable);
  if (sortable.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn(toolbarButtonClass, t.sort && "font-medium text-foreground")}>
          <ArrowUpDown className="h-4 w-4" /><span className={compact ? "sr-only" : "hidden sm:inline"}>Ordenar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={12} className="scroll-suave max-h-[min(var(--radix-dropdown-menu-content-available-height),30rem)] w-52 overflow-y-auto rounded-xl">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Ordenar por</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortable.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => t.toggleSort(c.id)} className="text-[13px]">
            <span className="flex-1">{c.title}</span>
            {t.sort?.column === c.id && (t.sort.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
          </DropdownMenuItem>
        ))}
        {t.sort && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={t.clearSort} className="text-[13px] text-muted-foreground">Quitar orden</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** «Opciones»: columnas visibles y descarga CSV de lo filtrado. */
export function OptionsMenu<T>({ t, fileName }: { t: TableState<T>; fileName: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={toolbarButtonClass}>
          <Settings2 className="h-4 w-4" /><span className="hidden sm:inline">Opciones</span>
        </Button>
      </DropdownMenuTrigger>
      {/* Nunca más alto que el espacio visible: la lista de columnas se desplaza por dentro; título y CSV quedan fijos. */}
      <DropdownMenuContent
        align="end"
        collisionPadding={12}
        className="flex max-h-[min(var(--radix-dropdown-menu-content-available-height),30rem)] w-60 flex-col overflow-hidden rounded-xl"
      >
        <DropdownMenuLabel className="shrink-0 text-xs font-normal text-muted-foreground">Columnas visibles · arrastra el título para reordenar</DropdownMenuLabel>
        <DropdownMenuSeparator className="shrink-0" />
        <div className="scroll-suave min-h-0 flex-1 overflow-y-auto">
        {t.columns.ordered.map((c) => (
          <DropdownMenuItem
            key={c.id}
            disabled={c.alwaysVisible}
            onSelect={(e) => { e.preventDefault(); t.columns.toggle(c.id); }}
            className="cursor-pointer gap-2.5 text-[13px]"
          >
            <Checkbox checked={c.alwaysVisible || t.columns.isVisible(c.id)} tabIndex={-1} aria-hidden className="pointer-events-none h-4 w-4 rounded-[5px]" />
            {c.title}
          </DropdownMenuItem>
        ))}
        </div>
        <DropdownMenuSeparator className="shrink-0" />
        <DropdownMenuItem onClick={() => downloadCsv(fileName, t.columns.visible, t.filtered)} className="shrink-0 text-[13px]">
          <Download className="mr-2 h-4 w-4" />Descargar CSV ({t.filtered.length})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
