import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnaTabla } from "./tipos";

interface EstadoColumnas {
  orden: string[];
  ocultas: string[];
  /** Columnas que existían al guardar: si la tabla cambia, lo guardado se descarta. */
  firma?: string;
}

const clave = (id: string) => `magnet.tabla.${id}.columnas`;

function leer(id: string, firma: string): EstadoColumnas | null {
  try {
    const raw = window.localStorage.getItem(clave(id));
    const guardado = raw ? (JSON.parse(raw) as EstadoColumnas) : null;
    return guardado?.firma === firma ? guardado : null;
  } catch {
    return null;
  }
}

/**
 * Orden y visibilidad de las columnas, recordados por usuario en este
 * navegador (comodidad, no dato de negocio).
 */
export function useColumnasPersistidas<T>(idTabla: string, columnas: ColumnaTabla<T>[]) {
  const firma = columnas.map((c) => `${c.id}${c.oculta ? "-" : ""}`).join(",");
  const [estado, setEstado] = useState<EstadoColumnas>(() => {
    const guardado = leer(idTabla, firma);
    return guardado ?? { firma, orden: columnas.map((c) => c.id), ocultas: columnas.filter((c) => c.oculta).map((c) => c.id) };
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(clave(idTabla), JSON.stringify(estado));
    } catch {
      /* almacenamiento no disponible: se usa el estado en memoria */
    }
  }, [idTabla, estado]);

  const ordenadas = useMemo(() => {
    const ids = new Set(columnas.map((c) => c.id));
    const orden = estado.orden.filter((id) => ids.has(id));
    // Columnas nuevas (p. ej. una por bodega) entran justo después de su vecina
    // natural ya ubicada, no al final: así no se descompone lo que el usuario ordenó.
    columnas.forEach((c, i) => {
      if (orden.includes(c.id)) return;
      const previa = columnas.slice(0, i).reverse().find((p) => orden.includes(p.id));
      orden.splice(previa ? orden.indexOf(previa.id) + 1 : 0, 0, c.id);
    });
    const porId = new Map(columnas.map((c) => [c.id, c]));
    return orden.flatMap((id) => porId.get(id) ?? []);
  }, [columnas, estado.orden]);

  const visibles = useMemo(() => {
    const ocultas = new Set(estado.ocultas);
    return ordenadas.filter((c) => c.fija || !ocultas.has(c.id));
  }, [ordenadas, estado.ocultas]);

  const alternar = useCallback((id: string) => {
    setEstado((e) => ({ ...e, ocultas: e.ocultas.includes(id) ? e.ocultas.filter((x) => x !== id) : [...e.ocultas, id] }));
  }, []);

  const mover = useCallback((desde: string, hasta: string) => {
    if (desde === hasta) return;
    setEstado((e) => {
      const orden = ordenadas.map((c) => c.id);
      const i = orden.indexOf(desde);
      const j = orden.indexOf(hasta);
      if (i < 0 || j < 0) return e;
      orden.splice(j, 0, orden.splice(i, 1)[0]);
      return { ...e, orden };
    });
  }, [ordenadas]);

  const esVisible = useCallback((id: string) => !estado.ocultas.includes(id), [estado.ocultas]);

  return { ordenadas, visibles, alternar, mover, esVisible };
}
