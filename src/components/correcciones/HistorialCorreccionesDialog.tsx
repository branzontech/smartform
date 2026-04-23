import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  FileWarning,
  History,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHistorialCorrecciones } from "@/hooks/useCorreccion";
import type {
  CorreccionTargetTable,
  ProvenanceClinico,
  CorreccionActivityType,
  InteropBroadcastStatus,
} from "@/types/correccion";

export interface HistorialCorreccionesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetTable: CorreccionTargetTable;
  targetRecordId: string;
  recordLabel?: string;
}

const ACTIVITY_LABELS: Record<
  CorreccionActivityType,
  { label: string; className: string }
> = {
  "entered-in-error": {
    label: "Anulación",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40",
  },
  correction: {
    label: "Corrección",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40",
  },
  amendment: {
    label: "Enmienda",
    className:
      "bg-muted text-muted-foreground border-border",
  },
};

const INTEROP_BADGES: Record<
  InteropBroadcastStatus,
  { label: string; className: string } | null
> = {
  not_required: null,
  pending: {
    label: "Pendiente de sincronización",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  },
  sent: {
    label: "Sincronizado",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  failed: {
    label: "Error de sincronización",
    className:
      "bg-destructive/10 text-destructive border-destructive/30",
  },
};

function formatSnapshotKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSnapshotValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function ProvenanceTimelineItem({
  item,
  isLast,
}: {
  item: ProvenanceClinico;
  isLast: boolean;
}) {
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const activity =
    ACTIVITY_LABELS[item.activity_type] ?? ACTIVITY_LABELS.amendment;
  const interopBadge =
    INTEROP_BADGES[item.interop_broadcast_status] ?? null;

  const snapshotEntries = Object.entries(item.previous_snapshot ?? {}).filter(
    ([k]) => !["fhir_extensions", "datos_respuesta"].includes(k)
  );
  // datos_respuesta es jsonb anidado, lo manejamos aparte
  const datosRespuestaSnap = (item.previous_snapshot as any)?.datos_respuesta;

  return (
    <div className="relative pl-8 pb-6">
      {/* Línea vertical */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
      )}
      {/* Punto */}
      <div
        className={cn(
          "absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background",
          item.activity_type === "entered-in-error"
            ? "border-amber-300 text-amber-600"
            : item.activity_type === "correction"
              ? "border-blue-300 text-blue-600"
              : "border-border text-muted-foreground"
        )}
      >
        <FileWarning className="h-3 w-3" />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-[10px] font-medium", activity.className)}
          >
            {activity.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(
              new Date(item.recorded_at),
              "d 'de' MMMM yyyy, HH:mm:ss",
              { locale: es }
            )}
          </span>
          {interopBadge && (
            <Badge
              variant="outline"
              className={cn("text-[10px]", interopBadge.className)}
            >
              {item.interop_broadcast_status === "sent" && item.country_code
                ? `Sincronizado con ${item.country_code}`
                : interopBadge.label}
            </Badge>
          )}
        </div>

        <div className="text-sm">
          <span className="font-medium text-foreground">
            {item.agent_nombre_completo}
          </span>
          <span className="text-muted-foreground"> · {item.agent_role}</span>
        </div>

        <blockquote className="border-l-2 border-border pl-3 italic text-xs text-foreground/80">
          {item.reason_text}
        </blockquote>

        {/* Snapshot colapsable */}
        <Collapsible open={snapshotOpen} onOpenChange={setSnapshotOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {snapshotOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Ver snapshot del registro anterior
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-md border bg-muted/20 p-2.5">
            <dl className="space-y-1 text-[11px] font-mono leading-relaxed">
              {snapshotEntries.slice(0, 12).map(([k, v]) => (
                <div
                  key={k}
                  className="flex gap-2 border-b border-dashed border-border/40 pb-1 last:border-0"
                >
                  <dt className="text-muted-foreground min-w-[140px]">
                    {formatSnapshotKey(k)}:
                  </dt>
                  <dd className="text-foreground flex-1 break-all">
                    {formatSnapshotValue(v)}
                  </dd>
                </div>
              ))}
              {datosRespuestaSnap &&
                typeof datosRespuestaSnap === "object" && (
                  <>
                    <div className="pt-1.5 mt-1.5 border-t border-border/40 text-muted-foreground uppercase tracking-wide text-[10px]">
                      Datos respuesta
                    </div>
                    {Object.entries(datosRespuestaSnap)
                      .slice(0, 8)
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="text-muted-foreground min-w-[140px]">
                            {formatSnapshotKey(k)}:
                          </dt>
                          <dd className="text-foreground flex-1 break-all">
                            {formatSnapshotValue(v)}
                          </dd>
                        </div>
                      ))}
                  </>
                )}
            </dl>
          </CollapsibleContent>
        </Collapsible>

        {item.replacement_record_id && (
          <div className="text-[11px]">
            <a
              href={`#registro-${item.replacement_record_id}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Ver registro de reemplazo →
            </a>
          </div>
        )}

        {item.user_agent && (
          <div className="text-[10px] text-muted-foreground/80">
            Registrado desde{" "}
            <span className="font-mono">
              {item.user_agent.length > 60
                ? `${item.user_agent.slice(0, 60)}…`
                : item.user_agent}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function HistorialCorreccionesDialog({
  open,
  onOpenChange,
  targetTable,
  targetRecordId,
  recordLabel,
}: HistorialCorreccionesDialogProps) {
  const { data, isLoading, isError, refetch, isRefetching } =
    useHistorialCorrecciones(targetTable, open ? targetRecordId : null);

  const handleExport = () => {
    toast.info("Funcionalidad en desarrollo", {
      description:
        "La exportación a PDF / FHIR Bundle se habilitará próximamente.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <History className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold">
                Historial de correcciones
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {recordLabel ?? "Registro clínico"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">
          {/* Aviso */}
          <div className="flex gap-2 rounded-md border border-emerald-200/60 bg-emerald-50/60 px-3 py-2.5 text-xs leading-relaxed text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Este historial es <span className="font-medium">inmutable</span>{" "}
              y cumple con el estándar HL7 FHIR Provenance. Toda corrección
              registrada aquí puede ser auditada legalmente.
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="pl-8">
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center space-y-3">
              <AlertCircle className="h-6 w-6 mx-auto text-destructive" />
              <p className="text-sm text-destructive">
                No se pudo cargar el historial de correcciones.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Reintentar
              </Button>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center">
              <History className="h-6 w-6 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm text-muted-foreground">
                Este registro no tiene correcciones registradas.
              </p>
            </div>
          ) : (
            <div className="pt-2">
              {data.map((item, idx) => (
                <ProvenanceTimelineItem
                  key={item.id}
                  item={item}
                  isLast={idx === data.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-3 bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data || data.length === 0}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar historial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
