import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface ColumnaSimple<T> {
  id: string;
  titulo: ReactNode;
  celda: (fila: T, indice: number) => ReactNode;
  /** Clases del <th>/<td> (ancho, alineación…). */
  className?: string;
  /** Texto principal: negrita y color de primer plano. */
  principal?: boolean;
}

interface TablaSimpleProps<T> {
  columnas: ColumnaSimple<T>[];
  filas: T[];
  claveFila: (fila: T, indice: number) => string;
  /** Texto o acción cuando no hay filas. */
  vacio?: ReactNode;
  /** Totales u otra información bajo las filas. */
  pie?: ReactNode;
  /** Barra encima de las columnas (p. ej. botón «Agregar ítem»). */
  barra?: ReactNode;
  className?: string;
}

/**
 * Tabla de ítems o de detalle con el mismo aspecto que TablaDatos (tarjeta,
 * divisores suaves, filas de 44 px), pero sin búsqueda, filtros ni paginación:
 * para líneas de una factura, cotización u orden, o comparativos pequeños.
 * Los listados que se consultan usan TablaDatos.
 */
export function TablaSimple<T>({ columnas, filas, claveFila, vacio = "Sin registros.", pie, barra, className }: TablaSimpleProps<T>) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      {barra && <div className="border-b border-border px-3 py-1.5">{barra}</div>}
      <Table
        contenedorClassName="scroll-tabla"
        className="[&_td:last-child]:border-r-0 [&_td]:border-r [&_td]:border-border/50 [&_th:last-child]:border-r-0 [&_th]:border-r [&_th]:border-border/50"
      >
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {columnas.map((c) => (
              <TableHead key={c.id} className={cn("h-10 whitespace-nowrap px-3 text-[12px] font-medium text-muted-foreground", c.className)}>
                {c.titulo}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columnas.length} className="h-24 text-center text-sm text-muted-foreground">{vacio}</TableCell>
            </TableRow>
          )}
          {filas.map((fila, i) => (
            <TableRow key={claveFila(fila, i)} className="h-11 border-b border-border/60 hover:bg-muted/40">
              {columnas.map((c) => (
                <TableCell
                  key={c.id}
                  className={cn("px-3 py-1.5 text-[13px]", c.principal ? "font-medium text-foreground" : "text-muted-foreground", c.className)}
                >
                  {c.celda(fila, i)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pie && <div className="border-t border-border bg-muted/30 px-3 py-2 text-[13px] tabular-nums text-muted-foreground">{pie}</div>}
    </div>
  );
}
