
import { nanoid } from "nanoid";
import { 
  Shift, 
  Professional, 
  ShiftAssignment, 
  UnavailabilityPeriod, 
  ShiftReassignment,
  WeekView,
  DayShifts,
  MonthlyShiftView,
  ShiftStatistics,
  TimeSlot
} from "@/types/shift-types";
import { getAllDoctors } from "./doctor-utils";

// Mock data de profesionales
const mockProfessionals: Professional[] = [
  {
    id: "prof-1",
    name: "Dr. Carlos Jiménez",
    specialty: "Cardiología",
    email: "carlos.jimenez@ejemplo.com",
    phone: "555-123-4567",
    isActive: true,
  },
  {
    id: "prof-2",
    name: "Dra. Laura Sánchez",
    specialty: "Pediatría",
    email: "laura.sanchez@ejemplo.com",
    phone: "555-987-6543",
    isActive: true,
  },
  {
    id: "prof-3",
    name: "Dr. Alejandro Martínez",
    specialty: "Traumatología",
    email: "alejandro.martinez@ejemplo.com",
    phone: "555-234-5678",
    isActive: true,
  },
];

// Horarios de trabajo estándar
const standardTimeSlots: TimeSlot[] = [
  { id: "slot-1", startTime: "08:00", endTime: "12:00", duration: 240 },
  { id: "slot-2", startTime: "14:00", endTime: "18:00", duration: 240 },
];

// Obtener todos los profesionales
export const getAllProfessionals = async (): Promise<Professional[]> => {
  try {
    // Intentar obtener de los médicos existentes primero
    const doctors = await getAllDoctors();
    const professionals = doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      email: doctor.email,
      phone: doctor.contactNumber,
      isActive: doctor.status === "Activo",
      profileImage: doctor.profileImage,
    }));
    
    if (professionals.length > 0) {
      return professionals;
    }
  } catch (error) {
    console.error("Error loading doctors as professionals:", error);
  }
  
  // Fallback a profesionales mock
  const storedProfessionals = localStorage.getItem("professionals");
  if (storedProfessionals) {
    try {
      return JSON.parse(storedProfessionals);
    } catch (error) {
      console.error("Error parsing professionals:", error);
    }
  }
  
  localStorage.setItem("professionals", JSON.stringify(mockProfessionals));
  return mockProfessionals;
};

