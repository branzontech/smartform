import { ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EstadoTabla } from "./useTablaDatos";

function paginas(actual: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, actual - 1, actual, actual + 1]);
  if (actual <= 4) [2, 3, 4, 5].forEach((p) => set.add(p));
  if (actual >= total - 3) [total - 4, total - 3, total - 2, total - 1].forEach((p) => set.add(p));
  const orden = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  orden.forEach((p, i) => { if (i > 0 && p - orden[i - 1] > 1) out.push("…"); out.push(p); });
  return out;
}

const circulo =
  "flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PaginacionTabla<T>({ t, tamanos = [10, 25, 50, 100] }: { t: EstadoTabla<T>; tamanos?: number[] }) {
  const n = t.filtradas.length;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline">Filas por página</span>
          <Select value={String(t.porPagina)} onValueChange={(v) => t.setPorPagina(Number(v))}>
            <SelectTrigger aria-label="Filas por página" className="h-7 w-[64px] rounded-lg px-2 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent align="start" className="min-w-[64px] rounded-xl">
              {tamanos.map((x) => <SelectItem key={x} value={String(x)} className="text-xs">{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <span className="h-4 w-px bg-border" />
        <span className="tabular-nums">{n === 0 ? "Sin registros" : `${t.inicio + 1}–${Math.min(t.inicio + t.porPagina, n)} de ${n}`}</span>
      </div>
      {t.totalPaginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1">
          <button type="button" aria-label="Página anterior" disabled={t.pagina === 1} onClick={() => t.setPagina(t.pagina - 1)}
            className={cn(circulo, "text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40")}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          {paginas(t.pagina, t.totalPaginas).map((p, i) =>
            p === "…" ? (
              <span key={`salto-${i < 3 ? "a" : "b"}`} className="flex h-8 w-6 items-center justify-center text-[13px] text-muted-foreground">…</span>
            ) : (
              <button key={p} type="button" aria-current={t.pagina === p ? "page" : undefined} onClick={() => t.setPagina(p)}
                className={cn(circulo, t.pagina === p ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {p}
              </button>
            ),
          )}
          <button type="button" aria-label="Página siguiente" disabled={t.pagina === t.totalPaginas} onClick={() => t.setPagina(t.pagina + 1)}
            className={cn(circulo, "text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40")}>
            <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
