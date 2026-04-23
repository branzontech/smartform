import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCorreccion } from "@/hooks/useCorreccion";
import type {
  CorreccionTargetTable,
  EstadoRegistro,
} from "@/types/correccion";

export interface CorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

type ModoSeleccionado = "anular" | "corregir" | null;

export function CorrectionDialog({
  open,
  onOpenChange,
  targetTable,
  targetRecordId,
  recordCreatedAt,
  recordEstadoRegistro,
  esFacturado = false,
  previewData,
  renderReplacementForm,
  onSuccess,
}: CorrectionDialogProps) {
  const {
    configuracion,
    configuracionLoading,
    anularAsync,
    anulando,
    corregirAsync,
    corrigiendo,
  } = useCorreccion(targetTable);

  const [modoSeleccionado, setModoSeleccionado] =
    useState<ModoSeleccionado>(null);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [replacementData, setReplacementData] = useState<
    Record<string, unknown>
  >({});
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);

  const enProgreso = anulando || corrigiendo;
  const motivoValido = motivoTexto.trim().length >= 10;
  const motivoTooLong = motivoTexto.length > 2000;
  const puedeContinuar =
    !!modoSeleccionado &&
    motivoValido &&
    !motivoTooLong &&
    (modoSeleccionado === "anular" ||
      (modoSeleccionado === "corregir" &&
        Object.keys(replacementData).length > 0));

  // Defensa: si el registro no está activo, cerrar y avisar
  if (open && recordEstadoRegistro !== "active") {
    toast.error("Este registro ya fue anulado o corregido previamente");
    onOpenChange(false);
    return null;
  }

  const handleClose = () => {
    if (enProgreso) return;
    setModoSeleccionado(null);
    setMotivoTexto("");
    setReplacementData({});
    setPreviewExpanded(false);
    setConfirmacionAbierta(false);
    onOpenChange(false);
  };

  const handleConfirmar = async () => {
    try {
      if (modoSeleccionado === "anular") {
        await anularAsync({
          target_table: targetTable,
          target_record_id: targetRecordId,
          reason_text: motivoTexto.trim(),
        });
      } else if (modoSeleccionado === "corregir") {
        await corregirAsync({
          target_table: targetTable,
          target_record_id: targetRecordId,
          reason_text: motivoTexto.trim(),
          replacement_data: replacementData,
        });
      }
      setConfirmacionAbierta(false);
      handleClose();
      onSuccess?.();
    } catch {
      // El hook ya muestra el toast
      setConfirmacionAbierta(false);
    }
  };

  const permiteAnulacion =
    configuracion?.permite_anulacion_sin_reemplazo ?? true;
  const permiteCorreccion =
    (configuracion?.permite_correccion_con_reemplazo ?? true) &&
    !!renderReplacementForm;

  const idTruncado = `${targetRecordId.slice(0, 8)}…${targetRecordId.slice(-4)}`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-semibold">
                  Corregir registro clínico
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {configuracionLoading
                    ? "Cargando configuración…"
                    : configuracion?.nombre_legible ?? "Registro clínico"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {configuracionLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : !configuracion ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                No está configurada la corrección para este tipo de registro.
                Contacte al administrador.
              </div>
            ) : (
              <>
                {/* Aviso informativo */}
                <div className="rounded-md border border-amber-200/60 bg-amber-50/60 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  Esta corrección quedará registrada permanentemente en el
                  audit trail. El registro original{" "}
                  <span className="font-medium">no se elimina</span>: se marca
                  como erróneo y se vincula con la corrección para preservar
                  trazabilidad clínica.
                </div>

                {/* Preview del registro original */}
                <Collapsible
                  open={previewExpanded}
                  onOpenChange={setPreviewExpanded}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <span>Ver datos del registro original</span>
                      {previewExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 rounded-md border bg-background px-3 py-2.5">
                    <dl className="space-y-1 text-xs font-mono leading-relaxed">
                      {previewData.map((item, i) => (
                        <div
                          key={i}
                          className="flex gap-2 border-b border-dashed border-border/50 pb-1 last:border-0 last:pb-0"
                        >
                          <dt className="text-muted-foreground min-w-[120px]">
                            {item.label}:
                          </dt>
                          <dd className="text-foreground flex-1">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                      <div className="flex gap-2 border-b border-dashed border-border/50 pb-1">
                        <dt className="text-muted-foreground min-w-[120px]">
                          Creado:
                        </dt>
                        <dd className="text-foreground flex-1">
                          {new Date(recordCreatedAt).toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground min-w-[120px]">
                          ID:
                        </dt>
                        <dd className="text-foreground flex-1">
                          {idTruncado}
                        </dd>
                      </div>
                    </dl>
                  </CollapsibleContent>
                </Collapsible>

                {/* Selector de modo */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tipo de corrección
                  </Label>
                  <RadioGroup
                    value={modoSeleccionado ?? ""}
                    onValueChange={(v) =>
                      setModoSeleccionado(v as ModoSeleccionado)
                    }
                    className="gap-2"
                  >
                    <label
                      className={cn(
                        "flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors",
                        modoSeleccionado === "anular"
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:bg-muted/40",
                        !permiteAnulacion && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <RadioGroupItem
                        value="anular"
                        disabled={!permiteAnulacion}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          Anular registro
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          El registro se marca como erróneo sin reemplazo. Se
                          usa cuando el registro nunca debió existir (ej: se
                          registró en el paciente equivocado).
                        </p>
                      </div>
                    </label>

                    {permiteCorreccion && (
                      <label
                        className={cn(
                          "flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors",
                          modoSeleccionado === "corregir"
                            ? "border-primary/40 bg-primary/5"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <RadioGroupItem
                          value="corregir"
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            Corregir con reemplazo
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            El registro original se anula y se crea uno nuevo
                            con los datos corregidos. Se usa cuando hay un
                            valor erróneo que debe quedar reemplazado.
                          </p>
                        </div>
                      </label>
                    )}
                  </RadioGroup>
                </div>

                {/* Motivo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="motivo-correccion"
                      className="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      Motivo de la corrección
                    </Label>
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        motivoTooLong
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {motivoTexto.length}/2000
                    </span>
                  </div>
                  <Textarea
                    id="motivo-correccion"
                    value={motivoTexto}
                    onChange={(e) => setMotivoTexto(e.target.value)}
                    placeholder="Describa claramente por qué se realiza esta corrección…"
                    className="min-h-[80px] resize-y border-x-0 border-t-0 border-b rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                  />
                  {motivoTexto.length > 0 && !motivoValido && (
                    <p className="text-[11px] text-destructive">
                      El motivo debe tener al menos 10 caracteres.
                    </p>
                  )}
                </div>

                {/* Form de reemplazo */}
                {modoSeleccionado === "corregir" && renderReplacementForm && (
                  <div className="rounded-md border bg-muted/20 px-3 py-3 space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Datos corregidos
                    </Label>
                    {renderReplacementForm((data) =>
                      setReplacementData(data)
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="border-t px-6 py-3 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={enProgreso}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmacionAbierta(true)}
              disabled={!puedeContinuar || enProgreso || !configuracion}
            >
              Revisar y confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación final */}
      <AlertDialog
        open={confirmacionAbierta}
        onOpenChange={(o) => !enProgreso && setConfirmacionAbierta(o)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Confirmar corrección
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Modo:
                  </span>
                  <span className="font-medium">
                    {modoSeleccionado === "anular"
                      ? "Anular registro"
                      : "Corregir con reemplazo"}
                  </span>
                </div>
                <blockquote className="border-l-2 border-border pl-3 italic text-xs text-foreground/80">
                  {motivoTexto}
                </blockquote>
                <p className="text-xs leading-relaxed">
                  Esta acción es{" "}
                  <span className="font-medium text-foreground">
                    irreversible
                  </span>{" "}
                  y quedará registrada permanentemente en el audit trail con
                  fecha, hora, usuario y dispositivo.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enProgreso}>
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmar();
              }}
              disabled={enProgreso}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {enProgreso ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Registrando corrección…
                </>
              ) : (
                "Confirmar corrección"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
