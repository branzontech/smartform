import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorMessage } from "../agenda-ui";
import { PRO_TYPE_LABEL, fetchProfessionals, formatShortDay, localDay, localTime, type Cita, type Modality } from "../agenda-api";
import { changePlanProfessional } from "../plans-api";

interface PlanChangeProDialogProps {
  planId: string;
  modalidad: Modality;
  /** Sesiones que aún no empiezan, en orden. */
  pending: Cita[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Pasa las sesiones que faltan (desde una dada) a otro profesional, a las mismas horas. */
export function PlanChangeProDialog({ planId, modalidad, pending, open, onOpenChange }: PlanChangeProDialogProps) {
  const queryClient = useQueryClient();
  const [profesionalId, setProfesionalId] = useState("");
  const [desde, setDesde] = useState(String(pending[0]?.planSesion ?? 1));
  const professionals = useQuery({ queryKey: ["agenda", "profesionales"], queryFn: fetchProfessionals, enabled: open });
  const options = (professionals.data ?? []).filter((p) => p.id && p.activo && (p.modalidades ?? []).includes(modalidad));

  const change = useMutation({
    mutationFn: () => changePlanProfessional(planId, { profesionalId, desdeSesion: Number(desde) }),
    onSuccess: ({ cambiadas }) => {
      toast.success(cambiadas === 1 ? "Se cambió 1 sesión" : `Se cambiaron ${cambiadas} sesiones`);
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !change.isPending && onOpenChange(o)}>
      <DialogContent className="max-w-md rounded-card">
        <DialogHeader>
          <DialogTitle>Cambiar de profesional</DialogTitle>
          <DialogDescription>Las sesiones pendientes conservan su día y hora. Si el nuevo profesional no puede alguna, no se cambia ninguna.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="plan-new-pro">Nuevo profesional</Label>
            <Select value={profesionalId || undefined} onValueChange={setProfesionalId}>
              <SelectTrigger id="plan-new-pro" className="h-10">
                <SelectValue placeholder={professionals.isLoading ? "Cargando…" : "Elige el profesional"} />
              </SelectTrigger>
              <SelectContent>
                {options.map((p) => (
                  <SelectItem key={p.id} value={p.id ?? ""}>
                    {p.nombre} · {p.especialidad || PRO_TYPE_LABEL[p.tipo ?? "otro"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="plan-from-session">Desde la sesión</Label>
            <Select value={desde} onValueChange={setDesde}>
              <SelectTrigger id="plan-from-session" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pending.map((c) => (
                  <SelectItem key={c.id} value={String(c.planSesion)}>
                    Sesión {c.planSesion} · {formatShortDay(localDay(c.inicio))}, {localTime(c.inicio)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="h-9 rounded-full" onClick={() => onOpenChange(false)} disabled={change.isPending}>
            Volver
          </Button>
          <Button className="h-9 gap-2 rounded-full" disabled={!profesionalId || change.isPending} onClick={() => change.mutate()}>
            {change.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Cambiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
