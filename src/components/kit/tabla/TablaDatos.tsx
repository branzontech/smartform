import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TablaSkeleton } from "../TablaSkeleton";
import { PaginacionTabla } from "./PaginacionTabla";
import type { EstadoTabla } from "./useTablaDatos";
import { useFilasOcultas } from "./useFilasOcultas";

/* La columna de acciones siempre se ve y queda fija a la derecha al desplazar la tabla. */
const fijaDerecha = "sticky right-0 z-[2] border-l border-border/50 bg-card";

interface TablaDatosProps<T> {
  t: EstadoTabla<T>;
  cargando?: boolean;
  onFilaClick?: (fila: T) => void;
  /** Botones por fila: columna «Acciones» siempre visible y fija a la derecha. */
  acciones?: (fila: T) => ReactNode;
  seleccionable?: boolean;
  vacio?: ReactNode;
  /** Clases extra del contenedor con scroll horizontal. */
  contenedorClassName?: string;
  /** Barra de la tabla (BarraTabla) dentro de la tarjeta, encima de las columnas. */
  barra?: ReactNode;
  /** Pie dentro de la tarjeta, bajo las filas (totales de reportes y libros). */
  pie?: ReactNode;
}

/**
 * Tabla estilo Inventario (equipo tracker): tarjeta redondeada, divisores
 * suaves entre columnas, títulos que ordenan y se arrastran para reordenar,
 * fila que se eleva (sin barra lateral de acento) y columna de acciones fija.
 */
