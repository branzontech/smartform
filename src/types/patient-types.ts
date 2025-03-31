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
}

export type AppointmentWithPatient = Appointment & {
  patient: Patient;
};

export type AppointmentStatus = 'Programada' | 'Reprogramada' | 'Cancelada' | 'Completada' | 'Pendiente';

export type AppointmentView = 'day' | 'week' | 'month';
