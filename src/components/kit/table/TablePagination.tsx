import { ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TableState } from "./useDataTable";

function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 4) [2, 3, 4, 5].forEach((p) => set.add(p));
  if (current >= total - 3) [total - 4, total - 3, total - 2, total - 1].forEach((p) => set.add(p));
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => { if (i > 0 && p - sorted[i - 1] > 1) out.push("…"); out.push(p); });
  return out;
}

const circleClass =
  "flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TablePagination<T>({ t, pageSizes = [10, 25, 50, 100] }: { t: TableState<T>; pageSizes?: number[] }) {
  const n = t.filtered.length;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline">Filas por página</span>
          <Select value={String(t.pageSize)} onValueChange={(v) => t.setPageSize(Number(v))}>
            <SelectTrigger aria-label="Filas por página" className="h-7 w-[64px] rounded-lg px-2 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent align="start" className="min-w-[64px] rounded-xl">
              {pageSizes.map((x) => <SelectItem key={x} value={String(x)} className="text-xs">{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <span className="h-4 w-px bg-border" />
        <span className="tabular-nums">{n === 0 ? "Sin registros" : `${t.offset + 1}–${Math.min(t.offset + t.pageSize, n)} de ${n}`}</span>
      </div>
      {t.totalPages > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1">
          <button type="button" aria-label="Página anterior" disabled={t.page === 1} onClick={() => t.setPage(t.page - 1)}
            className={cn(circleClass, "text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40")}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          {pages(t.page, t.totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i < 3 ? "a" : "b"}`} className="flex h-8 w-6 items-center justify-center text-[13px] text-muted-foreground">…</span>
            ) : (
              <button key={p} type="button" aria-current={t.page === p ? "page" : undefined} onClick={() => t.setPage(p)}
                className={cn(circleClass, t.page === p ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {p}
              </button>
            ),
          )}
          <button type="button" aria-label="Página siguiente" disabled={t.page === t.totalPages} onClick={() => t.setPage(t.page + 1)}
            className={cn(circleClass, "text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40")}>
            <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
