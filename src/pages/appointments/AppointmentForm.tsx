import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppointmentWizard, type WizardData } from "@/components/appointments/wizard";
import { createCita, formatLongDay } from "@/components/agenda/agenda-api";
import { ApiError } from "@/integrations/api/client";

/**
 * Nueva cita: paciente → datos del paciente → admisión (convenio, servicio, historia) → agenda.
 * Al terminar se crea la cita con su admisión «planificada» en una sola transacción del servidor.
 */
const AppointmentForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleWizardComplete = async ({ patient, admission, scheduling }: WizardData) => {
    if (!patient || !scheduling) {
      toast.error("Faltan datos de la cita.");
      return;
    }
    try {
      const { id } = await createCita({
        pacienteId: patient.id,
        profesionalId: scheduling.profesionalId,
        inicio: scheduling.inicio,
        duracionMin: scheduling.duracionMin,
        modalidad: scheduling.modalidad,
        sedeId: scheduling.sedeId,
        contratoId: admission?.contrato_id || null,
        servicioId: admission?.servicio_id || null,
        formularioId: admission?.formulario_id || null,
        motivo: admission?.motivo_consulta || null,
        notas: scheduling.notas || null,
        direccion: scheduling.direccion,
      });
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Cita agendada", {
        description: `${patient.firstName} ${patient.lastName} · ${formatLongDay(scheduling.fecha)}, ${scheduling.hora} con ${scheduling.profesional}`,
      });
      navigate(`/app/citas/${id}`);
    } catch (error) {
      // Otra persona pudo tomar el cupo mientras tanto: el servidor lo dice y se elige otra hora.
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "No se pudo agendar la cita.");
    }
  };

  return (
    <div className="-mx-6 -mt-4 flex h-full flex-col overflow-hidden">
      <AppointmentWizard onComplete={handleWizardComplete} />
    </div>
  );
};

export default AppointmentForm;
