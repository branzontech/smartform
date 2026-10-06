import { MoreHorizontal, Plus, Settings, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface AccionEncabezado {
  titulo: string;
  icono?: LucideIcon;
  onClick: () => void;
  /** Descarga el chunk destino al pasar el mouse (antes del clic). */
  prefetch?: () => void;
}

interface EncabezadoModuloProps {
  titulo: string;
  /** Acción principal (una sola, oscura). */
  primaria?: AccionEncabezado;
  /** Como máximo dos acciones de uso diario, visibles como texto. */
  secundarias?: [AccionEncabezado] | [AccionEncabezado, AccionEncabezado];
  /** Acciones de uso ocasional (importar, imprimir…): van en «…». */
  menu?: AccionEncabezado[];
  /** Configuración del módulo: siempre el engranaje, al final. */
  onConfiguracion?: () => void;
}

const botonTexto =
  "h-9 gap-1.5 rounded-lg px-3 text-[13px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground";
const botonIcono = "h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";

/**
 * Encabezado estándar de módulo (convención de todo el proyecto):
 * título · hasta 2 secundarias · «…» con lo ocasional · engranaje · 1 primaria.
 * Las vistas del módulo (listas que se consultan) NO van aquí: son pestañas
 * (PestanasCarpeta). La acción propia de cada vista va en la barra de su tabla.
 */
export function EncabezadoModulo({ titulo, primaria, secundarias, menu, onConfiguracion }: EncabezadoModuloProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{titulo}</h1>
      <div className="flex items-center gap-1">
        {secundarias?.map(({ titulo: t, icono: Icono, onClick, prefetch }) => (
          <Button key={t} variant="ghost" className={botonTexto} onClick={onClick} onMouseEnter={prefetch}>
            {Icono && <Icono className="h-4 w-4" />}
            <span className="hidden sm:inline">{t}</span>
          </Button>
        ))}
        {menu && menu.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Más acciones" title="Más acciones" className={botonIcono}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              {menu.map(({ titulo: t, icono: Icono, onClick, prefetch }) => (
                <DropdownMenuItem key={t} onSelect={onClick} onMouseEnter={prefetch} className="gap-2 text-[13px]">
                  {Icono && <Icono className="h-4 w-4 text-muted-foreground" />}
                  {t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onConfiguracion && (
          <Button variant="ghost" size="icon" aria-label="Configuración del módulo" title="Configuración" onClick={onConfiguracion} className={botonIcono}>
            <Settings className="h-4 w-4" />
          </Button>
        )}
        {primaria && (
          <Button
            onClick={primaria.onClick}
            onMouseEnter={primaria.prefetch}
            className="group ml-1 h-9 gap-1.5 rounded-lg bg-foreground px-3.5 text-[13px] font-medium text-background shadow-none hover:bg-foreground/90"
          >
            {primaria.icono ? <primaria.icono className="h-4 w-4" /> : (
              <Plus className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:rotate-90" />
            )}
            {primaria.titulo}
          </Button>
        )}
      </div>
    </div>
  );
}
