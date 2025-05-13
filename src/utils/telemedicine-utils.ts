
import { TelemedicineSession } from "@/types/telemedicine-types";

// Mock data - in a real implementation, this would be API calls
const MOCK_SESSIONS: TelemedicineSession[] = [
  {
    id: "1",
    patientId: "p1",
    patientName: "María Rodríguez",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-05-15",
    time: "10:00",
    status: "scheduled",
    specialty: "Cardiología",
    notes: "Revisión post operatoria",
  },
  {
    id: "2",
    patientId: "p2",
    patientName: "Juan Pérez",
    doctorId: "d2",
    doctorName: "Dra. Ana Martínez",
    date: "2025-05-13",
    time: "15:30",
    status: "ready",
    specialty: "Dermatología",
    notes: "Revisión de exámenes",
  },
  {
    id: "3",
    patientId: "p3",
    patientName: "Pedro López",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-05-14",
    time: "09:15",
    status: "scheduled",
    specialty: "Cardiología",
    notes: "Primera consulta",
  }
];

const MOCK_HISTORY: TelemedicineSession[] = [
  {
    id: "h1",
    patientId: "p1",
    patientName: "María Rodríguez",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-05-01",
    time: "10:00",
    status: "completed",
    specialty: "Cardiología",
    notes: "Paciente presenta mejora significativa en la presión arterial.",
    recordingUrl: "/recordings/session-h1.mp4",
    prescription: true,
    followUp: true,
  },
  {
    id: "h2",
    patientId: "p2",
    patientName: "Juan Pérez",
    doctorId: "d2",
    doctorName: "Dra. Ana Martínez",
    date: "2025-04-25",
    time: "15:30",
    status: "completed",
    specialty: "Dermatología",
    notes: "Se recomienda continuar tratamiento por 2 semanas más.",
    recordingUrl: "/recordings/session-h2.mp4",
    prescription: true,
    followUp: false,
  },
  {
    id: "h3",
    patientId: "p3",
    patientName: "Pedro López",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-04-20",
    time: "09:15",
    status: "cancelled",
    specialty: "Cardiología",
    notes: "El paciente canceló la cita.",
    recordingUrl: null,
    prescription: false,
    followUp: false,
  }
];

// Simulación de API para obtener sesiones programadas
export const getUpcomingSessions = async (): Promise<TelemedicineSession[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_SESSIONS);
    }, 500);
  });
};

// Simulación de API para obtener historial de sesiones
export const getSessionHistory = async (): Promise<TelemedicineSession[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_HISTORY);
    }, 500);
  });
};

// Simulación de API para crear una nueva sesión
export const createSession = async (sessionData: Omit<TelemedicineSession, 'id'>): Promise<TelemedicineSession> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSession = {
        ...sessionData,
        id: `new-${Date.now()}`,
      };
      resolve(newSession);
    }, 500);
  });
};

// Simulación de API para obtener detalles de una sesión
export const getSessionById = async (sessionId: string): Promise<TelemedicineSession | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const session = [...MOCK_SESSIONS, ...MOCK_HISTORY].find(s => s.id === sessionId);
      resolve(session);
    }, 500);
  });
};
