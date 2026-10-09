import { useCallback, useMemo, useState } from "react";
import type { TableColumn, SortDirection, TableFilter, TableSegment } from "./types";
import { usePersistedColumns } from "./usePersistedColumns";
import { usePersistentState } from "./usePersistentState";
import { useUrlParam } from "./useUrlParam";

interface UseDataTableOptions<T> {
  /** Identificador estable: guarda orden y visibilidad de columnas. */
  id: string;
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string;
  filters?: TableFilter<T>[];
  segments?: TableSegment<T>[];
  initialSegment?: string;
  initialPageSize?: number;
  /** Recordar la búsqueda entre visitas. En vistas con texto clínico va en false: no queda en el navegador. */
  persistSearch?: boolean;
}

type SortState = { column: string; dir: SortDirection } | null;

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const isString = (v: unknown): v is string => typeof v === "string";
const isPositiveNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;
const isStringMap = (v: unknown): v is Record<string, string> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.values(v).every((x) => typeof x === "string");
const isSortState = (v: unknown): v is SortState =>
  v === null || (typeof v === "object" && typeof (v as { column?: unknown }).column === "string" && ["asc", "desc"].includes((v as { dir?: string }).dir ?? ""));
/** Valores de un filtro sobre una fila (uno o varios), como texto y sin vacíos. */
const valuesOf = (v: unknown) => (Array.isArray(v) ? v : [v]).map(text).filter(Boolean);
const NO_FILTERS: TableFilter<never>[] = [];
const NO_SEGMENTS: TableSegment<never>[] = [];
const COLLATOR = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/**
 * Estado de una tabla estilo Inventario (equipo tracker): búsqueda, filtros
 * en ventana, segmentos con conteo, orden, paginación, columnas y selección.
 * Se comparte entre <TableToolbar> (barra de la tabla) y <DataTable> (cuerpo).
 */
export function useDataTable<T>({ id, rows, columns, rowKey, filters = NO_FILTERS as TableFilter<T>[], segments = NO_SEGMENTS as TableSegment<T>[], initialSegment, initialPageSize = 25, persistSearch = true }: UseDataTableOptions<T>) {
  const tableColumns = usePersistedColumns(id, columns);
  // La vista (búsqueda, filtros, pestaña, orden, página) se recuerda por tabla:
  // al volver, el usuario encuentra su traza tal como la dejó.
  const [savedSearch, setSavedSearch] = usePersistentState(`${id}.search`, "", isString);
  const [sessionSearch, setSessionSearch] = useState("");
  const search = persistSearch ? savedSearch : sessionSearch;
  const setSearchRaw = persistSearch ? setSavedSearch : setSessionSearch;
  const [savedFilters, setFilterValues] = usePersistentState<Record<string, string>>(`${id}.filters`, {}, isStringMap);
  const defaultSegment = initialSegment ?? segments[0]?.id ?? "";
  const [savedSegment, setSegmentRaw] = usePersistentState(`${id}.segment`, defaultSegment, isString);
  const [sort, setSort] = usePersistentState<SortState>(`${id}.sort`, null, isSortState);
  const [page, setPage] = usePersistentState(`${id}.page`, 1, isPositiveNumber);
  const [pageSize, setPageSizeRaw] = usePersistentState(`${id}.pageSize`, initialPageSize, isPositiveNumber);
  const [selection, setSelection] = useState<Set<string>>(new Set());

  // Lo guardado puede venir de una versión anterior de la tabla: solo cuenta lo que aún existe.
  const segment = segments.some((s) => s.id === savedSegment) ? savedSegment : defaultSegment;
  const filterValues = useMemo(() => {
    const ids = new Set(filters.map((f) => f.id));
    return Object.fromEntries(Object.entries(savedFilters).filter(([k]) => ids.has(k)));
  }, [savedFilters, filters]);

  const setSearch = useCallback((v: string) => { setSearchRaw(v); setPage(1); }, [setSearchRaw, setPage]);
  const setSegment = useCallback((v: string) => { setSegmentRaw(v); setPage(1); }, [setSegmentRaw, setPage]);
  const setPageSize = useCallback((v: number) => { setPageSizeRaw(v); setPage(1); }, [setPageSizeRaw, setPage]);
  const setFilter = useCallback((filterId: string, v: string) => {
    setFilterValues((f) => { const next = { ...f }; if (v) next[filterId] = v; else delete next[filterId]; return next; });
    setPage(1);
  }, [setFilterValues, setPage]);
  const clearFilters = useCallback(() => { setFilterValues({}); setPage(1); }, [setFilterValues, setPage]);

  // Llegada con ?segment= (desde el dashboard): esa pestaña, sin búsqueda ni
  // filtros previos, para ver exactamente lo que contó el indicador.
  useUrlParam("segment", segments.map((s) => s.id), (v) => {
    setSegment(v);
    setSearchRaw("");
    setFilterValues({});
  });

  const toggleSort = useCallback((column: string) => {
    setSort((o) => (o?.column === column ? (o.dir === "asc" ? { column, dir: "desc" } : null) : { column, dir: "asc" }));
  }, [setSort]);

  const segmentCounts = useMemo(
    () => Object.fromEntries(segments.map((s) => [s.id, rows.filter(s.match).length])) as Record<string, number>,
    [segments, rows],
  );

  const filterOptions = useMemo(() => Object.fromEntries(filters.map((f) => [
    f.id,
    f.options ?? [...new Set(rows.flatMap((r) => valuesOf(f.value(r))))].sort(COLLATOR.compare).map((v) => ({ value: v, label: v })),
  ])), [filters, rows]);

  const filteredRows = useMemo(() => {
    const activeSegment = segments.find((s) => s.id === segment);
    const q = search.trim().toLowerCase();
    const activeFilters = filters.filter((f) => filterValues[f.id]);
    return rows.filter((r) => {
      if (activeSegment && !activeSegment.match(r)) return false;
      if (activeFilters.some((f) => !valuesOf(f.value(r)).includes(filterValues[f.id]))) return false;
      if (!q) return true;
      return columns.some((c) => c.value && text(c.value(r)).toLowerCase().includes(q));
    });
  }, [rows, segments, segment, search, filters, filterValues, columns]);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.id === sort.column);
    if (!col?.value) return filteredRows;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const va = col.value!(a);
      const vb = col.value!(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
      return COLLATOR.compare(text(va), text(vb)) * sign;
    });
  }, [filteredRows, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const pageRows = useMemo(() => sorted.slice(offset, offset + pageSize), [sorted, offset, pageSize]);

  const toggleSelection = useCallback((key: string) => {
    setSelection((s) => { const next = new Set(s); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }, []);
  const selectPage = useCallback((checked: boolean) => {
    setSelection((s) => { const next = new Set(s); pageRows.forEach((r) => (checked ? next.add(rowKey(r)) : next.delete(rowKey(r)))); return next; });
  }, [pageRows, rowKey]);

  return {
    columns: tableColumns, filters, segments, rowKey,
    search, setSearch,
    filterValues, setFilter, clearFilters, filterOptions, activeFilterCount: Object.keys(filterValues).length,
    segment, setSegment, segmentCounts,
    sort, toggleSort, clearSort: () => setSort(null),
    page: currentPage, setPage, pageSize, setPageSize, totalPages, offset,
    total: rows.length, filtered: sorted, pageRows,
    selection, toggleSelection, selectPage, clearSelection: () => setSelection(new Set()),
  };
}

export type TableState<T> = ReturnType<typeof useDataTable<T>>;
