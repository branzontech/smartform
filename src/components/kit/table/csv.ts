import type { TableColumn } from "./types";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Descarga las filas con las columnas visibles (las que tienen `value`). */
export function downloadCsv<T>(name: string, columns: TableColumn<T>[], rows: T[]) {
  const cols = columns.filter((c) => c.value);
  const lines = [
    cols.map((c) => cell(c.title)).join(","),
    ...rows.map((r) => cols.map((c) => cell(c.value!(r))).join(",")),
  ];
  // BOM para que Excel abra bien las tildes.
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
