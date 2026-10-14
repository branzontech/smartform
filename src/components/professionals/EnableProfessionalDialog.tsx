import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveProfessional, type ProfessionalInput, type ProfessionalRow } from "@/components/agenda/agenda-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfessionalFields } from "./ProfessionalFields";
import { emptyProfessionalForm, errorMessage, professionalKeys, toProfessionalInput, type ProfessionalForm } from "./professional-form";

interface EnableProfessionalDialogProps {
  /** Miembro de la empresa que se va a habilitar; null cierra el diálogo. */
  member: ProfessionalRow | null;
  onClose: () => void;
}

export function EnableProfessionalDialog({ member, onClose }: EnableProfessionalDialogProps) {
  return (
    <Dialog open={!!member} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
        {/* El formulario se monta con cada persona para empezar siempre limpio. */}
        {member && <EnableForm key={member.userId} member={member} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EnableForm({ member, onClose }: { member: ProfessionalRow; onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfessionalForm>(emptyProfessionalForm);

  const mutation = useMutation({
    mutationFn: (input: ProfessionalInput) => saveProfessional(member.userId, input),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: professionalKeys.list });
      toast.success(`${member.nombre} quedó habilitado como profesional`);
      onClose();
      navigate(`/app/profesionales/${id}`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submit = () => {
    const result = toProfessionalInput(form);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    mutation.mutate(result.input);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Habilitar como profesional</DialogTitle>
        <DialogDescription>{member.nombre} podrá recibir citas en la agenda según su horario.</DialogDescription>
      </DialogHeader>
      <ProfessionalFields idPrefix="enable" form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
          Habilitar
        </Button>
      </DialogFooter>
    </>
  );
}
