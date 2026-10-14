import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveProfessional, type ProfessionalDetail, type ProfessionalInput } from "@/components/agenda/agenda-api";
import { ContractSection } from "@/components/contracts/fields";
import { Button } from "@/components/ui/button";
import { ProfessionalFields } from "./ProfessionalFields";
import { errorMessage, formFromDetail, professionalKeys, sameForm, toProfessionalInput, type ProfessionalForm } from "./professional-form";

interface ProfileSectionProps {
  professional: ProfessionalDetail;
  canEdit: boolean;
}

/** Ficha del profesional. Solo el administrador la edita; los demás la ven en solo lectura. */
export function ProfileSection({ professional, canEdit }: ProfileSectionProps) {
  const queryClient = useQueryClient();
  const [initial] = useState(() => formFromDetail(professional));
  const [form, setForm] = useState<ProfessionalForm>(initial);
  const dirty = !sameForm(form, initial);

  const mutation = useMutation({
    mutationFn: (input: ProfessionalInput) => saveProfessional(professional.userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: professionalKeys.detail(professional.id) });
      void queryClient.invalidateQueries({ queryKey: professionalKeys.list });
      toast.success("Ficha guardada");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const save = () => {
    const result = toProfessionalInput(form);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    mutation.mutate(result.input);
  };

  return (
    <ContractSection id="ficha" title="Ficha" description={canEdit ? undefined : "Solo un administrador puede modificar estos datos."}>
      <fieldset disabled={!canEdit} className="min-w-0">
        <ProfessionalFields idPrefix="profile" form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} showActive />
      </fieldset>
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" className="h-8 text-[13px]" disabled={!dirty || mutation.isPending} onClick={save}>
            {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
            Guardar cambios
          </Button>
        </div>
      )}
    </ContractSection>
  );
}
