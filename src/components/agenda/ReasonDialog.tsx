import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CitaState } from "./agenda-api";
import { REASON_REQUIRED } from "./cita-actions";

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 500;

const COPY: Partial<Record<CitaState, { title: string; description: string; confirm: string }>> = {
  cancelada_paciente: {
    title: "Cancelar por el paciente",
    description: "La cita queda cancelada y el cupo se libera. El motivo se guarda en la bitácora.",
    confirm: "Cancelar cita",
  },
  cancelada_ips: {
    title: "Cancelar por la IPS",
    description: "La cita queda cancelada y el cupo se libera. El motivo se guarda en la bitácora.",
    confirm: "Cancelar cita",
  },
  no_asistio: {
    title: "Marcar no asistió",
    description: "El paciente no se presentó a la cita. Si sabes el motivo, anótalo.",
    confirm: "Marcar no asistió",
  },
};

interface ReasonDialogProps {
  /** Estado al que se pasa; `null` cierra la ventana. */
  state: CitaState | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

/** Motivo para cancelar (obligatorio) o marcar inasistencia (opcional). */
export function ReasonDialog({ state, pending, onClose, onConfirm }: ReasonDialogProps) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent className="max-w-md rounded-card">
        {state && <ReasonForm key={state} state={state} pending={pending} onClose={onClose} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  );
}

function ReasonForm({ state, pending, onClose, onConfirm }: ReasonDialogProps & { state: CitaState }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const required = REASON_REQUIRED.includes(state);
  const copy = COPY[state];
  const trimmed = reason.trim();
  const invalid = required && trimmed.length < MIN_REASON_LENGTH;

  const submit = () => {
    setTouched(true);
    if (!invalid) onConfirm(trimmed);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{copy?.title ?? "Motivo"}</DialogTitle>
        <DialogDescription>{copy?.description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="cita-reason">Motivo{required ? "" : " (opcional)"}</Label>
        <Textarea
          id="cita-reason"
          value={reason}
          maxLength={MAX_REASON_LENGTH}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={3}
          aria-invalid={touched && invalid}
          aria-describedby={touched && invalid ? "cita-reason-error" : undefined}
          className="rounded-lg"
          autoFocus
        />
        {touched && invalid && (
          <p id="cita-reason-error" className="text-[13px] text-destructive">Escribe el motivo de la cancelación.</p>
        )}
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending} className="rounded-lg">Volver</Button>
        <Button type="submit" variant={required ? "destructive" : "default"} disabled={pending} className="rounded-lg">
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {copy?.confirm ?? "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
