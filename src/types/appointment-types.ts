// ========================
// COMPREHENSIVE APPOINTMENT MANAGEMENT TYPES
// ========================

// Appointment Types based on use cases
export type AppointmentType = 
  | 'first_time'          // Primera vez - extended time, medical history form
  | 'follow_up'           // Control/Seguimiento - standard duration
  | 'control'             // Control routine
  | 'emergency'           // Triaje - high priority
  | 'telemedicine'        // Virtual consultation
  | 'procedure'           // Procedimiento específico
  | 'multispecialty';     // Citas consecutivas multiespecialidad

export type AppointmentStatus = 
  | 'scheduled'           // Programada
  | 'confirmed'           // Confirmada
  | 'in_progress'         // En curso
  | 'completed'           // Completada
  | 'cancelled_patient'   // Cancelada por paciente
  | 'cancelled_provider'  // Cancelada por médico
  | 'rescheduled'         // Reprogramada
  | 'no_show'             // Inasistencia
  | 'waiting_list';       // En lista de espera

export type AppointmentModality = 'presential' | 'telemedicine';

export type AppointmentPriority = 'low' | 'normal' | 'high' | 'urgent';

// Main Appointment Interface
export interface AdvancedAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  
  // Scheduling
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  
  // Type & Status
  type: AppointmentType;
  status: AppointmentStatus;
  modality: AppointmentModality;
  priority: AppointmentPriority;
  
  // Clinical
  reason: string;
  specialty: string;
  diagnosis?: string;
  notes?: string;
  medicalHistoryFormRequired?: boolean;
  medicalHistoryFormId?: string;
  
  // Resources
  officeId?: string;
  officeName?: string;
  equipmentIds?: string[];
  equipmentNames?: string[];
  
  // External reference
  externalReferralId?: string;
  externalReferralUrgency?: 'routine' | 'priority' | 'urgent';
  
  // Tracking
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  googleEventId?: string;
  
  // Recurring
  isRecurring?: boolean;
  recurrenceId?: string;
  recurrenceIndex?: number;
  
  // History
  previousAppointmentId?: string;
  rescheduledFrom?: string;
  cancellationReason?: string;
  noShowMarkedAt?: Date;
}

// ========================
// DATE RANGE SCHEDULING
// ========================

export interface DateRangeScheduling {
  startDate: Date;
  endDate: Date;
  doctorId: string;
  selectedDays: number[]; // 0-6 (Sunday-Saturday)
  timeSlots: {
    startTime: string;
    endTime: string;
  }[];
  appointmentType: AppointmentType;
  duration: number;
}

// ========================
// RECURRING APPOINTMENTS
// ========================

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface RecurringAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  pattern: RecurrencePattern;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  excludedDates: Date[];
  appointmentTemplate: Partial<AdvancedAppointment>;
  generatedAppointmentIds: string[];
  createdAt: Date;
}

// ========================
// AVAILABILITY & BLOCKING
// ========================

export type BlockType = 
  | 'medical_leave'       // Incapacidad
  | 'vacation'            // Vacaciones
  | 'meeting'             // Reunión administrativa
  | 'maintenance'         // Mantenimiento
  | 'break'               // Descanso
  | 'training'            // Capacitación
  | 'personal'            // Personal
  | 'preventive';         // Bloqueo preventivo

export interface AvailabilityBlock {
  id: string;
  doctorId: string;
  doctorName: string;
  type: BlockType;
  startDate: Date;
  endDate: Date;
  startTime?: string; // If partial day
  endTime?: string;
  isFullDay: boolean;
  reason: string;
  affectedAppointmentIds: string[];
  reassignmentTriggered: boolean;
  createdAt: Date;
  createdBy: string;
}

// ========================
// WAITING LIST
// ========================

