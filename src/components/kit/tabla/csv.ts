import type { ColumnaTabla } from "./tipos";

const celda = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Descarga las filas con las columnas visibles (las que tienen `valor`). */
export function descargarCsv<T>(nombre: string, columnas: ColumnaTabla<T>[], filas: T[]) {
  const cols = columnas.filter((c) => c.valor);
  const lineas = [
    cols.map((c) => celda(c.titulo)).join(","),
    ...filas.map((r) => cols.map((c) => celda(c.valor!(r))).join(",")),
  ];
  // BOM para que Excel abra bien las tildes.
  const blob = new Blob(["\uFEFF" + lineas.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
