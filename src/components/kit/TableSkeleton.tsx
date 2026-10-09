import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de carga para tablas y listas. */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-border/60" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }, (_, r) => (
        <div key={`row-${r}`} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={`cell-${r}-${c}`} className={c === 0 ? "h-4 w-24" : "h-4 flex-1"} />
          ))}
        </div>
      ))}
    </div>
  );
}