export interface WaitingListEntry {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  preferredDoctorId?: string;
  preferredDoctorName?: string;
  specialty: string;
  appointmentType: AppointmentType;
  preferredDays: number[];
  preferredTimeRange: {
    start: string;
    end: string;
  };
  dateRange: {
    start: Date;
    end: Date;
  };
  priority: AppointmentPriority;
  notes?: string;
  status: 'active' | 'contacted' | 'scheduled' | 'expired' | 'cancelled';
  notificationsSent: WaitingListNotification[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface WaitingListNotification {
  id: string;
  sentAt: Date;
  type: 'sms' | 'email' | 'push' | 'whatsapp';
  availableSlot: {
    date: Date;
    time: string;
    doctorName: string;
  };
  response?: 'accepted' | 'declined' | 'no_response';
  responseAt?: Date;
}

// ========================
// SHARED RESOURCES
// ========================

export type ResourceType = 'office' | 'equipment' | 'room';

export interface SharedResource {
  id: string;
  name: string;
  type: ResourceType;
  description?: string;
  location?: string;
  isAvailable: boolean;
  maintenanceSchedule?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  bookings: ResourceBooking[];
}

export interface ResourceBooking {
  id: string;
  resourceId: string;
  appointmentId: string;
  date: Date;
  startTime: string;
  endTime: string;
  bookedBy: string;
  bookedAt: Date;
}

// ========================
// OVERBOOKING / PREDICTION
// ========================

export interface OverbookingSlot {
  id: string;
  originalAppointmentId: string;
  overbookedAppointmentId: string;
  date: Date;
  time: string;
  doctorId: string;
  predictionConfidence: number; // 0-1 probability of no-show
  reason: string;
  status: 'pending' | 'utilized' | 'cancelled';
}

// ========================
// MODALITY CHANGE
// ========================

export interface ModalityChangeRequest {
  id: string;
  appointmentId: string;
  fromModality: AppointmentModality;
  toModality: AppointmentModality;
  requestedAt: Date;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  newOfficeId?: string;
  newOfficeName?: string;
  arrivalInstructions?: string;
  processedAt?: Date;
  processedBy?: string;
}

// ========================
// MULTISPECIALTY CHAIN
// ========================

export interface MultispecialtyChain {
  id: string;
  patientId: string;
  appointments: {
    appointmentId: string;
    specialty: string;
    doctorId: string;
    doctorName: string;
    order: number;
    transferTime: number; // minutes between appointments
  }[];
  totalDuration: number;
  startTime: string;
  date: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'partial';
}

// ========================
// REASSIGNMENT
// ========================

export interface MassReassignment {
  id: string;
  triggeredBy: string;
  triggerType: 'medical_leave' | 'vacation' | 'emergency' | 'manual';
  originalDoctorId: string;
  originalDoctorName: string;
  affectedAppointments: {
    appointmentId: string;
    patientId: string;
    patientName: string;
    originalDate: Date;
    originalTime: string;
    reassignmentStatus: 'pending' | 'reassigned' | 'cancelled' | 'patient_choice';
    newDoctorId?: string;
    newDoctorName?: string;
    newDate?: Date;
    newTime?: string;
  }[];
  createdAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'partial';
}

// ========================
// EXTERNAL REFERRAL
// ========================

export interface ExternalReferral {
  id: string;
  patientId: string;
  referringDoctorName: string;
  referringInstitution: string;
  referralDate: Date;
  specialty: string;
  diagnosis?: string;
  urgency: 'routine' | 'priority' | 'urgent';
  clinicalNotes?: string;
  attachmentUrls?: string[];
  status: 'received' | 'scheduled' | 'completed';
  linkedAppointmentId?: string;
  createdAt: Date;
}

// ========================
// NOTIFICATION TYPES
// ========================

export type NotificationType = 
  | 'appointment_reminder'
  | 'appointment_confirmation'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'waiting_list_slot'
  | 'no_show_warning'
  | 'modality_change'
  | 'doctor_unavailable';

export interface AppointmentNotification {
  id: string;
  type: NotificationType;
  recipientId: string;
  recipientType: 'patient' | 'doctor' | 'admin';
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'in_app';
  title: string;
  message: string;
  appointmentId?: string;
  sentAt?: Date;
  readAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, any>;
}

// ========================
// SCHEDULING SUMMARY
// ========================

export interface SchedulingSummary {
  date: Date;
  doctorId: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  blockedSlots: number;
  overbookedSlots: number;
  waitingListCount: number;
  noShowPrediction: number;
  utilizationRate: number;
}
