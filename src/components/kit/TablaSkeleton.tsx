import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de carga para tablas y listas. */
export function TablaSkeleton({ filas = 5, columnas = 5 }: { filas?: number; columnas?: number }) {
  return (
    <div className="divide-y divide-border/60" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, f) => (
        <div key={`fila-${f}`} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columnas }, (_, c) => (
            <Skeleton key={`celda-${f}-${c}`} className={c === 0 ? "h-4 w-24" : "h-4 flex-1"} />
          ))}
        </div>
      ))}
    </div>
  );
}