export function TablaDatos<T>({ t, cargando, onFilaClick, acciones, seleccionable, vacio, contenedorClassName, barra, pie }: TablaDatosProps<T>) {
  const [arrastrada, setArrastrada] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const cols = t.columnas.visibles;
  const totalCols = cols.length + (seleccionable ? 1 : 0) + (acciones ? 1 : 0);
  const { tablaRef, ocultas, verMas } = useFilasOcultas(`${t.pagina}|${t.porPagina}`, t.visibles.length);
  const paginaMarcada = t.visibles.length > 0 && t.visibles.every((r) => t.seleccion.has(t.claveFila(r)));

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {barra && <div className="border-b border-border px-3 py-1.5">{barra}</div>}
        <Table
          ref={tablaRef}
          contenedorClassName={cn("scroll-tabla", contenedorClassName)}
          className="[&_td:last-child]:border-r-0 [&_td]:border-r [&_td]:border-border/50 [&_th:last-child]:border-r-0 [&_th]:border-r [&_th]:border-border/50"
        >
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              {seleccionable && (
                <TableHead className="h-10 w-11 px-0 text-center">
                  <Checkbox aria-label="Seleccionar página" checked={paginaMarcada} onCheckedChange={(v) => t.seleccionarPagina(v === true)} />
                </TableHead>
              )}
              {cols.map((c) => {
                const orden = t.orden?.columna === c.id ? t.orden.dir : null;
                return (
                  <TableHead
                    key={c.id}
                    draggable
                    onDragStart={() => setArrastrada(c.id)}
                    onDragEnd={() => { setArrastrada(null); setDestino(null); }}
                    onDragOver={(e) => { e.preventDefault(); if (arrastrada && arrastrada !== c.id) setDestino(c.id); }}
                    onDragLeave={() => setDestino((d) => (d === c.id ? null : d))}
                    onDrop={(e) => { e.preventDefault(); if (arrastrada) t.columnas.mover(arrastrada, c.id); setArrastrada(null); setDestino(null); }}
                    aria-sort={orden === "asc" ? "ascending" : orden === "desc" ? "descending" : undefined}
                    className={cn(
                      "group/th h-10 cursor-grab select-none whitespace-nowrap px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted",
                      arrastrada === c.id && "opacity-50",
                      destino === c.id && "bg-primary/10",
                      c.sinPadding && "min-w-[7.5rem] text-center",
                      c.className,
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <GripVertical aria-hidden className="-ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover/th:opacity-100" />
                      {c.valor && !c.sinOrden ? (
                        <button type="button" onClick={() => t.alternarOrden(c.id)} className="flex items-center gap-1 hover:text-foreground">
                          {c.titulo}
                          {orden === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
                          {orden === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
                        </button>
                      ) : c.titulo}
                    </div>
                  </TableHead>
                );
              })}
              {acciones && <TableHead className={cn(fijaDerecha, "h-10 w-px px-3 text-[12px] font-medium text-muted-foreground shadow-[inset_0_0_0_999px_hsl(var(--muted)/0.4),-8px_0_10px_-8px_hsl(var(--foreground)/0.15)]")}>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando && t.total === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={totalCols} className="p-0">
                {/* Aparece a los 200 ms: si los datos llegan antes, no hay parpadeo de esqueleto. */}
                <div className="animate-in fade-in [animation-delay:200ms] [animation-duration:200ms] [animation-fill-mode:both]">
                  <TablaSkeleton columnas={Math.min(cols.length, 6)} />
                </div>
              </TableCell></TableRow>
            )}
            {!cargando && t.visibles.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={totalCols} className="h-32 text-center text-sm text-muted-foreground">
                  {t.total === 0 ? vacio ?? "Sin registros." : t.busqueda || t.filtrosActivos > 0 ? "Ningún registro coincide con la búsqueda o los filtros." : `No hay registros en «${t.segmentos.find((s) => s.id === t.segmento)?.titulo ?? "esta vista"}».`}
                </TableCell>
              </TableRow>
            )}
            {t.visibles.map((fila) => {
              const clave = t.claveFila(fila);
              const marcada = t.seleccion.has(clave);
              return (
                <TableRow
                  key={clave}
                  data-state={marcada ? "selected" : undefined}
                  tabIndex={onFilaClick ? 0 : undefined}
                  onClick={onFilaClick ? () => onFilaClick(fila) : undefined}
                  onKeyDown={onFilaClick ? (e) => { if (e.key === "Enter") onFilaClick(fila); } : undefined}
                  className={cn(
                    "group/fila relative h-11 border-b border-border/60 transition-[background-color,box-shadow,transform] duration-300 ease-out",
                    "hover:z-[1] hover:bg-muted/40 hover:shadow-[0_10px_24px_-16px_hsl(var(--foreground)/0.35)] motion-safe:hover:-translate-y-px",
                    "focus-visible:bg-muted/40 focus-visible:outline-none data-[state=selected]:bg-primary/5",
                    onFilaClick && "cursor-pointer",
                  )}
                >
                  {seleccionable && (
                    <TableCell className="relative w-11 p-0 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label="Seleccionar fila" checked={marcada} onCheckedChange={() => t.alternarSeleccion(clave)} />
                    </TableCell>
                  )}
                  {cols.map((c) => (
                    <TableCell
                      key={c.id}
                      className={cn(
                        "relative h-11 whitespace-nowrap text-[13px]",
                        c.sinPadding ? "min-w-[7.5rem] p-0" : "px-3 py-0",
                        c.principal ? "font-medium text-foreground" : "text-muted-foreground",
                        c.className,
                      )}
                    >
                      {c.sinPadding ? (c.celda?.(fila) ?? c.valor?.(fila)) : (
                        <div className="transition-transform duration-300 ease-out motion-safe:group-hover/fila:translate-x-0.5">
                          {c.celda ? c.celda(fila) : (c.valor?.(fila) ?? <span className="text-muted-foreground/50">—</span>)}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  {acciones && (
                    <TableCell
                      className={cn(
                        fijaDerecha,
                        "px-2 py-0 shadow-[-8px_0_10px_-8px_hsl(var(--foreground)/0.15)] transition-shadow duration-300",
                        "group-hover/fila:shadow-[inset_0_0_0_999px_hsl(var(--muted)/0.4),-8px_0_10px_-8px_hsl(var(--foreground)/0.15)]",
                        marcada && "shadow-[inset_0_0_0_999px_hsl(var(--primary)/0.05),-8px_0_10px_-8px_hsl(var(--foreground)/0.15)]",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-0.5">{acciones(fila)}</div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {pie && <div className="border-t border-border bg-muted/30 px-3 py-2 text-[13px] tabular-nums text-muted-foreground">{pie}</div>}
        {/* Hay filas debajo del área visible: se dice cuántas y se llega a ellas con un clic. */}
        {ocultas > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-center bg-gradient-to-t from-card via-card/80 to-transparent pb-2">
            <button type="button" onClick={verMas}
              className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
              {ocultas} {ocultas === 1 ? "fila más" : "filas más"} <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <PaginacionTabla t={t} />
    </div>
  );
}
