import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import { isUserSignedIn, createGoogleCalendarEvent, updateGoogleCalendarEvent } from "@/utils/google-calendar";
import { ExtendedPatient } from "@/components/appointments/PatientPanel";
import { AppointmentWizard, WizardData } from "@/components/appointments/wizard";

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
const mockAppointments = [
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

  const [patients, setPatients] = useState<ExtendedPatient[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
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

      setLoading(false);
    };

    loadData();
  }, [isEditing, id]);

  // Verificar conexión con Google
  useEffect(() => {
    try {
      const connected = isUserSignedIn();
      setGoogleConnected(connected);
    } catch (error) {
      console.error("Error checking Google connection:", error);
    }
  }, []);

  // Sincronizar con Google Calendar
  const syncAppointmentWithGoogle = async (appointment: any): Promise<string | undefined> => {
    const syncWithGoogle = localStorage.getItem('googleCalendarSync') === 'true';
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

      const result = await createGoogleCalendarEvent(appointmentData);
      if (result && result.id) {
        toast.success("Cita sincronizada con Google Calendar");
        return result.id;
      }
    } catch (error) {
      console.error("Error syncing with Google Calendar:", error);
      toast.error("Error al sincronizar con Google Calendar");
    }

    return undefined;
  };

  // Manejar finalización del wizard
  const handleWizardComplete = async (data: WizardData) => {
    if (!data.patient || !data.scheduling) {
      toast.error("Datos incompletos");
      return;
    }

    const { patient, admission, scheduling } = data;

    // Guardar nuevo paciente si fue creado
    const existingPatient = patients.find(p => p.id === patient.id);
    if (!existingPatient) {
      const updatedPatients = [...patients, patient];
      setPatients(updatedPatients);
      localStorage.setItem("extendedPatients", JSON.stringify(updatedPatients));
    }

    // Crear la cita
    const newAppointment: any = {
      id: Date.now().toString(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      date: scheduling.date,
      time: scheduling.time,
      duration: scheduling.duration,
      reason: scheduling.reason,
      status: "Programada",
      notes: scheduling.notes,
      createdAt: new Date(),
      admission: admission || undefined,
    };

    // Sincronizar con Google Calendar
    const googleEventId = await syncAppointmentWithGoogle(newAppointment);
    if (googleEventId) {
      newAppointment.googleEventId = googleEventId;
    }

    // Guardar en localStorage
    const savedAppointments = localStorage.getItem("appointments");
    let appointmentsList: any[] = [];

    if (savedAppointments) {
      try {
        appointmentsList = JSON.parse(savedAppointments);
        appointmentsList.push(newAppointment);
      } catch (error) {
        appointmentsList = [newAppointment];
      }
    } else {
      appointmentsList = [newAppointment];
    }

    localStorage.setItem("appointments", JSON.stringify(appointmentsList));
    
    toast.success("Cita creada con éxito", {
      description: `${patient.firstName} ${patient.lastName} - ${format(scheduling.date, "dd/MM/yyyy")} a las ${scheduling.time}`
    });
    
    navigate("/app/citas");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-16 w-16 bg-primary/20 rounded-3xl mb-6 mx-auto"></div>
            <div className="h-6 w-48 bg-muted rounded-xl mb-4 mx-auto"></div>
            <div className="h-4 w-64 bg-muted/50 rounded-lg mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden">
        <AppointmentWizard
          onComplete={handleWizardComplete}
          initialPatients={patients}
          existingAppointments={existingAppointments}
        />
      </main>
    </div>
  );
};

export default AppointmentForm;
