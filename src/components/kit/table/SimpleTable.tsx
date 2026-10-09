import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface SimpleColumn<T> {
  id: string;
  title: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** Clases del <th>/<td> (ancho, alineación…). */
  className?: string;
  /** Texto principal: negrita y color de primer plano. */
  primary?: boolean;
}

interface SimpleTableProps<T> {
  columns: SimpleColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Texto o acción cuando no hay filas. */
  empty?: ReactNode;
  /** Totales u otra información bajo las filas. */
  footer?: ReactNode;
  /** Barra encima de las columnas (p. ej. botón «Agregar ítem»). */
  toolbar?: ReactNode;
  className?: string;
}

/**
 * Tabla de ítems o de detalle con el mismo aspecto que DataTable (tarjeta,
 * divisores suaves, filas de 44 px), pero sin búsqueda, filtros ni paginación:
 * para líneas de una factura, cotización u orden, o comparativos pequeños.
 * Los listados que se consultan usan DataTable.
 */
export function SimpleTable<T>({ columns, rows, rowKey, empty = "Sin registros.", footer, toolbar, className }: SimpleTableProps<T>) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      {toolbar && <div className="border-b border-border px-3 py-1.5">{toolbar}</div>}
      <Table
        containerClassName="scroll-tabla"
        className="[&_td:last-child]:border-r-0 [&_td]:border-r [&_td]:border-border/50 [&_th:last-child]:border-r-0 [&_th]:border-r [&_th]:border-border/50"
      >
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.id} className={cn("h-10 whitespace-nowrap px-3 text-[12px] font-medium text-muted-foreground", c.className)}>
                {c.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">{empty}</TableCell>
            </TableRow>
          )}
          {rows.map((row, i) => (
            <TableRow key={rowKey(row, i)} className="h-11 border-b border-border/60 hover:bg-muted/40">
              {columns.map((c) => (
                <TableCell
                  key={c.id}
                  className={cn("px-3 py-1.5 text-[13px]", c.primary ? "font-medium text-foreground" : "text-muted-foreground", c.className)}
                >
                  {c.cell(row, i)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {footer && <div className="border-t border-border bg-muted/30 px-3 py-2 text-[13px] tabular-nums text-muted-foreground">{footer}</div>}
    </div>
  );
}
