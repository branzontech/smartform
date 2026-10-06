import { useCallback, useMemo, useState } from "react";
import type { ColumnaTabla, DireccionOrden, FiltroTabla, SegmentoTabla } from "./tipos";
import { useColumnasPersistidas } from "./useColumnasPersistidas";
import { useEstadoPersistente } from "./useEstadoPersistente";
import { useParametroUrl } from "./useParametroUrl";

interface Opciones<T> {
  /** Identificador estable: guarda orden y visibilidad de columnas. */
  id: string;
  filas: T[];
  columnas: ColumnaTabla<T>[];
  claveFila: (fila: T) => string;
  filtros?: FiltroTabla<T>[];
  segmentos?: SegmentoTabla<T>[];
  segmentoInicial?: string;
  porPaginaInicial?: number;
}

const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const esTexto = (v: unknown): v is string => typeof v === "string";
const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;
const esMapa = (v: unknown): v is Record<string, string> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.values(v).every((x) => typeof x === "string");
const esOrden = (v: unknown): v is { columna: string; dir: DireccionOrden } | null =>
  v === null || (typeof v === "object" && typeof (v as { columna?: unknown }).columna === "string" && ["asc", "desc"].includes((v as { dir?: string }).dir ?? ""));
/** Valores de un filtro sobre una fila (uno o varios), como texto y sin vacíos. */
const valoresDe = (v: unknown) => (Array.isArray(v) ? v : [v]).map(texto).filter(Boolean);
const SIN_FILTROS: FiltroTabla<never>[] = [];
const SIN_SEGMENTOS: SegmentoTabla<never>[] = [];
const COMPARAR = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/**
 * Estado de una tabla estilo Inventario (equipo tracker): búsqueda, filtros
 * en ventana, segmentos con conteo, orden, paginación, columnas y selección.
 * Se comparte entre <BarraTabla> (en la barra fija del encabezado) y
 * <TablaDatos> (en el cuerpo).
 */
