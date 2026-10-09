import { useCallback, useEffect, useMemo, useState } from "react";
import type { TableColumn } from "./types";

interface ColumnState {
  order: string[];
  hidden: string[];
  /** Columnas que existían al guardar: si la tabla cambia, lo guardado se descarta. */
  signature?: string;
}

const storageKey = (id: string) => `kerhub.table.${id}.columns`;

function read(id: string, signature: string): ColumnState | null {
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    const saved = raw ? (JSON.parse(raw) as ColumnState) : null;
    return saved?.signature === signature ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Orden y visibilidad de las columnas, recordados por usuario en este
 * navegador (comodidad, no dato de negocio).
 */
export function usePersistedColumns<T>(tableId: string, columns: TableColumn<T>[]) {
  const signature = columns.map((c) => `${c.id}${c.hidden ? "-" : ""}`).join(",");
  const [state, setState] = useState<ColumnState>(() => {
    const saved = read(tableId, signature);
    return saved ?? { signature, order: columns.map((c) => c.id), hidden: columns.filter((c) => c.hidden).map((c) => c.id) };
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(tableId), JSON.stringify(state));
    } catch {
      /* almacenamiento no disponible: se usa el estado en memoria */
    }
  }, [tableId, state]);

  const ordered = useMemo(() => {
    const ids = new Set(columns.map((c) => c.id));
    const order = state.order.filter((id) => ids.has(id));
    // Columnas nuevas (p. ej. una por bodega) entran justo después de su vecina
    // natural ya ubicada, no al final: así no se descompone lo que el usuario ordenó.
    columns.forEach((c, i) => {
      if (order.includes(c.id)) return;
      const previous = columns.slice(0, i).reverse().find((p) => order.includes(p.id));
      order.splice(previous ? order.indexOf(previous.id) + 1 : 0, 0, c.id);
    });
    const byId = new Map(columns.map((c) => [c.id, c]));
    return order.flatMap((id) => byId.get(id) ?? []);
  }, [columns, state.order]);

  const visible = useMemo(() => {
    const hidden = new Set(state.hidden);
    return ordered.filter((c) => c.alwaysVisible || !hidden.has(c.id));
  }, [ordered, state.hidden]);

  const toggle = useCallback((id: string) => {
    setState((s) => ({ ...s, hidden: s.hidden.includes(id) ? s.hidden.filter((x) => x !== id) : [...s.hidden, id] }));
  }, []);

  const move = useCallback((from: string, to: string) => {
    if (from === to) return;
    setState((s) => {
      const order = ordered.map((c) => c.id);
      const i = order.indexOf(from);
      const j = order.indexOf(to);
      if (i < 0 || j < 0) return s;
      order.splice(j, 0, order.splice(i, 1)[0]);
      return { ...s, order };
    });
  }, [ordered]);

  const isVisible = useCallback((id: string) => !state.hidden.includes(id), [state.hidden]);

  return { ordered, visible, toggle, move, isVisible };
}
