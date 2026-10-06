import { cn } from "@/lib/utils";
import type { Invoice } from "@/types/billing-types";
import { ESTADO_FACTURA, TONO_TEXTO, formatoMoneda } from "./facturas";

interface ListaCompactaFacturasProps {
  facturas: Invoice[];
  onVer: (f: Invoice) => void;
  vacio?: string;
}

/**
 * Lista breve para las tarjetas del resumen de facturación (no es una vista
 * de consulta: esa es la tabla de la pestaña). El estado va solo como texto
 * de color, sin punto ni píldora.
 */
export function ListaCompactaFacturas({ facturas, onVer, vacio = "Sin facturas." }: ListaCompactaFacturasProps) {
  if (facturas.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{vacio}</p>;
  return (
    <ul className="divide-y divide-border/60">
      {facturas.map((f) => {
        const estado = ESTADO_FACTURA[f.status];
        return (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onVer(f)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-[13px] transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{f.invoiceNumber}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{f.patientName}</span>
              <span className="tabular-nums text-foreground">{formatoMoneda(f.total)}</span>
              <span className={cn("w-20 text-right text-[12.5px] font-semibold", TONO_TEXTO[estado.tono])}>{estado.texto}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
