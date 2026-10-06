import type { ReactNode } from "react";

/** Columna de una TablaDatos. */
export interface ColumnaTabla<T> {
  id: string;
  titulo: string;
  /** Contenido de la celda. Si falta, se muestra `valor`. */
  celda?: (fila: T) => ReactNode;
  /** Valor plano para ordenar, buscar y exportar a CSV. */
  valor?: (fila: T) => string | number | null | undefined;
  /** Clases extra del <td>/<th> (ancho, alineación…). */
  className?: string;
  /** Texto principal de la fila: negrita y color de primer plano. */
  principal?: boolean;
  /** La celda ocupa todo el alto sin padding (p. ej. CeldaEstado). */
  sinPadding?: boolean;
  /** Oculta por defecto (el usuario la puede mostrar en Opciones). */
  oculta?: boolean;
  /** No se puede ocultar. */
  fija?: boolean;
  /** Sin orden por esta columna. */
  sinOrden?: boolean;
}

/** Filtro de la ventana «Filtrar»: una lista de opciones sobre un valor de la fila. */
export interface FiltroTabla<T> {
  id: string;
  titulo: string;
  /** Uno o varios valores: con varios, la fila cumple si alguno coincide (p. ej. bodega origen o destino). */
  valor: (fila: T) => string | null | undefined | (string | null | undefined)[];
  /** Si falta, se toman los valores distintos de las filas. */
  opciones?: { valor: string; etiqueta: string }[];
}

/** Atajo de filtro que se muestra como pestaña con su conteo (Activos, Por vencer…). */
export interface SegmentoTabla<T> {
  id: string;
  titulo: string;
  cumple: (fila: T) => boolean;
}

export type DireccionOrden = "asc" | "desc";
