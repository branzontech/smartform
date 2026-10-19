import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppointmentWizard, type WizardData } from "@/components/appointments/wizard";
import { createCita, formatLongDay } from "@/components/agenda/agenda-api";
import { createPlan } from "@/components/agenda/plans-api";
import { citaDataOf } from "@/components/appointments/wizard/wizard-model";
import { ApiError } from "@/integrations/api/client";

/**
 * Nueva cita: paciente → qué necesita → cuándo y con quién → confirmar (convenio, servicio, historia).
 * Al terminar se crea la cita con su admisión «planificada» en una sola transacción del servidor.
 */
const AppointmentForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleWizardComplete = async ({ patient, need, confirm, slot, plan }: WizardData) => {
    const cita = citaDataOf(patient.id, need, confirm);
    const name = `${patient.firstName} ${patient.lastName}`.trim();
    try {
      if (plan) {
        const { id, citas } = await createPlan({ cita, recurrencia: plan.recurrencia, sesiones: plan.sesiones });
        void queryClient.invalidateQueries({ queryKey: ["agenda"] });
        toast.success("Plan agendado", { description: `${name} · ${citas} sesiones` });
        navigate(`/app/planes/${id}`);
        return;
      }
      if (!slot) return;
      const { id } = await createCita({ ...cita, profesionalId: slot.profesionalId, inicio: slot.inicio, sedeId: slot.sedeId });
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Cita agendada", { description: `${name} · ${formatLongDay(slot.fecha)}, ${slot.hora} con ${slot.profesional}` });
      navigate(`/app/citas/${id}`);
    } catch (error) {
      void queryClient.invalidateQueries({ queryKey: ["agenda", "cupos"] });
      // Otra persona pudo tomar un cupo mientras tanto: el servidor lo dice y se elige otra hora.
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "No se pudo agendar.");
    }
  };

  return (
    <div className="-mx-6 -mt-4 flex h-full flex-col overflow-hidden">
      <AppointmentWizard onComplete={handleWizardComplete} />
    </div>
  );
};

export default AppointmentForm;
