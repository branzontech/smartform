import type { ReactNode } from "react";

/** Columna de una DataTable. */
export interface TableColumn<T> {
  id: string;
  title: string;
  /** Contenido de la celda. Si falta, se muestra `value`. */
  cell?: (row: T) => ReactNode;
  /** Valor plano para ordenar, buscar y exportar a CSV. */
  value?: (row: T) => string | number | null | undefined;
  /** Clases extra del <td>/<th> (ancho, alineación…). */
  className?: string;
  /** Texto principal de la fila: negrita y color de primer plano. */
  primary?: boolean;
  /** La celda ocupa todo el alto sin padding (p. ej. StatusCell). */
  flush?: boolean;
  /** Oculta por defecto (el usuario la puede mostrar en Opciones). */
  hidden?: boolean;
  /** No se puede ocultar. */
  alwaysVisible?: boolean;
  /** Sin orden por esta columna. */
  unsortable?: boolean;
}

/** Filtro de la ventana «Filtrar»: una lista de opciones sobre un valor de la fila. */
export interface TableFilter<T> {
  id: string;
  title: string;
  /** Uno o varios valores: con varios, la fila cumple si alguno coincide (p. ej. bodega origen o destino). */
  value: (row: T) => string | null | undefined | (string | null | undefined)[];
  /** Si falta, se toman los valores distintos de las filas. */
  options?: { value: string; label: string }[];
}

/** Atajo de filtro que se muestra como pestaña con su conteo (Activos, Por vencer…). */
export interface TableSegment<T> {
  id: string;
  title: string;
  match: (row: T) => boolean;
}

export type SortDirection = "asc" | "desc";
