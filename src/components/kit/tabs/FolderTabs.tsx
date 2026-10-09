import { useState } from "react";
import { ChevronDown, Pin, PinOff, X } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePersistentState } from "../table/usePersistentState";

export interface FolderTab<K extends string> {
  id: K;
  title: string;
  /** Siempre visible: no se puede desfijar. */
  pinned?: boolean;
  /** Descarga el chunk de la pestaña al pasar el mouse (antes del clic). */
  prefetch?: () => void;
}

interface FolderTabsProps<K extends string> {
  /** Clave estable: guarda en este navegador las pestañas que el usuario fijó. */
  id: string;
  tabs: FolderTab<K>[];
  active: K;
  // NoInfer: K sale de `tabs`; así se puede pasar un setState directo sin genéricos en JSX (rompen el tagger de Lovable).
  onChange: (id: NoInfer<K>) => void;
  /** Pestañas visibles por defecto; el resto va en «Más». */
  initialVisible: K[];
  label: string;
}

/*
 * Pestaña de carpeta: dos mitades inclinadas en sentidos opuestos (lados en
 * diagonal con la misma pendiente sin importar el ancho, esquinas superiores
 * redondeadas). Fondos opacos y fijos (el hover solo cambia el texto): con
 * transparencia, el cruce de las mitades se oscurece y forma un triángulo.
 * La sombra va como filtro sobre el conjunto para que no se vea la unión.
 */
function TabShape({ active }: { active: boolean }) {
  const half = cn("absolute inset-y-0 w-[calc(50%+1px)] transition-colors duration-200", active ? "bg-card" : "bg-muted");
  return (
    <span aria-hidden className={cn("absolute inset-0 -z-10", active && "[filter:drop-shadow(0_-1px_3px_hsl(var(--foreground)/0.08))]")}>
      <span className={cn(half, "left-0 origin-bottom-left -skew-x-[14deg] rounded-tl-[10px]")} />
      <span className={cn(half, "right-0 origin-bottom-right skew-x-[14deg] rounded-tr-[10px]")} />
    </span>
  );
}

const tabClass =
  "group/tab relative isolate flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap px-6 text-[14px] " +
  "transition-colors duration-200 -ml-2 first:ml-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

const activeClass = "z-30 text-foreground";
const inactiveClass = "text-muted-foreground hover:text-foreground";

const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Pestañas tipo carpeta alineadas a la derecha, sobre la línea base de la
 * tabla. Muestra las fijadas; el resto va en «Más», donde el usuario puede
 * fijar o desfijar cada una (se recuerda en este navegador).
 */
export function FolderTabs<K extends string>({ id, tabs, active, onChange, initialVisible, label }: FolderTabsProps<K>) {
  const [saved, setPinned] = usePersistentState<string[]>(`${id}.pinned`, initialVisible, isStringList);
  const pinnedIds = new Set<string>([...saved, ...tabs.filter((tab) => tab.pinned).map((tab) => tab.id)]);

  // Abiertas desde «Más» sin fijar: se quedan en la barra durante la sesión, con su × para cerrarlas.
  const [opened, setOpened] = useState<string[]>([]);
  const open = (tabId: K) => {
    if (!pinnedIds.has(tabId)) setOpened((list) => (list.includes(tabId) ? list : [...list, tabId]));
    onChange(tabId);
  };
  const close = (tabId: K) => {
    setOpened((list) => list.filter((x) => x !== tabId));
    if (active === tabId) {
      const fallback = tabs.find((tab) => pinnedIds.has(tab.id) && tab.id !== tabId);
      if (fallback) onChange(fallback.id);
    }
  };

  // La activa siempre se ve, aunque no esté fijada.
  const visible = tabs.filter((tab) => pinnedIds.has(tab.id) || opened.includes(tab.id) || tab.id === active);
  const inMore = tabs.filter((tab) => !tab.pinned);
  // «Más» solo cuando hay algo escondido o el módulo pasa de 5 vistas; con pocas pestañas sería ruido.
  const hasMore = inMore.some((tab) => !pinnedIds.has(tab.id)) || tabs.length > 5;

  const togglePinned = (tabId: K) =>
    setPinned((list) => (list.includes(tabId) ? list.filter((x) => x !== tabId) : [...list, tabId]));

  return (
    <div className="flex items-end justify-end border-b border-border">
      <div role="tablist" aria-label={label} className="isolate -mb-px flex items-end overflow-x-auto pl-3 pr-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((tab, i) => {
          const selected = tab.id === active;
          if (!pinnedIds.has(tab.id)) {
            // Pestaña abierta sin fijar: la etiqueta abre (toda el área es clicable) y la × la cierra.
            return (
              <div
                key={tab.id}
                style={selected ? undefined : { zIndex: 20 - i }}
                className={cn(tabClass, "pr-3", selected ? activeClass : inactiveClass)}
              >
                <TabShape active={selected} />
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onChange(tab.id)}
                  onMouseEnter={tab.prefetch}
                  onFocus={tab.prefetch}
                  className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {tab.title}
                </button>
                <button
                  type="button"
                  aria-label={`Cerrar ${tab.title}`}
                  title="Cerrar pestaña"
                  onClick={() => close(tab.id)}
                  className="relative z-10 ml-1 grid h-5 w-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              onMouseEnter={tab.prefetch}
              onFocus={tab.prefetch}
              // Las inactivas se apilan de izquierda a derecha; la activa queda encima de todas.
              style={selected ? undefined : { zIndex: 20 - i }}
              className={cn(tabClass, selected ? activeClass : inactiveClass)}
            >
              <TabShape active={selected} />
              {tab.title}
            </button>
          );
        })}
        {hasMore && (
          <DropdownMenu>
            <DropdownMenuTrigger style={{ zIndex: 1 }} className={cn(tabClass, inactiveClass, "px-5")}>
              <TabShape active={false} />
              Más <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Clic para abrir · pin para dejarla fija</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {inMore.map((tab) => {
                const pinned = pinnedIds.has(tab.id);
                return (
                  <DropdownMenuItem key={tab.id} onSelect={() => open(tab.id)} onMouseEnter={tab.prefetch} title="Abrir" className="group/item cursor-pointer gap-2 text-[13px]">
                    <span className={cn("flex-1", tab.id === active && "font-medium text-foreground")}>{tab.title}</span>
                    <button
                      type="button"
                      aria-label={pinned ? `Desfijar ${tab.title}` : `Fijar ${tab.title}`}
                      title={pinned ? "Quitar de la barra" : "Fijar en la barra"}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePinned(tab.id); }}
                      // Radix abre la opción en pointerup: el pin no debe navegar, solo fijar.
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-muted",
                        pinned ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground",
                      )}
                    >
                      {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
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
