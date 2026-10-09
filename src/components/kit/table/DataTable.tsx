import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "../TableSkeleton";
import { TablePagination } from "./TablePagination";
import type { TableState } from "./useDataTable";
import { useHiddenRows } from "./useHiddenRows";

/* La columna de acciones siempre se ve y queda fija a la derecha al desplazar la tabla. */
const stickyRight = "sticky right-0 z-[2] border-l border-border/50 bg-card";

interface DataTableProps<T> {
  t: TableState<T>;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  /** Botones por fila: columna «Acciones» siempre visible y fija a la derecha. */
  actions?: (row: T) => ReactNode;
  selectable?: boolean;
  empty?: ReactNode;
  /** Clases extra del contenedor con scroll horizontal. */
  containerClassName?: string;
  /** Barra de la tabla (TableToolbar) dentro de la tarjeta, encima de las columnas. */
  toolbar?: ReactNode;
  /** Pie dentro de la tarjeta, bajo las filas (totales de reportes y libros). */
  footer?: ReactNode;
}

/**
 * Tabla estilo Inventario (equipo tracker): tarjeta redondeada, divisores
 * suaves entre columnas, títulos que ordenan y se arrastran para reordenar,
 * fila que se eleva (sin barra lateral de acento) y columna de acciones fija.
 */
