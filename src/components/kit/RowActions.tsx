import { Eye, MoreHorizontal, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "./useConfirm";

export interface RowAction {
  title: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface RowActionsProps {
  /** Nombre de lo que se muestra en la fila, para los textos accesibles («Ver paciente Ana Gómez»). */
  name: string;
  onView?: () => void;
  /** Acciones de uso ocasional: van dentro de «Más acciones». */
  menu?: RowAction[];
  /** Eliminar SIEMPRE va al final de «Más acciones» y pide confirmación (convención Ker Hub). */
  onDelete?: () => void | Promise<void>;
  /** Texto de la confirmación de eliminar. */
  deleteConfirmation?: { title: string; description: string };
}

const iconButtonClass = "h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";

/**
 * Columna «Acciones» de DataTable: «Ver» a la vista y el resto en «Más
 * acciones». Eliminar nunca es un botón visible en la fila.
 */
export function RowActions({ name, onView, menu = [], onDelete, deleteConfirmation }: RowActionsProps) {
  const [confirm, confirmDialog] = useConfirm();
  const hasMenu = menu.length > 0 || !!onDelete;

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = await confirm({
      title: deleteConfirmation?.title ?? "¿Eliminar este registro?",
      description: deleteConfirmation?.description ?? `«${name}» se eliminará y no se podrá recuperar.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (ok) await onDelete();
  };

  return (
    <>
      {onView && (
        <Button variant="ghost" size="icon" className={iconButtonClass} aria-label={`Ver ${name}`} title="Ver" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={iconButtonClass} aria-label={`Más acciones para ${name}`} title="Más acciones">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            {menu.map(({ title, icon: Icon, onClick }) => (
              <DropdownMenuItem key={title} onSelect={onClick} className="gap-2 text-[13px]">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                {title}
              </DropdownMenuItem>
            ))}
            {onDelete && (
              <>
                {menu.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onSelect={() => void handleDelete()} className="gap-2 text-[13px] text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {confirmDialog}
    </>
  );
}
