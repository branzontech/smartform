import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "../agenda-ui";
import { cancelPlan } from "../plans-api";

const MIN_REASON = 3;

/** Cancela las sesiones del plan que aún no empiezan, con motivo. Las atendidas quedan como están. */
export function PlanCancelDialog({ planId, pending, open, onOpenChange }: { planId: string; pending: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [motivo, setMotivo] = useState("");
  const [por, setPor] = useState<"paciente" | "ips">("paciente");
  const cancel = useMutation({
    mutationFn: () => cancelPlan(planId, { motivo: motivo.trim(), por }),
    onSuccess: ({ canceladas }) => {
      toast.success(canceladas === 1 ? "Se canceló 1 sesión" : `Se cancelaron ${canceladas} sesiones`);
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !cancel.isPending && onOpenChange(o)}>
      <DialogContent className="max-w-md rounded-card">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (motivo.trim().length >= MIN_REASON) cancel.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Cancelar las sesiones que faltan</DialogTitle>
            <DialogDescription>
              {pending === 1 ? "La sesión pendiente se cancela" : `Las ${pending} sesiones pendientes se cancelan`} y sus cupos se liberan. Las ya atendidas no cambian.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="plan-cancel-by">Quién cancela</Label>
            <Select value={por} onValueChange={(v) => setPor(v as "paciente" | "ips")}>
              <SelectTrigger id="plan-cancel-by" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paciente">El paciente</SelectItem>
                <SelectItem value="ips">La IPS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="plan-cancel-reason">Motivo</Label>
            <Textarea id="plan-cancel-reason" rows={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="rounded-lg" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" className="h-9 rounded-full" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>
              Volver
            </Button>
            <Button type="submit" variant="destructive" className="h-9 gap-2 rounded-full" disabled={motivo.trim().length < MIN_REASON || cancel.isPending}>
              {cancel.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancelar sesiones
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
