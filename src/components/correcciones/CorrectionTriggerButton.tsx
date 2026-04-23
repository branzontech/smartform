import { useState, type ReactNode } from "react";
import { AlertTriangle, Pencil, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CorrectionDialog } from "./CorrectionDialog";
import { useModoCorreccion } from "@/hooks/useCorreccion";
import type {
  CorreccionTargetTable,
  EstadoRegistro,
} from "@/types/correccion";
import { cn } from "@/lib/utils";

export interface CorrectionTriggerButtonProps {
  targetTable: CorreccionTargetTable;
  targetRecordId: string;
  recordCreatedAt: string;
  recordEstadoRegistro: EstadoRegistro;
  esFacturado?: boolean;
  previewData: { label: string; value: string }[];
  renderReplacementForm?: (
    onChange: (data: Record<string, unknown>) => void
  ) => ReactNode;
  onSuccess?: () => void;
  onQuickEditRequested?: () => void;
  variant?: "icon" | "text" | "full";
  className?: string;
}

export function CorrectionTriggerButton({
  targetTable,
  targetRecordId,
  recordCreatedAt,
  recordEstadoRegistro,
  esFacturado = false,
  previewData,
  renderReplacementForm,
  onSuccess,
  onQuickEditRequested,
  variant = "text",
  className,
}: CorrectionTriggerButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: modo, isLoading } = useModoCorreccion(
    targetTable,
    targetRecordId,
    recordCreatedAt,
    recordEstadoRegistro,
    esFacturado
  );

  if (isLoading || !modo) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={cn("h-7 text-xs", className)}
      >
        …
      </Button>
    );
  }

  const renderContent = (icon: ReactNode, label: string) => {
    if (variant === "icon") return icon;
    if (variant === "text") return <span>{label}</span>;
    return (
      <>
        {icon}
        <span>{label}</span>
      </>
    );
  };

  // BLOQUEADO
  if (modo.modo === "bloqueado") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("inline-flex", className)}>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="h-7 text-xs gap-1.5 text-muted-foreground"
              >
                {renderContent(<Lock className="h-3.5 w-3.5" />, "Corregir")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {modo.motivo_bloqueo ?? "No se puede corregir este registro."}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // EDICIÓN RÁPIDA
  if (modo.modo === "edicion_rapida") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onQuickEditRequested}
        className={cn("h-7 text-xs gap-1.5", className)}
      >
        {renderContent(
          <Pencil className="h-3.5 w-3.5" />,
          `Editar (${modo.minutos_restantes_edicion_rapida ?? 0} min)`
        )}
      </Button>
    );
  }

  // CORRECCIÓN FORMAL
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "h-7 text-xs gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30",
          className
        )}
      >
        {renderContent(
          <AlertTriangle className="h-3.5 w-3.5" />,
          "Corregir"
        )}
      </Button>
      <CorrectionDialog
        open={open}
        onOpenChange={setOpen}
        targetTable={targetTable}
        targetRecordId={targetRecordId}
        recordCreatedAt={recordCreatedAt}
        recordEstadoRegistro={recordEstadoRegistro}
        esFacturado={esFacturado}
        previewData={previewData}
        renderReplacementForm={renderReplacementForm}
        onSuccess={onSuccess}
      />
    </>
  );
}
