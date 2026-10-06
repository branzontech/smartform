import { ChevronDown, Pin, PinOff } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEstadoPersistente } from "../tabla/useEstadoPersistente";

export interface PestanaCarpeta<K extends string> {
  id: K;
  titulo: string;
  /** Siempre visible: no se puede desfijar. */
  fija?: boolean;
  /** Descarga el chunk de la pestaña al pasar el mouse (antes del clic). */
  prefetch?: () => void;
}

interface PestanasCarpetaProps<K extends string> {
  /** Clave estable: guarda en este navegador las pestañas que el usuario fijó. */
  id: string;
  pestanas: PestanaCarpeta<K>[];
  activa: K;
  // NoInfer: K sale de `pestanas`; así se puede pasar un setState directo sin genéricos en JSX (rompen el tagger de Lovable).
  onCambio: (id: NoInfer<K>) => void;
  /** Pestañas visibles por defecto; el resto va en «Más». */
  visiblesIniciales: K[];
  etiqueta: string;
}

/*
 * Pestaña de carpeta: dos mitades inclinadas en sentidos opuestos (lados en
 * diagonal con la misma pendiente sin importar el ancho, esquinas superiores
 * redondeadas). Fondos opacos y fijos (el hover solo cambia el texto): con
 * transparencia, el cruce de las mitades se oscurece y forma un triángulo.
 * La sombra va como filtro sobre el conjunto para que no se vea la unión.
 */
function Forma({ activa }: { activa: boolean }) {
  const mitad = cn("absolute inset-y-0 w-[calc(50%+1px)] transition-colors duration-200", activa ? "bg-card" : "bg-muted");
  return (
    <span aria-hidden className={cn("absolute inset-0 -z-10", activa && "[filter:drop-shadow(0_-1px_3px_hsl(var(--foreground)/0.08))]")}>
      <span className={cn(mitad, "left-0 origin-bottom-left -skew-x-[14deg] rounded-tl-[10px]")} />
      <span className={cn(mitad, "right-0 origin-bottom-right skew-x-[14deg] rounded-tr-[10px]")} />
    </span>
  );
}

const forma =
  "group/pestana relative isolate flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap px-6 text-[14px] " +
  "transition-colors duration-200 -ml-2 first:ml-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

const activaCls = "z-30 text-foreground";
const inactivaCls = "text-muted-foreground hover:text-foreground";

const esLista = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Pestañas tipo carpeta alineadas a la derecha, sobre la línea base de la
 * tabla. Muestra las fijadas; el resto va en «Más», donde el usuario puede
 * fijar o desfijar cada una (se recuerda en este navegador).
 */
export function PestanasCarpeta<K extends string>({ id, pestanas, activa, onCambio, visiblesIniciales, etiqueta }: PestanasCarpetaProps<K>) {
  const [guardadas, setFijadas] = useEstadoPersistente<string[]>(`${id}.fijadas`, visiblesIniciales, esLista);
  const fijadas = new Set<string>([...guardadas, ...pestanas.filter((p) => p.fija).map((p) => p.id)]);

  // La activa siempre se ve, aunque no esté fijada (se abrió desde «Más»).
  const visibles = pestanas.filter((p) => fijadas.has(p.id) || p.id === activa);
  const enMas = pestanas.filter((p) => !p.fija);
  // «Más» solo cuando hay algo escondido o el módulo pasa de 5 vistas; con pocas pestañas sería ruido.
  const conMas = enMas.some((p) => !fijadas.has(p.id)) || pestanas.length > 5;

  const alternarFijada = (pid: K) =>
    setFijadas((f) => (f.includes(pid) ? f.filter((x) => x !== pid) : [...f, pid]));

  return (
    <div className="flex items-end justify-end border-b border-border">
      <div role="tablist" aria-label={etiqueta} className="isolate -mb-px flex items-end overflow-x-auto pl-3 pr-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibles.map((p, i) => {
          const sel = p.id === activa;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={sel}
              onClick={() => onCambio(p.id)}
              onMouseEnter={p.prefetch}
              onFocus={p.prefetch}
              // Las inactivas se apilan de izquierda a derecha; la activa queda encima de todas.
              style={sel ? undefined : { zIndex: 20 - i }}
              className={cn(forma, sel ? activaCls : inactivaCls)}
            >
              <Forma activa={sel} />
              {p.titulo}
            </button>
          );
        })}
        {conMas && (
          <DropdownMenu>
            <DropdownMenuTrigger style={{ zIndex: 1 }} className={cn(forma, inactivaCls, "px-5")}>
              <Forma activa={false} />
              Más <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Vistas del módulo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {enMas.map((p) => {
                const fijada = fijadas.has(p.id);
                return (
                  <DropdownMenuItem key={p.id} onSelect={() => onCambio(p.id)} onMouseEnter={p.prefetch} className="group/item gap-2 text-[13px]">
                    <span className={cn("flex-1", p.id === activa && "font-medium text-foreground")}>{p.titulo}</span>
                    <button
                      type="button"
                      aria-label={fijada ? `Desfijar ${p.titulo}` : `Fijar ${p.titulo}`}
                      title={fijada ? "Quitar de la barra" : "Fijar en la barra"}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); alternarFijada(p.id); }}
                      // Radix abre la opción en pointerup: el pin no debe navegar, solo fijar.
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-muted",
                        fijada ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground",
                      )}
                    >
                      {fijada ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
