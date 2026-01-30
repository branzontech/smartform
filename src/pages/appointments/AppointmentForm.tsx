import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import { isUserSignedIn, createGoogleCalendarEvent, updateGoogleCalendarEvent } from "@/utils/google-calendar";
import { PatientPanel, ExtendedPatient } from "@/components/appointments/PatientPanel";
import { AppointmentScheduler } from "@/components/appointments/AppointmentScheduler";
import { Appointment } from "@/types/patient-types";

// Datos mock de pacientes extendidos
const mockExtendedPatients: ExtendedPatient[] = [
  {
    id: "1",
    firstName: "Juan",
    lastName: "Pérez García",
    documentId: "1234567890",
    dateOfBirth: "1985-05-15",
    gender: "Masculino",
    contactNumber: "555-123-4567",
    secondaryPhone: "555-111-2222",
    email: "juan.perez@example.com",
    regime: "Contributivo",
    address: "Calle Principal 123, Apt 4B",
    city: "Bogotá",
    state: "Cundinamarca",
    zone: "Urbana",
    occupation: "Ingeniero",
  },
  {
    id: "2",
    firstName: "María",
    lastName: "García López",
    documentId: "0987654321",
    dateOfBirth: "1990-08-20",
    gender: "Femenino",
    contactNumber: "555-987-6543",
    email: "maria.garcia@example.com",
    regime: "Subsidiado",
    address: "Avenida Central 456",
    city: "Medellín",
    state: "Antioquia",
    zone: "Urbana",
    occupation: "Docente",
    companion: {
      name: "Carlos García",
      relationship: "Esposo",
      phone: "555-333-4444"
    }
  },
  {
    id: "3",
    firstName: "Carlos",
    lastName: "Rodríguez Mendoza",
    documentId: "5678901234",
    dateOfBirth: "1978-12-03",
    gender: "Masculino",
    contactNumber: "555-456-7890",
    address: "Carrera 15 #45-67",
    city: "Cali",
    state: "Valle del Cauca",
    zone: "Urbana",
    regime: "Particular",
    occupation: "Comerciante",
  },
  {
    id: "4",
    firstName: "Ana",
    lastName: "Martínez Ruiz",
    documentId: "1357924680",
    dateOfBirth: "1995-03-25",
    gender: "Femenino",
    contactNumber: "555-789-0123",
    email: "ana.martinez@example.com",
    regime: "Contributivo",
    city: "Barranquilla",
    state: "Atlántico",
    zone: "Urbana",
    occupation: "Estudiante",
  },
  {
    id: "5",
    firstName: "Pedro",
    lastName: "Gómez Sánchez",
    documentId: "2468013579",
    dateOfBirth: "1982-11-10",
    gender: "Masculino",
    contactNumber: "555-321-6547",
    address: "Vereda El Carmen, Finca La Esperanza",
    city: "Tunja",
    state: "Boyacá",
    zone: "Rural",
    regime: "Subsidiado",
    occupation: "Agricultor",
  },
];

// Citas mock para mostrar en la agenda
const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientId: "1",
    patientName: "Juan Pérez García",
    date: new Date(),
    time: "09:00",
    duration: 30,
    reason: "Consulta de seguimiento",
    status: "Programada",
    notes: "Traer análisis recientes",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
  {
    id: "2",
    patientId: "2",
    patientName: "María García López",
    date: new Date(),
    time: "10:30",
    duration: 45,
    reason: "Control",
    status: "Programada",
    createdAt: new Date(),
  },
  {
    id: "3",
    patientId: "3",
    patientName: "Carlos Rodríguez",
    date: new Date(),
    time: "14:00",
    duration: 30,
    reason: "Primera vez",
    status: "Completada",
    createdAt: new Date(),
  },
];

const AppointmentForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Estado del panel de paciente
  const [patients, setPatients] = useState<ExtendedPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ExtendedPatient | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Estado de la cita
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);

  // Estado de Google Calendar
  const [googleEventId, setGoogleEventId] = useState<string | undefined>();
  const [syncWithGoogle, setSyncWithGoogle] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Cargar pacientes
      const savedPatients = localStorage.getItem("extendedPatients");
      if (savedPatients) {
        try {
          setPatients(JSON.parse(savedPatients));
        } catch (error) {
          console.error("Error parsing patients:", error);
          setPatients(mockExtendedPatients);
          localStorage.setItem("extendedPatients", JSON.stringify(mockExtendedPatients));
        }
      } else {
        setPatients(mockExtendedPatients);
        localStorage.setItem("extendedPatients", JSON.stringify(mockExtendedPatients));
      }

      // Cargar citas existentes
      const savedAppointments = localStorage.getItem("appointments");
      if (savedAppointments) {
        try {
          const parsed = JSON.parse(savedAppointments).map((app: any) => ({
            ...app,
            date: new Date(app.date),
            createdAt: new Date(app.createdAt),
          }));
          setExistingAppointments(parsed);
        } catch (error) {
          console.error("Error parsing appointments:", error);
          setExistingAppointments(mockAppointments);
        }
      } else {
        setExistingAppointments(mockAppointments);
      }

      // Si estamos editando, cargar la cita
      if (isEditing && id) {
        const appointments = JSON.parse(localStorage.getItem("appointments") || "[]");
        const appointmentToEdit = appointments.find((a: any) => a.id === id);
        
        if (appointmentToEdit) {
          setSelectedDate(new Date(appointmentToEdit.date));
          setSelectedTime(appointmentToEdit.time);
          setDuration(appointmentToEdit.duration);
          setReason(appointmentToEdit.reason);
          setNotes(appointmentToEdit.notes || "");
          
          if (appointmentToEdit.googleEventId) {
            setGoogleEventId(appointmentToEdit.googleEventId);
            setSyncWithGoogle(true);
          }

          // Buscar y seleccionar el paciente
          const patient = mockExtendedPatients.find(p => p.id === appointmentToEdit.patientId);
          if (patient) {
            setSelectedPatient(patient);
          }
        }
      }

      setLoading(false);
    };

    loadData();
  }, [isEditing, id]);

  // Verificar conexión con Google
  useEffect(() => {
    try {
      const connected = isUserSignedIn();
      setGoogleConnected(connected);
      if (connected) {
        const preferSync = localStorage.getItem('googleCalendarSync') === 'true';
        setSyncWithGoogle(preferSync);
      }
    } catch (error) {
      console.error("Error checking Google connection:", error);
    }
  }, []);

  // Manejar creación de paciente
  const handleCreatePatient = (patientData: Partial<ExtendedPatient>) => {
    const newPatient: ExtendedPatient = {
      id: Date.now().toString(),
      firstName: patientData.firstName || "",
      lastName: patientData.lastName || "",
      documentId: patientData.documentId || "",
      dateOfBirth: patientData.dateOfBirth || "",
      gender: patientData.gender || "Otro",
      contactNumber: patientData.contactNumber || "",
      secondaryPhone: patientData.secondaryPhone,
      email: patientData.email,
      regime: patientData.regime,
      address: patientData.address,
      city: patientData.city,
      state: patientData.state,
      province: patientData.province,
      zone: patientData.zone,
      occupation: patientData.occupation,
      companion: patientData.companion,
    };

    const updatedPatients = [...patients, newPatient];
    setPatients(updatedPatients);
    localStorage.setItem("extendedPatients", JSON.stringify(updatedPatients));
    setSelectedPatient(newPatient);
    toast.success("Paciente creado exitosamente");
  };

  // Sincronizar con Google Calendar
  const syncAppointmentWithGoogle = async (appointment: any): Promise<string | undefined> => {
    if (!syncWithGoogle || !googleConnected) return undefined;

    try {
      const startDate = new Date(`${format(appointment.date, "yyyy-MM-dd")}T${appointment.time}`);
      const endDate = new Date(startDate.getTime() + appointment.duration * 60000);

      const appointmentData = {
        title: `Cita con ${appointment.patientName}`,
        description: `Motivo: ${appointment.reason}\n${appointment.notes ? `Notas: ${appointment.notes}` : ''}`,
        start: startDate,
        end: endDate
      };

      if (isEditing && googleEventId) {
        await updateGoogleCalendarEvent(googleEventId, appointmentData);
        toast.success("Cita actualizada en Google Calendar");
        return googleEventId;
      } else {
        const result = await createGoogleCalendarEvent(appointmentData);
        if (result && result.id) {
          toast.success("Cita sincronizada con Google Calendar");
          return result.id;
        }
      }
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      toast.error("Error al sincronizar con Google Calendar");
    }

    return undefined;
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error("Por favor selecciona un paciente");
      return;
    }

    if (!selectedTime) {
      toast.error("Por favor selecciona un horario");
      return;
    }

    if (!reason) {
      toast.error("Por favor selecciona el motivo de la cita");
      return;
    }

    const newAppointment: any = {
      id: isEditing ? id : Date.now().toString(),
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      date: selectedDate,
      time: selectedTime,
      duration,
      reason,
      status: "Programada",
      notes,
      createdAt: isEditing ? new Date() : new Date(),
      updatedAt: isEditing ? new Date() : undefined,
      googleEventId,
    };

    // Sincronizar con Google Calendar
    if (syncWithGoogle && googleConnected) {
      const newEventId = await syncAppointmentWithGoogle(newAppointment);
      if (newEventId) {
        newAppointment.googleEventId = newEventId;
      }
    }

    // Guardar en localStorage
    const savedAppointments = localStorage.getItem("appointments");
    let appointmentsList: any[] = [];

    if (savedAppointments) {
      try {
        appointmentsList = JSON.parse(savedAppointments);
        if (isEditing) {
          appointmentsList = appointmentsList.map(app => 
            app.id === id ? newAppointment : app
          );
        } else {
          appointmentsList.push(newAppointment);
        }
      } catch (error) {
        appointmentsList = [newAppointment];
      }
    } else {
      appointmentsList = [newAppointment];
    }

    localStorage.setItem("appointments", JSON.stringify(appointmentsList));
    toast.success(isEditing ? "Cita actualizada con éxito" : "Cita creada con éxito");
    navigate("/app/citas");
  };

  // Transformar citas para el scheduler
  const schedulerAppointments = useMemo(() => {
    return existingAppointments.map(apt => ({
      id: apt.id,
      patientName: apt.patientName,
      time: apt.time,
      duration: apt.duration,
      reason: apt.reason,
      status: apt.status,
    }));
  }, [existingAppointments]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-muted rounded mb-6 mx-auto"></div>
            <div className="flex gap-4">
              <div className="h-96 w-80 bg-muted rounded-xl"></div>
              <div className="h-96 w-[600px] bg-muted rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Paciente */}
        <PatientPanel
          patients={patients}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          onCreatePatient={handleCreatePatient}
          isCollapsed={isPanelCollapsed}
          onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
        />

        {/* Panel derecho - Agenda */}
        <AppointmentScheduler
          existingAppointments={schedulerAppointments}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedTime={selectedTime}
          onTimeChange={setSelectedTime}
          duration={duration}
          onDurationChange={setDuration}
          reason={reason}
          onReasonChange={setReason}
          notes={notes}
          onNotesChange={setNotes}
          patientName={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : undefined}
          onSubmit={handleSubmit}
          isEditing={isEditing}
        />
      </main>
    </div>
  );
};

export default AppointmentForm;
