import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RecurrenceForm } from "@/components/appointments/wizard/RecurrenceForm";
import { PlanPreview } from "@/components/appointments/wizard/PlanPreview";
import { draftFromRecurrence, planMissing, recurrenceOf, type PlanState } from "@/components/appointments/wizard/wizard-model";
import { errorMessage } from "../agenda-ui";
import { addDays, fetchProfessionals, localDay, today } from "../agenda-api";
import { chosenFrom, extendPlan, previewPlan, type PlanDetail } from "../plans-api";

/** El día siguiente a la última sesión del plan (o hoy, si ya pasó). */
function nextStart(plan: PlanDetail): string {
  const last = plan.citas.reduce((max, c) => (c.inicio > max ? c.inicio : max), "");
  const after = last ? addDays(localDay(last), 1) : today();
  return after > today() ? after : today();
}

const freshState = (plan: PlanDetail): PlanState => ({ draft: draftFromRecurrence(plan.recurrencia, nextStart(plan)), checks: null, removed: new Set() });

/** Agrega sesiones al plan con su misma cadencia (editable) y los mismos datos de cita. */
export function PlanExtendSheet({ plan, open, onOpenChange }: { plan: PlanDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<PlanState>(() => freshState(plan));
  const professionals = useQuery({ queryKey: ["agenda", "profesionales"], queryFn: fetchProfessionals, enabled: open });
  const options = (professionals.data ?? []).filter((p) => p.id && p.activo && (p.modalidades ?? []).includes(plan.modalidad));

  useEffect(() => {
    if (open) setState(freshState(plan));
  }, [open, plan]);

  const preview = useMutation({
    mutationFn: () => previewPlan({ planId: plan.id, recurrencia: recurrenceOf(state.draft) }),
    onSuccess: ({ sesiones }) => setState((s) => ({ ...s, checks: sesiones, removed: new Set() })),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const sessions = state.checks ? chosenFrom(state.checks, state.removed) : [];
  const extend = useMutation({
    mutationFn: () => extendPlan(plan.id, { recurrencia: recurrenceOf(state.draft), sesiones: sessions }),
    onSuccess: ({ citas }) => {
      toast.success(citas === 1 ? "Se agregó 1 sesión" : `Se agregaron ${citas} sesiones`);
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const missing = planMissing(state.draft);

  const toggle = (sesion: number, included: boolean) =>
    setState((s) => {
      const removed = new Set(s.removed);
      if (included) removed.delete(sesion);
      else removed.add(sesion);
      return { ...s, removed };
    });

  return (
    <Sheet open={open} onOpenChange={(o) => !extend.isPending && onOpenChange(o)}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle>Agregar sesiones</SheetTitle>
          <SheetDescription>Con los mismos datos del plan. Ajusta la repetición si cambió.</SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 content-start gap-5 overflow-y-auto px-6 py-5">
          <RecurrenceForm value={state.draft} onChange={(draft) => setState({ draft, checks: null, removed: new Set() })} professionals={options} />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-9 gap-2 rounded-full" disabled={missing.length > 0 || preview.isPending} onClick={() => preview.mutate()}>
              {preview.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {state.checks ? "Revisar de nuevo" : "Ver las sesiones"}
            </Button>
            {missing.length > 0 && <p className="text-xs text-muted-foreground">Falta {missing.join(", ")}.</p>}
          </div>
          {state.checks && <PlanPreview checks={state.checks} removed={state.removed} onToggle={toggle} />}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" className="h-9 rounded-full" onClick={() => onOpenChange(false)} disabled={extend.isPending}>
            Cancelar
          </Button>
          <Button className="h-9 gap-2 rounded-full" disabled={!sessions.length || extend.isPending} onClick={() => extend.mutate()}>
            {extend.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sessions.length ? `Agregar ${sessions.length} ${sessions.length === 1 ? "sesión" : "sesiones"}` : "Agregar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
