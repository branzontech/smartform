import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppointmentWizard, type WizardData } from "@/components/appointments/wizard";
import { createCita, formatLongDay } from "@/components/agenda/agenda-api";
import { ApiError } from "@/integrations/api/client";

/**
 * Nueva cita: paciente → qué necesita → cuándo y con quién → confirmar (convenio, servicio, historia).
 * Al terminar se crea la cita con su admisión «planificada» en una sola transacción del servidor.
 */
const AppointmentForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleWizardComplete = async ({ patient, need, slot, confirm }: WizardData) => {
    try {
      const { id } = await createCita({
        pacienteId: patient.id,
        profesionalId: slot.profesionalId,
        inicio: slot.inicio,
        duracionMin: need.duracionMin,
        modalidad: need.modalidad,
        sedeId: slot.sedeId,
        tipoCitaId: need.tipoCitaId,
        prioridad: need.prioridad,
        formaSolicitud: need.formaSolicitud,
        fechaDeseada: need.fechaDeseada,
        motivo: need.motivo.trim(),
        direccion: need.modalidad === "domicilio" ? need.direccion.trim() : null,
        enlaceTelemedicina: need.modalidad === "telemedicina" ? need.enlaceTelemedicina.trim() || null : null,
        contratoId: confirm.contratoId,
        servicioId: confirm.servicioId,
        formularioId: confirm.formularioId,
        instrucciones: confirm.instrucciones.trim() || null,
        notas: confirm.notas.trim() || null,
      });
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Cita agendada", {
        description: `${patient.firstName} ${patient.lastName} · ${formatLongDay(slot.fecha)}, ${slot.hora} con ${slot.profesional}`,
      });
      navigate(`/app/citas/${id}`);
    } catch (error) {
      void queryClient.invalidateQueries({ queryKey: ["agenda", "cupos"] });
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
