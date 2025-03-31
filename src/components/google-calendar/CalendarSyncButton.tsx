
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Check } from "lucide-react";
import { toast } from "sonner";
import { 
  createGoogleCalendarEvent, 
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent
} from "@/utils/google-calendar";
import { Appointment } from "@/types/patient-types";

interface CalendarSyncButtonProps {
  appointment: Appointment;
  eventId?: string;
  onSync?: (eventId: string) => void;
  action: "create" | "update" | "delete";
}

export const CalendarSyncButton = ({ 
  appointment, 
  eventId, 
  onSync,
  action = "create"
}: CalendarSyncButtonProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(!!eventId);

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      // Calcular la fecha de fin en base a la duración
      const startDate = new Date(`${appointment.date.toISOString().split('T')[0]}T${appointment.time}`);
      const endDate = new Date(startDate.getTime() + appointment.duration * 60000);
      
      const appointmentData = {
        title: `Cita con ${appointment.patientName}`,
        description: `Motivo: ${appointment.reason}\n${appointment.notes ? `Notas: ${appointment.notes}` : ''}`,
        start: startDate,
        end: endDate
      };
      
      let result;
      switch (action) {
        case "create":
          result = await createGoogleCalendarEvent(appointmentData);
          if (result && result.id) {
            toast.success("Cita sincronizada con Google Calendar");
            setIsSynced(true);
            onSync?.(result.id);
          }
          break;
          
        case "update":
          if (!eventId) {
            toast.error("No se puede actualizar, ID de evento no disponible");
            break;
          }
          result = await updateGoogleCalendarEvent(eventId, appointmentData);
          if (result) {
            toast.success("Cita actualizada en Google Calendar");
          }
          break;
          
        case "delete":
          if (!eventId) {
            toast.error("No se puede eliminar, ID de evento no disponible");
            break;
          }
          await deleteGoogleCalendarEvent(eventId);
          toast.success("Cita eliminada de Google Calendar");
          setIsSynced(false);
          onSync?.("");
          break;
      }
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      toast.error("Error al sincronizar con Google Calendar");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isSynced && action !== "delete") {
    return (
      <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-600" disabled>
        <Check className="mr-1 h-4 w-4" /> Sincronizado
      </Button>
    );
  }
  
  const getButtonText = () => {
    switch (action) {
      case "create": return "Sincronizar con Google";
      case "update": return "Actualizar en Google";
      case "delete": return "Eliminar de Google";
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
    >
      {isSyncing ? (
        <span className="flex items-center">
          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-current"></div>
          Sincronizando...
        </span>
      ) : (
        <>
          <Calendar className="mr-1 h-4 w-4" />
          {getButtonText()}
        </>
      )}
    </Button>
  );
};

export default CalendarSyncButton;