export function useTablaDatos<T>({ id, filas, columnas, claveFila, filtros = SIN_FILTROS as FiltroTabla<T>[], segmentos = SIN_SEGMENTOS as SegmentoTabla<T>[], segmentoInicial, porPaginaInicial = 25 }: Opciones<T>) {
  const cols = useColumnasPersistidas(id, columnas);
  // La vista (búsqueda, filtros, pestaña, orden, página) se recuerda por tabla:
  // al volver, el usuario encuentra su traza tal como la dejó.
  const [busqueda, setBusquedaBase] = useEstadoPersistente(`${id}.busqueda`, "", esTexto);
  const [filtrosGuardados, setValoresFiltro] = useEstadoPersistente<Record<string, string>>(`${id}.filtros`, {}, esMapa);
  const segmentoPorDefecto = segmentoInicial ?? segmentos[0]?.id ?? "";
  const [segmentoGuardado, setSegmentoBase] = useEstadoPersistente(`${id}.segmento`, segmentoPorDefecto, esTexto);
  const [orden, setOrden] = useEstadoPersistente<{ columna: string; dir: DireccionOrden } | null>(`${id}.orden`, null, esOrden);
  const [pagina, setPagina] = useEstadoPersistente(`${id}.pagina`, 1, esNumero);
  const [porPagina, setPorPaginaBase] = useEstadoPersistente(`${id}.porPagina`, porPaginaInicial, esNumero);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());

  // Lo guardado puede venir de una versión anterior de la tabla: solo cuenta lo que aún existe.
  const segmento = segmentos.some((s) => s.id === segmentoGuardado) ? segmentoGuardado : segmentoPorDefecto;
  const valoresFiltro = useMemo(() => {
    const ids = new Set(filtros.map((f) => f.id));
    return Object.fromEntries(Object.entries(filtrosGuardados).filter(([k]) => ids.has(k)));
  }, [filtrosGuardados, filtros]);

  const setBusqueda = useCallback((v: string) => { setBusquedaBase(v); setPagina(1); }, [setBusquedaBase, setPagina]);
  const setSegmento = useCallback((v: string) => { setSegmentoBase(v); setPagina(1); }, [setSegmentoBase, setPagina]);
  const setPorPagina = useCallback((v: number) => { setPorPaginaBase(v); setPagina(1); }, [setPorPaginaBase, setPagina]);
  const setFiltro = useCallback((fid: string, v: string) => {
    setValoresFiltro((f) => { const n = { ...f }; if (v) n[fid] = v; else delete n[fid]; return n; });
    setPagina(1);
  }, [setValoresFiltro, setPagina]);
  const limpiarFiltros = useCallback(() => { setValoresFiltro({}); setPagina(1); }, [setValoresFiltro, setPagina]);

  // Llegada con ?segmento= (desde el dashboard): esa pestaña, sin búsqueda ni
  // filtros previos, para ver exactamente lo que contó el indicador.
  useParametroUrl("segmento", segmentos.map((s) => s.id), (v) => {
    setSegmento(v);
    setBusquedaBase("");
    setValoresFiltro({});
  });

  const alternarOrden = useCallback((columna: string) => {
    setOrden((o) => (o?.columna === columna ? (o.dir === "asc" ? { columna, dir: "desc" } : null) : { columna, dir: "asc" }));
  }, [setOrden]);

  const conteoSegmentos = useMemo(
    () => Object.fromEntries(segmentos.map((s) => [s.id, filas.filter(s.cumple).length])) as Record<string, number>,
    [segmentos, filas],
  );

  const opcionesFiltro = useMemo(() => Object.fromEntries(filtros.map((f) => [
    f.id,
    f.opciones ?? [...new Set(filas.flatMap((r) => valoresDe(f.valor(r))))].sort(COMPARAR.compare).map((v) => ({ valor: v, etiqueta: v })),
  ])), [filtros, filas]);

  const filtradas = useMemo(() => {
    const seg = segmentos.find((s) => s.id === segmento);
    const q = busqueda.trim().toLowerCase();
    const activos = filtros.filter((f) => valoresFiltro[f.id]);
    return filas.filter((r) => {
      if (seg && !seg.cumple(r)) return false;
      if (activos.some((f) => !valoresDe(f.valor(r)).includes(valoresFiltro[f.id]))) return false;
      if (!q) return true;
      return columnas.some((c) => c.valor && texto(c.valor(r)).toLowerCase().includes(q));
    });
  }, [filas, segmentos, segmento, busqueda, filtros, valoresFiltro, columnas]);

  const ordenadas = useMemo(() => {
    const col = orden && columnas.find((c) => c.id === orden.columna);
    if (!col?.valor) return filtradas;
    const signo = orden.dir === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      const va = col.valor!(a);
      const vb = col.valor!(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * signo;
      return COMPARAR.compare(texto(va), texto(vb)) * signo;
    });
  }, [filtradas, orden, columnas]);

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const visibles = useMemo(() => ordenadas.slice(inicio, inicio + porPagina), [ordenadas, inicio, porPagina]);

  const alternarSeleccion = useCallback((clave: string) => {
    setSeleccion((s) => { const n = new Set(s); if (n.has(clave)) n.delete(clave); else n.add(clave); return n; });
  }, []);
  const seleccionarPagina = useCallback((marcar: boolean) => {
    setSeleccion((s) => { const n = new Set(s); visibles.forEach((r) => (marcar ? n.add(claveFila(r)) : n.delete(claveFila(r)))); return n; });
  }, [visibles, claveFila]);

  return {
    columnas: cols, filtros, segmentos, claveFila,
    busqueda, setBusqueda,
    valoresFiltro, setFiltro, limpiarFiltros, opcionesFiltro, filtrosActivos: Object.keys(valoresFiltro).length,
    segmento, setSegmento, conteoSegmentos,
    orden, alternarOrden, quitarOrden: () => setOrden(null),
    pagina: paginaActual, setPagina, porPagina, setPorPagina, totalPaginas, inicio,
    total: filas.length, filtradas: ordenadas, visibles,
    seleccion, alternarSeleccion, seleccionarPagina, limpiarSeleccion: () => setSeleccion(new Set()),
  };
}

export type EstadoTabla<T> = ReturnType<typeof useTablaDatos<T>>;