// Obtener turnos de un mes específico
export const getShiftsByMonth = async (month: number, year: number): Promise<Shift[]> => {
  const storedShifts = localStorage.getItem("shifts");
  let shifts: Shift[] = [];
  
  if (storedShifts) {
    try {
      shifts = JSON.parse(storedShifts).map((shift: any) => ({
        ...shift,
        date: new Date(shift.date),
        createdAt: new Date(shift.createdAt),
        updatedAt: shift.updatedAt ? new Date(shift.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error("Error parsing shifts:", error);
      return [];
    }
  }
  
  return shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate.getMonth() === month && shiftDate.getFullYear() === year;
  });
};

// Crear vista mensual de turnos
export const createMonthlyShiftView = async (month: number, year: number): Promise<MonthlyShiftView> => {
  const shifts = await getShiftsByMonth(month, year);
  const professionals = await getAllProfessionals();
  
  // Crear fecha del primer día del mes
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Obtener el primer lunes de la vista (puede ser del mes anterior)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
  
  // Obtener el último domingo de la vista (puede ser del mes siguiente)
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
  
  const weeks: WeekView[] = [];
  let weekNumber = 1;
  
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const days: DayShifts[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(currentDate);
      const dayShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.toDateString() === dayDate.toDateString();
      });
      
      days.push({
        date: new Date(dayDate),
        dayName: dayDate.toLocaleDateString('es-ES', { weekday: 'short' }),
        shifts: dayShifts,
        isCurrentMonth: dayDate.getMonth() === month,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push({
      weekNumber,
      startDate: weekStart,
      endDate: weekEnd,
      days,
    });
    
    weekNumber++;
  }
  
  return {
    month,
    year,
    weeks,
    professionals,
  };
};

// Asignar turnos a un profesional
export const assignShifts = async (
  professionalId: string,
  dates: Date[],
  timeSlots: TimeSlot[]
): Promise<Shift[]> => {
  const professionals = await getAllProfessionals();
  const professional = professionals.find(p => p.id === professionalId);
  
  if (!professional) {
    throw new Error("Profesional no encontrado");
  }
  
  const newShifts: Shift[] = dates.map(date => ({
    id: `shift-${nanoid(8)}`,
    professionalId,
    professionalName: professional.name,
    date: new Date(date),
    timeSlots: timeSlots.map(slot => ({ ...slot, id: `slot-${nanoid(6)}` })),
    status: 'Asignado',
    createdAt: new Date(),
  }));
  
  // Guardar turnos
  const existingShifts = await getAllShifts();
  const updatedShifts = [...existingShifts, ...newShifts];
  localStorage.setItem("shifts", JSON.stringify(updatedShifts));
  
  return newShifts;
};

// Reasignar turno
export const reassignShift = async (
  shiftId: string,
  newProfessionalId: string,
  reason: string,
  isPartial: boolean = false,
  partialTimeSlots?: string[]
): Promise<Shift> => {
  const shifts = await getAllShifts();
  const professionals = await getAllProfessionals();
  
  const originalShift = shifts.find(s => s.id === shiftId);
  if (!originalShift) {
    throw new Error("Turno no encontrado");
  }
  
  const newProfessional = professionals.find(p => p.id === newProfessionalId);
  if (!newProfessional) {
    throw new Error("Profesional no encontrado");
  }
  
  let newShift: Shift;
  
  if (isPartial && partialTimeSlots) {
    // Reasignación parcial
    const reassignedSlots = originalShift.timeSlots.filter(slot => 
      partialTimeSlots.includes(slot.id)
    );
    
    newShift = {
      id: `shift-${nanoid(8)}`,
      professionalId: newProfessionalId,
      professionalName: newProfessional.name,
      date: originalShift.date,
      timeSlots: reassignedSlots,
      status: 'Reasignado',
      notes: `Reasignado parcialmente por: ${reason}`,
      createdAt: new Date(),
      originalShiftId: shiftId,
      reassignedFrom: originalShift.professionalId,
      isPartialReassignment: true,
    };
    
    // Actualizar turno original removiendo los slots reasignados
    originalShift.timeSlots = originalShift.timeSlots.filter(slot => 
      !partialTimeSlots.includes(slot.id)
    );
    originalShift.status = 'Reasignado';
    originalShift.updatedAt = new Date();
  } else {
    // Reasignación completa
    newShift = {
      ...originalShift,
      id: `shift-${nanoid(8)}`,
      professionalId: newProfessionalId,
      professionalName: newProfessional.name,
      status: 'Reasignado',
      notes: `Reasignado por: ${reason}`,
      createdAt: new Date(),
      originalShiftId: shiftId,
      reassignedFrom: originalShift.professionalId,
      isPartialReassignment: false,
    };
    
    // Marcar turno original como reasignado
    originalShift.status = 'Reasignado';
    originalShift.reassignedTo = newProfessionalId;
    originalShift.updatedAt = new Date();
  }
  
  // Actualizar lista de turnos
  const updatedShifts = shifts.map(s => s.id === shiftId ? originalShift : s);
  updatedShifts.push(newShift);
  
  localStorage.setItem("shifts", JSON.stringify(updatedShifts));
  
  // Registrar la reasignación
  const reassignment: ShiftReassignment = {
    id: `reassign-${nanoid(8)}`,
    originalShiftId: shiftId,
    originalProfessionalId: originalShift.professionalId,
    newProfessionalId,
    reassignmentDate: new Date(),
    reason,
    isPartial,
    partialTimeSlots,
    createdBy: "current-user", // TODO: obtener del contexto de usuario
    createdAt: new Date(),
  };
  
  await saveReassignment(reassignment);
  
  return newShift;
};

// Obtener todos los turnos
export const getAllShifts = async (): Promise<Shift[]> => {
  const storedShifts = localStorage.getItem("shifts");
  if (storedShifts) {
    try {
      return JSON.parse(storedShifts).map((shift: any) => ({
        ...shift,
        date: new Date(shift.date),
        createdAt: new Date(shift.createdAt),
        updatedAt: shift.updatedAt ? new Date(shift.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error("Error parsing shifts:", error);
    }
  }
  return [];
};

// Guardar reasignación
const saveReassignment = async (reassignment: ShiftReassignment): Promise<void> => {
  const storedReassignments = localStorage.getItem("shiftReassignments");
  let reassignments: ShiftReassignment[] = [];
  
  if (storedReassignments) {
    try {
      reassignments = JSON.parse(storedReassignments);
    } catch (error) {
      console.error("Error parsing reassignments:", error);
    }
  }
  
  reassignments.push(reassignment);
  localStorage.setItem("shiftReassignments", JSON.stringify(reassignments));
};

// Obtener estadísticas de turnos
export const getShiftStatistics = async (month: number, year: number): Promise<ShiftStatistics> => {
  const shifts = await getShiftsByMonth(month, year);
  const professionals = await getAllProfessionals();
  
  const totalShifts = shifts.length;
  const assignedShifts = shifts.filter(s => s.status === 'Asignado').length;
  const availableShifts = shifts.filter(s => s.status === 'Disponible').length;
  const unavailableShifts = shifts.filter(s => ['Incapacidad', 'Vacaciones'].includes(s.status)).length;
  const reassignedShifts = shifts.filter(s => s.status === 'Reasignado').length;
  
  const professionalUtilization = professionals.map(professional => {
    const profShifts = shifts.filter(s => s.professionalId === professional.id);
    const profAssignedShifts = profShifts.filter(s => s.status === 'Asignado').length;
    const utilizationPercentage = profShifts.length > 0 ? (profAssignedShifts / profShifts.length) * 100 : 0;
    
    return {
      professionalId: professional.id,
      professionalName: professional.name,
      totalShifts: profShifts.length,
      assignedShifts: profAssignedShifts,
      utilizationPercentage: Math.round(utilizationPercentage),
    };
  });
  
  return {
    totalShifts,
    assignedShifts,
    availableShifts,
    unavailableShifts,
    reassignedShifts,
    professionalUtilization,
  };
};

// Generar turnos automáticamente para un mes
export const generateMonthlyShifts = async (
  professionalId: string,
  month: number,
  year: number,
  workDays: number[] = [1, 2, 3, 4, 5], // Lunes a Viernes por defecto
  timeSlots: TimeSlot[] = standardTimeSlots
): Promise<Shift[]> => {
  const professional = (await getAllProfessionals()).find(p => p.id === professionalId);
  if (!professional) {
    throw new Error("Profesional no encontrado");
  }
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: Date[] = [];
  
  // Generar fechas de trabajo
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    if (workDays.includes(date.getDay())) {
      dates.push(date);
    }
  }
  
  return await assignShifts(professionalId, dates, timeSlots);
};
