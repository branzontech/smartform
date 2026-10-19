import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, FileText, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { markArrival, today, type Cita, type CitaState } from "./agenda-api";
import { clinicalRecordUrl, errorMessage } from "./agenda-ui";
import {
  ACTION_LABEL, REASON_REQUIRED, canMarkArrival, canReschedule, needsReason, primaryNext, secondaryNext, showsClinicalRecord,
} from "./cita-actions";
import { ReasonDialog } from "./ReasonDialog";
import { RescheduleDialog } from "./RescheduleDialog";
import { useCitaStateChange } from "./useCitaStateChange";

interface CitaActionsProps {
  cita: Cita;
  /** `inline`: encabezado del detalle. `stacked`: tarjeta de Mi día (botones anchos, táctiles). */
  layout?: "inline" | "stacked";
  className?: string;
}

/**
 * Acciones de una cita: la siguiente lógica a la vista (Confirmar, Salir en
 * camino, Iniciar atención, Marcar atendida), «Abrir historia clínica» cuando
 * está en atención o atendida, y el resto en «Más acciones». Las citas no se
 * borran: se cancelan con motivo.
 */
export function CitaActions({ cita, layout = "inline", className }: CitaActionsProps) {
  const navigate = useNavigate();
  const change = useCitaStateChange(cita);
  const [reasonFor, setReasonFor] = useState<CitaState | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const primary = primaryNext(cita);
  const secondary = secondaryNext(cita);
  const reschedulable = canReschedule(cita.estado);
  const showRecord = showsClinicalRecord(cita.estado);
  const stacked = layout === "stacked";
  const buttonSize = stacked ? "h-11 flex-1 rounded-xl" : "h-9 rounded-lg";
  const recordFirst = cita.estado === "en_atencion";
  const queryClient = useQueryClient();
  const arrival = useMutation({
    mutationFn: () => markArrival(cita.id),
    onSuccess: () => {
      toast.success("Llegada registrada");
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const showArrival = canMarkArrival(cita, today());

  const run = (estado: CitaState) => {
    if (needsReason(estado)) setReasonFor(estado);
    else change.mutate({ estado });
  };

  const confirmReason = (motivo: string) => {
    if (!reasonFor) return;
    change.mutate({ estado: reasonFor, motivo }, { onSuccess: () => setReasonFor(null) });
  };

  const pendingState = change.isPending ? change.variables?.estado : undefined;
  const nothingToDo = !primary && !showRecord && !showArrival && secondary.length === 0 && !reschedulable;
  if (nothingToDo) return null;

  const recordButton = showRecord && (
    <Button
      variant={recordFirst ? "default" : "outline"}
      className={cn(buttonSize, "gap-1.5")}
      onClick={() => navigate(clinicalRecordUrl(cita))}
    >
      <FileText aria-hidden />
      Abrir historia clínica
    </Button>
  );

  const primaryButton = primary && (
    <Button
      variant={recordFirst ? "outline" : "default"}
      className={cn(buttonSize, "gap-1.5")}
      disabled={change.isPending}
      onClick={() => run(primary)}
    >
      {pendingState === primary && <Loader2 className="animate-spin" aria-hidden />}
      {ACTION_LABEL[primary]}
    </Button>
  );

  const cancellations = secondary.filter((s) => REASON_REQUIRED.includes(s));
  const others = secondary.filter((s) => !REASON_REQUIRED.includes(s));

  return (
    <div className={cn("flex items-center gap-2", stacked && "w-full", className)}>
      {showArrival && (
        <Button variant="outline" className={cn(buttonSize, "gap-1.5")} disabled={arrival.isPending} onClick={() => arrival.mutate()}>
          {arrival.isPending && <Loader2 className="animate-spin" aria-hidden />}
          Llegó
        </Button>
      )}
      {recordFirst ? <>{recordButton}{primaryButton}</> : <>{primaryButton}{recordButton}</>}
      {(secondary.length > 0 || reschedulable) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost" size="icon" aria-label="Más acciones" title="Más acciones" disabled={change.isPending}
              className={cn("shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground", stacked ? "h-11 w-11 rounded-xl" : "h-9 w-9 rounded-lg")}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            {others.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => run(s)} className="text-[13px]">{ACTION_LABEL[s]}</DropdownMenuItem>
            ))}
            {reschedulable && (
              <DropdownMenuItem onSelect={() => setRescheduling(true)} className="gap-2 text-[13px]">
                <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
                Reprogramar
              </DropdownMenuItem>
            )}
            {cancellations.length > 0 && (others.length > 0 || reschedulable) && <DropdownMenuSeparator />}
            {cancellations.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => run(s)} className="text-[13px] text-destructive focus:text-destructive">
                {ACTION_LABEL[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ReasonDialog
        state={reasonFor}
        pending={change.isPending}
        onClose={() => setReasonFor(null)}
        onConfirm={confirmReason}
      />
      {reschedulable && <RescheduleDialog cita={cita} open={rescheduling} onOpenChange={setRescheduling} />}
    </div>
  );
}
