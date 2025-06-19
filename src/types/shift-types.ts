
export type ShiftStatus = 'Asignado' | 'Disponible' | 'Incapacidad' | 'Vacaciones' | 'Reasignado';

export type Professional = {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  isActive: boolean;
  profileImage?: string;
};

export type TimeSlot = {
  id: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  duration: number;  // minutes
};

export type Shift = {
  id: string;
  professionalId: string;
  professionalName: string;
  date: Date;
  timeSlots: TimeSlot[];
  status: ShiftStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  originalShiftId?: string; // Para turnos reasignados
  reassignedFrom?: string;   // ID del profesional original
  reassignedTo?: string;     // ID del profesional reasignado
  isPartialReassignment?: boolean;
};

export type ShiftAssignment = {
  professionalId: string;
  month: number;
  year: number;
  shifts: Shift[];
};

export type UnavailabilityPeriod = {
  id: string;
  professionalId: string;
  startDate: Date;
  endDate: Date;
  reason: 'Incapacidad' | 'Vacaciones' | 'Personal' | 'Otro';
  description?: string;
  affectedShifts: string[]; // IDs de turnos afectados
  createdAt: Date;
};

export type ShiftReassignment = {
  id: string;
  originalShiftId: string;
  originalProfessionalId: string;
  newProfessionalId: string;
  reassignmentDate: Date;
  reason: string;
  isPartial: boolean;
  partialTimeSlots?: string[]; // IDs de slots reasignados si es parcial
  createdBy: string;
  createdAt: Date;
};

export type WeekView = {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: DayShifts[];
};

export type DayShifts = {
  date: Date;
  dayName: string;
  shifts: Shift[];
  isCurrentMonth: boolean;
};

export type MonthlyShiftView = {
  month: number;
  year: number;
  weeks: WeekView[];
  professionals: Professional[];
};

export type ShiftStatistics = {
  totalShifts: number;
  assignedShifts: number;
  availableShifts: number;
  unavailableShifts: number;
  reassignedShifts: number;
  professionalUtilization: {
    professionalId: string;
    professionalName: string;
    totalShifts: number;
    assignedShifts: number;
    utilizationPercentage: number;
  }[];
};
