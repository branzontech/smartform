import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MODALITY_LABEL, addDays, fetchSlots, formatLongDay, localDay, localTime, rescheduleCita, today, type Cita,
} from "./agenda-api";
import { capitalizeFirst, durationMin, errorMessage, isDay } from "./agenda-ui";

const MAX_REASON_LENGTH = 500;
const SLOT_SKELETONS = 9;

interface RescheduleDialogProps {
  cita: Cita;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Reprogramar: mismo profesional y modalidad; se elige un cupo libre de otro día u hora. */
export function RescheduleDialog({ cita, open, onOpenChange }: RescheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto rounded-card">
        {open && <RescheduleForm cita={cita} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RescheduleForm({ cita, onClose }: { cita: Cita; onClose: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const minDay = today();
  const [day, setDay] = useState(() => (localDay(cita.inicio) < minDay ? minDay : localDay(cita.inicio)));
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const duration = durationMin(cita);

  const slots = useQuery({
    queryKey: ["agenda", "slots", cita.profesionalId, day, duration, cita.modalidad],
    queryFn: () => fetchSlots({ profesionalId: cita.profesionalId, fecha: day, duracionMin: duration, modalidad: cita.modalidad }),
    enabled: isDay(day),
  });

  const reschedule = useMutation({
    mutationFn: (inicio: string) => rescheduleCita(cita.id, { inicio, duracionMin: duration, motivo: reason.trim() || null }),
    onSuccess: ({ id }, inicio) => {
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Cita reprogramada", { description: `Nueva cita: ${formatLongDay(localDay(inicio))}, ${localTime(inicio)}.` });
      onClose();
      navigate(`/app/citas/${id}`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const changeDay = (next: string) => {
    if (!isDay(next) || next < minDay) return;
    setDay(next);
    setSelected(null);
  };

  const available = slots.data?.slots ?? [];

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => { e.preventDefault(); if (selected) reschedule.mutate(selected); }}
    >
      <DialogHeader>
        <DialogTitle>Reprogramar cita</DialogTitle>
        <DialogDescription>
          {cita.profesional} · {MODALITY_LABEL[cita.modalidad]} · {duration} min. La cita actual queda como reprogramada.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="reschedule-day">Fecha</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button" variant="ghost" size="icon" aria-label="Día anterior"
            disabled={day <= minDay} onClick={() => changeDay(addDays(day, -1))} className="h-10 w-10 shrink-0 rounded-lg"
          >
            <ChevronLeft />
          </Button>
          <Input
            id="reschedule-day" type="date" min={minDay} value={day}
            onChange={(e) => changeDay(e.target.value)} className="h-10 rounded-lg"
          />
          <Button
            type="button" variant="ghost" size="icon" aria-label="Día siguiente"
            onClick={() => changeDay(addDays(day, 1))} className="h-10 w-10 shrink-0 rounded-lg"
          >
            <ChevronRight />
          </Button>
        </div>
        <p className="text-[13px] text-muted-foreground">{capitalizeFirst(formatLongDay(day))}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Hora</legend>
        {slots.isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: SLOT_SKELETONS }, (_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : slots.isError ? (
          <p className="text-[13px] text-destructive">{errorMessage(slots.error)}</p>
        ) : slots.data?.sinHorario ? (
          <p className="text-[13px] text-muted-foreground">El profesional no atiende este día. Elige otra fecha.</p>
        ) : available.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No quedan cupos libres este día. Elige otra fecha.</p>
        ) : (
          <div role="radiogroup" aria-label="Horas libres" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {available.map((slot) => {
              const isSelected = selected === slot.inicio;
              return (
                <button
                  key={slot.inicio}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(slot.inicio)}
                  className={cn(
                    "h-10 rounded-lg text-sm tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isSelected ? "bg-primary font-medium text-primary-foreground" : "bg-muted/60 text-foreground hover:bg-muted",
                  )}
                >
                  {slot.hora}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="reschedule-reason">Motivo (opcional)</Label>
        <Textarea
          id="reschedule-reason" rows={2} maxLength={MAX_REASON_LENGTH} value={reason}
          onChange={(e) => setReason(e.target.value)} className="rounded-lg"
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={onClose} disabled={reschedule.isPending} className="rounded-lg">Volver</Button>
        <Button type="submit" disabled={!selected || reschedule.isPending} className="rounded-lg">
          {reschedule.isPending && <Loader2 className="animate-spin" aria-hidden />}
          Reprogramar
        </Button>
      </DialogFooter>
    </form>
  );
}
