import { cn } from "@/lib/utils";

/*
 * Regla de las tablas: UNA celda, UN dato, en una sola línea. Nada de textos
 * secundarios debajo (documento bajo el nombre, «importado» bajo el número,
 * «vence en 24 d» bajo la fecha): cada dato va en su propia columna, y lo
 * accesorio se consulta en el detalle. Las urgencias se marcan con color,
 * no con texto extra.
 */

export type TonoEstado = "exito" | "aviso" | "error" | "info" | "neutro" | "primario";

const TONOS: Record<TonoEstado, string> = {
  exito: "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]",
  aviso: "bg-[hsl(var(--warning)/0.16)] text-[hsl(var(--warning))]",
  error: "bg-destructive/[0.12] text-destructive",
  info: "bg-[hsl(var(--info)/0.14)] text-[hsl(var(--info))]",
  neutro: "bg-muted/70 text-muted-foreground",
  primario: "bg-primary/[0.12] text-primary",
};

/**
 * Estado que llena toda la celda (usar con `sinPadding` en la columna): se lee
 * de un vistazo al recorrer la tabla, como en Inventario.
 */
export function CeldaEstado({ tono, texto }: { tono: TonoEstado; texto: string }) {
  return (
    <div className={cn("flex h-11 w-full items-center justify-center px-3 text-center text-[12.5px] font-semibold", TONOS[tono])}>
      <span className="transition-transform duration-300 ease-out motion-safe:group-hover/fila:scale-105">{texto}</span>
    </div>
  );
}
