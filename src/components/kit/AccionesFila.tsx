import { Eye, MoreHorizontal, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirmar } from "./useConfirmar";

export interface AccionFila {
  titulo: string;
  icono?: LucideIcon;
  onClick: () => void;
}

interface AccionesFilaProps {
  /** Nombre de lo que se muestra en la fila, para los textos accesibles («Ver paciente Ana Gómez»). */
  nombre: string;
  onVer?: () => void;
  /** Acciones de uso ocasional: van dentro de «Más acciones». */
  menu?: AccionFila[];
  /** Eliminar SIEMPRE va al final de «Más acciones» y pide confirmación (convención Ker Hub). */
  onEliminar?: () => void | Promise<void>;
  /** Texto de la confirmación de eliminar. */
  confirmarEliminar?: { titulo: string; descripcion: string };
}

const botonIcono = "h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";

/**
 * Columna «Acciones» de TablaDatos: «Ver» a la vista y el resto en «Más
 * acciones». Eliminar nunca es un botón visible en la fila.
 */
export function AccionesFila({ nombre, onVer, menu = [], onEliminar, confirmarEliminar }: AccionesFilaProps) {
  const [confirmar, dialogo] = useConfirmar();
  const conMenu = menu.length > 0 || !!onEliminar;

  const eliminar = async () => {
    if (!onEliminar) return;
    const ok = await confirmar({
      titulo: confirmarEliminar?.titulo ?? "¿Eliminar este registro?",
      descripcion: confirmarEliminar?.descripcion ?? `«${nombre}» se eliminará y no se podrá recuperar.`,
      confirmar: "Eliminar",
      destructivo: true,
    });
    if (ok) await onEliminar();
  };

  return (
    <>
      {onVer && (
        <Button variant="ghost" size="icon" className={botonIcono} aria-label={`Ver ${nombre}`} title="Ver" onClick={onVer}>
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {conMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={botonIcono} aria-label={`Más acciones para ${nombre}`} title="Más acciones">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            {menu.map(({ titulo, icono: Icono, onClick }) => (
              <DropdownMenuItem key={titulo} onSelect={onClick} className="gap-2 text-[13px]">
                {Icono && <Icono className="h-4 w-4 text-muted-foreground" />}
                {titulo}
              </DropdownMenuItem>
            ))}
            {onEliminar && (
              <>
                {menu.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onSelect={() => void eliminar()} className="gap-2 text-[13px] text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {dialogo}
    </>
  );
}