export function DataTable<T>({ t, loading, onRowClick, actions, selectable, empty, containerClassName, toolbar, footer }: DataTableProps<T>) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const cols = t.columns.visible;
  const totalCols = cols.length + (selectable ? 1 : 0) + (actions ? 1 : 0);
  const { tableRef, hiddenRows, showMore } = useHiddenRows(`${t.page}|${t.pageSize}`, t.pageRows.length);
  const pageSelected = t.pageRows.length > 0 && t.pageRows.every((r) => t.selection.has(t.rowKey(r)));

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {toolbar && <div className="border-b border-border px-3 py-1.5">{toolbar}</div>}
        <Table
          ref={tableRef}
          containerClassName={cn("scroll-tabla", containerClassName)}
          className="[&_td:last-child]:border-r-0 [&_td]:border-r [&_td]:border-border/50 [&_th:last-child]:border-r-0 [&_th]:border-r [&_th]:border-border/50"
        >
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="h-10 w-11 px-0 text-center">
                  <Checkbox aria-label="Seleccionar página" checked={pageSelected} onCheckedChange={(v) => t.selectPage(v === true)} />
                </TableHead>
              )}
              {cols.map((c) => {
                const sortDir = t.sort?.column === c.id ? t.sort.dir : null;
                return (
                  <TableHead
                    key={c.id}
                    draggable
                    onDragStart={() => setDragged(c.id)}
                    onDragEnd={() => { setDragged(null); setDropTarget(null); }}
                    onDragOver={(e) => { e.preventDefault(); if (dragged && dragged !== c.id) setDropTarget(c.id); }}
                    onDragLeave={() => setDropTarget((d) => (d === c.id ? null : d))}
                    onDrop={(e) => { e.preventDefault(); if (dragged) t.columns.move(dragged, c.id); setDragged(null); setDropTarget(null); }}
                    aria-sort={sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : undefined}
                    className={cn(
                      "group/th h-10 cursor-grab select-none whitespace-nowrap px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted",
                      dragged === c.id && "opacity-50",
                      dropTarget === c.id && "bg-primary/10",
                      c.flush && "min-w-[7.5rem] text-center",
                      c.className,
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <GripVertical aria-hidden className="-ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover/th:opacity-100" />
                      {c.value && !c.unsortable ? (
                        <button type="button" onClick={() => t.toggleSort(c.id)} className="flex items-center gap-1 hover:text-foreground">
                          {c.title}
                          {sortDir === "asc" && <ArrowUp className="h-3.5 w-3.5" />}
                          {sortDir === "desc" && <ArrowDown className="h-3.5 w-3.5" />}
                        </button>
                      ) : c.title}
                    </div>
                  </TableHead>
                );
              })}
              {actions && <TableHead className={cn(stickyRight, "h-10 w-px px-3 text-[12px] font-medium text-muted-foreground shadow-[inset_0_0_0_999px_hsl(var(--muted)/0.4),-8px_0_10px_-8px_hsl(var(--foreground)/0.15)]")}>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && t.total === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={totalCols} className="p-0">
                {/* Aparece a los 200 ms: si los datos llegan antes, no hay parpadeo de esqueleto. */}
                <div className="animate-in fade-in [animation-delay:200ms] [animation-duration:200ms] [animation-fill-mode:both]">
                  <TableSkeleton columns={Math.min(cols.length, 6)} />
                </div>
              </TableCell></TableRow>
            )}
            {!loading && t.pageRows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={totalCols} className="h-32 text-center text-sm text-muted-foreground">
                  {t.total === 0 ? empty ?? "Sin registros." : t.search || t.activeFilterCount > 0 ? "Ningún registro coincide con la búsqueda o los filtros." : `No hay registros en «${t.segments.find((s) => s.id === t.segment)?.title ?? "esta vista"}».`}
                </TableCell>
              </TableRow>
            )}
            {t.pageRows.map((row) => {
              const key = t.rowKey(row);
              const selected = t.selection.has(key);
              return (
                <TableRow
                  key={key}
                  data-state={selected ? "selected" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === "Enter") onRowClick(row); } : undefined}
                  className={cn(
                    "group/row relative h-11 border-b border-border/60 transition-[background-color,box-shadow,transform] duration-300 ease-out",
                    "hover:z-[1] hover:bg-muted/40 hover:shadow-[0_10px_24px_-16px_hsl(var(--foreground)/0.35)] motion-safe:hover:-translate-y-px",
                    "focus-visible:bg-muted/40 focus-visible:outline-none data-[state=selected]:bg-primary/5",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {selectable && (
                    <TableCell className="relative w-11 p-0 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label="Seleccionar fila" checked={selected} onCheckedChange={() => t.toggleSelection(key)} />
                    </TableCell>
                  )}
                  {cols.map((c) => (
                    <TableCell
                      key={c.id}
                      className={cn(
                        "relative h-11 whitespace-nowrap text-[13px]",
                        c.flush ? "min-w-[7.5rem] p-0" : "px-3 py-0",
                        c.primary ? "font-medium text-foreground" : "text-muted-foreground",
                        c.className,
                      )}
                    >
                      {c.flush ? (c.cell?.(row) ?? c.value?.(row)) : (
                        <div className="transition-transform duration-300 ease-out motion-safe:group-hover/row:translate-x-0.5">
                          {c.cell ? c.cell(row) : (c.value?.(row) ?? <span className="text-muted-foreground/50">—</span>)}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell
                      className={cn(
                        stickyRight,
                        "px-2 py-0 shadow-[-8px_0_10px_-8px_hsl(var(--foreground)/0.15)] transition-shadow duration-300",
                        "group-hover/row:shadow-[inset_0_0_0_999px_hsl(var(--muted)/0.4),-8px_0_10px_-8px_hsl(var(--foreground)/0.15)]",
                        selected && "shadow-[inset_0_0_0_999px_hsl(var(--primary)/0.05),-8px_0_10px_-8px_hsl(var(--foreground)/0.15)]",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-0.5">{actions(row)}</div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {footer && <div className="border-t border-border bg-muted/30 px-3 py-2 text-[13px] tabular-nums text-muted-foreground">{footer}</div>}
        {/* Hay filas debajo del área visible: se dice cuántas y se llega a ellas con un clic. */}
        {hiddenRows > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-center bg-gradient-to-t from-card via-card/80 to-transparent pb-2">
            <button type="button" onClick={showMore}
              className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
              {hiddenRows} {hiddenRows === 1 ? "fila más" : "filas más"} <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <TablePagination t={t} />
    </div>
  );
}
