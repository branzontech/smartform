import { MoreHorizontal, Plus, Settings, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface HeaderAction {
  title: string;
  icon?: LucideIcon;
  onClick: () => void;
  /** Descarga el chunk destino al pasar el mouse (antes del clic). */
  prefetch?: () => void;
}

interface ModuleHeaderProps {
  title: string;
  /** Acción principal (una sola, oscura). */
  primary?: HeaderAction;
  /** Como máximo dos acciones de uso diario, visibles como texto. */
  secondary?: [HeaderAction] | [HeaderAction, HeaderAction];
  /** Acciones de uso ocasional (importar, imprimir…): van en «…». */
  menu?: HeaderAction[];
  /** Configuración del módulo: siempre el engranaje, al final. */
  onSettings?: () => void;
}

const textButtonClass =
  "h-9 gap-1.5 rounded-lg px-3 text-[13px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground";
const iconButtonClass = "h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";

/**
 * Encabezado estándar de módulo (convención de todo el proyecto):
 * título · hasta 2 secundarias · «…» con lo ocasional · engranaje · 1 primaria.
 * Las vistas del módulo (listas que se consultan) NO van aquí: son pestañas
 * (FolderTabs). La acción propia de cada vista va en la barra de su tabla.
 */
export function ModuleHeader({ title, primary, secondary, menu, onSettings }: ModuleHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <div className="flex items-center gap-1">
        {secondary?.map(({ title: label, icon: Icon, onClick, prefetch }) => (
          <Button key={label} variant="ghost" className={textButtonClass} onClick={onClick} onMouseEnter={prefetch}>
            {Icon && <Icon className="h-4 w-4" />}
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
        {menu && menu.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Más acciones" title="Más acciones" className={iconButtonClass}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              {menu.map(({ title: label, icon: Icon, onClick, prefetch }) => (
                <DropdownMenuItem key={label} onSelect={onClick} onMouseEnter={prefetch} className="gap-2 text-[13px]">
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onSettings && (
          <Button variant="ghost" size="icon" aria-label="Configuración del módulo" title="Configuración" onClick={onSettings} className={iconButtonClass}>
            <Settings className="h-4 w-4" />
          </Button>
        )}
        {primary && (
          <Button
            onClick={primary.onClick}
            onMouseEnter={primary.prefetch}
            className="group ml-1 h-9 gap-1.5 rounded-lg bg-foreground px-3.5 text-[13px] font-medium text-background shadow-none hover:bg-foreground/90"
          >
            {primary.icon ? <primary.icon className="h-4 w-4" /> : (
              <Plus className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:rotate-90" />
            )}
            {primary.title}
          </Button>
        )}
      </div>
    </div>
  );
}
