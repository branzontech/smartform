import { useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MenuFiltros } from "./MenuFiltros";
import { MenuOpciones, MenuOrden } from "./MenusOrdenOpciones";
import type { EstadoTabla } from "./useTablaDatos";

interface BarraTablaProps<T> {
  t: EstadoTabla<T>;
  /** [singular, plural] para el conteo: ["contrato", "contratos"]. */
  nombre: [string, string];
  placeholder?: string;
  /** Acciones sobre la selección (aparecen cuando hay filas marcadas). */
  accionesSeleccion?: ReactNode;
  /** Contenido al inicio de la barra (p. ej. selectores que definen qué se consulta). */
  inicio?: ReactNode;
  /** Nombre del CSV descargado (por defecto, el plural de `nombre`). */
  nombreArchivo?: string;
  /** Acción principal de la vista (p. ej. «Registrar movimiento»), al final de la barra. */
  acciones?: ReactNode;
}

function Buscador<T>({ t, placeholder }: { t: EstadoTabla<T>; placeholder: string }) {
  const [desplegado, setAbierto] = useState(false);
  // Con texto escrito el campo sigue visible aunque pierda el foco.
  const abierto = desplegado || !!t.busqueda;
  return (
    <div className="flex items-center">
      {abierto && (
        <Input
          autoFocus
          value={t.busqueda}
          aria-label={placeholder}
          onChange={(e) => t.setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") { t.setBusqueda(""); setAbierto(false); } }}
          onBlur={() => { if (!t.busqueda) setAbierto(false); }}
          placeholder={placeholder}
          className="mr-1 h-8 w-44 rounded-lg text-[13px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 [animation-duration:150ms] sm:w-60"
        />
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={abierto ? "Cerrar búsqueda" : "Buscar"}
        onClick={() => { if (abierto) t.setBusqueda(""); setAbierto((v) => !v); }}
        className={cn("h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground", abierto && "bg-muted text-foreground")}
      >
        {abierto ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/**
 * Barra de la tabla (va en la barra fija de SeccionHeader): segmentos con
 * conteo, total y chips de filtros activos a la izquierda; Filtrar, Ordenar,
 * Opciones y búsqueda desplegable a la derecha. Todo en una sola línea.
 */
export function BarraTabla<T>({ t, nombre, placeholder = "Buscar…", accionesSeleccion, inicio, acciones, nombreArchivo }: BarraTablaProps<T>) {
  const etiquetas = Object.fromEntries(t.filtros.map((f) => [f.id, f]));
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {inicio}
        {t.segmentos.length > 0 && (
          <div role="tablist" aria-label="Vistas" className="scroll-suave flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted/60 p-0.5">
            {t.segmentos.map((s) => {
              const activo = t.segmento === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => t.setSegmento(s.id)}
                  className={cn(
                    "flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] transition-[color,background-color,box-shadow] duration-200",
                    activo ? "bg-background font-medium text-foreground shadow-sm" : "hover:text-foreground",
                  )}
                >
                  {s.titulo}
                  <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", activo ? "bg-primary/10 text-primary" : "bg-background/70")}>
                    {t.conteoSegmentos[s.id]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {/* El total ya se ve en pestañas y segmentos: el conteo solo aparece cuando la búsqueda o los filtros lo cambian. */}
        {t.filtradas.length !== (t.segmentos.length ? t.conteoSegmentos[t.segmento] : t.total) && (
          <span className="pl-1 tabular-nums">
            {t.filtradas.length} {t.filtradas.length === 1 ? nombre[0] : nombre[1]}
          </span>
        )}
        {t.seleccion.size > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{t.seleccion.size} seleccionados</span>
            {accionesSeleccion}
          </span>
        )}
        {Object.entries(t.valoresFiltro).map(([id, valor]) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 [animation-duration:150ms]">
            <span className="text-muted-foreground">{etiquetas[id]?.titulo}:</span>
            {t.opcionesFiltro[id]?.find((o) => o.valor === valor)?.etiqueta ?? valor}
            <button type="button" aria-label={`Quitar filtro ${etiquetas[id]?.titulo ?? ""}`} onClick={() => t.setFiltro(id, "")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <MenuFiltros t={t} />
        <MenuOrden t={t} />
        <MenuOpciones t={t} nombreArchivo={nombreArchivo ?? nombre[1]} />
        <span className="mx-1 h-5 w-px bg-border" />
        <Buscador t={t} placeholder={placeholder} />
        {acciones && <><span className="mx-1 h-5 w-px bg-border" /><div className="flex items-center gap-1">{acciones}</div></>}
      </div>
    </div>
  );
}
