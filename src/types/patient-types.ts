
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
  doctorId?: string; // ID del médico asignado
  doctorName?: string; // Nombre del médico asignado
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

// Nuevos tipos para médicos y profesionales
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  documentId: string;
  licenseNumber: string;
  contactNumber: string;
  email: string;
  profileImage?: string;
  officeIds?: string[];
  bio?: string;
  createdAt: Date;
  status: 'Activo' | 'Inactivo' | 'Vacaciones';
  schedule?: WeeklySchedule;
  specialties?: string[];
}

export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isWorking: boolean;
  startTime?: string;
  endTime?: string;
  breaks?: TimeRange[];
}

export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface DoctorStatistics {
  totalPatients: number;
  activePatients: number;
  appointmentsCompleted: number;
  appointmentsScheduled: number;
  appointmentsCancelled: number;
  consultationsByMonth: {
    month: string;
    count: number;
  }[];
  satisfactionRate?: number;
}

export type DoctorWithPatients = Doctor & {
  assignedPatients: Patient[];
  upcomingAppointments: Appointment[];
}
