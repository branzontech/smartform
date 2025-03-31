
export interface Patient {
  id: string;
  name: string;
  documentId: string;
  dateOfBirth: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  contactNumber: string;
  email?: string;
  address?: string;
  createdAt: Date;
  lastVisitAt?: Date;
}

export interface MedicalConsultation {
  id: string;
  patientId: string;
  consultationDate: Date;
  reason: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUpDate?: Date;
  status: "Programada" | "En curso" | "Completada" | "Cancelada";
  formId?: string;
  formTitle?: string;
  recentlyUsedForms?: string[];
  formCompleted?: boolean;
  formCompletedAt?: string;
}

export type PatientWithConsultations = Patient & {
  consultations: MedicalConsultation[];
};

export interface PatientStatistics {
  totalPatients: number;
  newPatientsLastMonth: number;
  patientsByGender: {
    name: string;
    value: number;
  }[];
  consultationsScheduled: number;
  consultationsCompleted: number;
  consultationsCancelled: number;
  consultationsInProgress: number;
  topDiagnoses: {
    name: string;
    value: number;
  }[];
  consultationsByMonth: {
    name: string;
    scheduled: number;
    completed: number;
  }[];
  recurringPatients: {
    name: string;
    visits: number;
  }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  time: string;
  duration: number; // minutos
  reason: string;
  status: 'Programada' | 'Reprogramada' | 'Cancelada' | 'Completada' | 'Pendiente';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  googleEventId?: string; // ID del evento en Google Calendar
}

export type AppointmentWithPatient = Appointment & {
  patient: Patient;
};

export type AppointmentStatus = 'Programada' | 'Reprogramada' | 'Cancelada' | 'Completada' | 'Pendiente';

export type AppointmentView = 'day' | 'week' | 'month';

// Nuevos tipos para el seguimiento de pacientes
export interface FollowUp {
  id: string;
  patientId: string;
  consultationId: string;
  followUpDate: Date;
  reason: string;
  status: FollowUpStatus;
  notes?: string;
  createdAt: Date;
  reminderSent: boolean;
  reminderDate?: Date;
}

export type FollowUpStatus = 'Pendiente' | 'Completado' | 'Cancelado';

export interface PatientAlert {
  id: string;
  patientId: string;
  patientName: string;
  consultationId?: string;
  followUpId?: string;
  type: 'Seguimiento' | 'Medicación' | 'Examen' | 'General';
  message: string;
  dueDate: Date;
  status: 'Pendiente' | 'Completada' | 'Cancelada';
  priority: 'Alta' | 'Media' | 'Baja';
  createdAt: Date;
  dismissedAt?: Date;
}
