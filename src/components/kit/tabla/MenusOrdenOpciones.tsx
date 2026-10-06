import { ArrowDown, ArrowUp, ArrowUpDown, Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { botonBarra } from "./MenuFiltros";
import { descargarCsv } from "./csv";
import type { EstadoTabla } from "./useTablaDatos";

export function MenuOrden<T>({ t }: { t: EstadoTabla<T> }) {
  const ordenables = t.columnas.visibles.filter((c) => c.valor && !c.sinOrden);
  if (ordenables.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn(botonBarra, t.orden && "font-medium text-foreground")}>
          <ArrowUpDown className="h-4 w-4" /><span className="hidden sm:inline">Ordenar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={12} className="scroll-suave max-h-[min(var(--radix-dropdown-menu-content-available-height),30rem)] w-52 overflow-y-auto rounded-xl">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Ordenar por</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ordenables.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => t.alternarOrden(c.id)} className="text-[13px]">
            <span className="flex-1">{c.titulo}</span>
            {t.orden?.columna === c.id && (t.orden.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
          </DropdownMenuItem>
        ))}
        {t.orden && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={t.quitarOrden} className="text-[13px] text-muted-foreground">Quitar orden</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** «Opciones»: columnas visibles y descarga CSV de lo filtrado. */
export function MenuOpciones<T>({ t, nombreArchivo }: { t: EstadoTabla<T>; nombreArchivo: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={botonBarra}>
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
        {t.columnas.ordenadas.map((c) => (
          <DropdownMenuItem
            key={c.id}
            disabled={c.fija}
            onSelect={(e) => { e.preventDefault(); t.columnas.alternar(c.id); }}
            className="cursor-pointer gap-2.5 text-[13px]"
          >
            <Checkbox checked={c.fija || t.columnas.esVisible(c.id)} tabIndex={-1} aria-hidden className="pointer-events-none h-4 w-4 rounded-[5px]" />
            {c.titulo}
          </DropdownMenuItem>
        ))}
        </div>
        <DropdownMenuSeparator className="shrink-0" />
        <DropdownMenuItem onClick={() => descargarCsv(nombreArchivo, t.columnas.visibles, t.filtradas)} className="shrink-0 text-[13px]">
          <Download className="mr-2 h-4 w-4" />Descargar CSV ({t.filtradas.length})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
