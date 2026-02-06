import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, 
  addDays, 
  startOfWeek, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay, 
  isToday, 
  addWeeks, 
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameMonth,
  getDay,
  setMonth,
  isAfter,
  isBefore,
  isWithinInterval
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Check,
  X,
  RefreshCw,
  User,
  Stethoscope,
  FileText,
  Briefcase,
  Circle,
  AlertCircle,
  Search,
  UserSearch,
  CalendarPlus,
  Filter,
  Settings2,
  Layers,
  Ban,
  ListTodo,
  CalendarRange,
  Repeat,
  Maximize2,
  Minimize2,
  BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable";
import { AppointmentType, RecurrencePattern } from "@/types/appointment-types";
import {
  AppointmentTypeInline,
  AvailabilityBlockManager,
  WaitingListPanel,
  AppointmentActionsPanel,
  ResourceAvailabilityPanel,
  DoctorStatsDrawer,
  SchedulingSidebar
} from "../scheduling";

export interface SchedulingData {
  date: Date;
  endDate?: Date;
  time: string;
  duration: number;
  reason: string;
  notes: string;
  appointmentType?: AppointmentType;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  selectedDays?: number[];
  maxOccurrences?: number;
  resourceIds?: string[];
}

interface SchedulingStepProps {
  patient: ExtendedPatient;
  existingAppointments: any[];
  onComplete: (data: SchedulingData) => void;
  onBack: () => void;
  onChangePatient?: () => void;
  onNewAppointment?: () => void;
}

type ViewMode = "day" | "week" | "month" | "year";
type TimeAssignmentMode = "fixed" | "per_day" | "first_available" | "time_window";

interface RangeConflict {
  date: Date;
  reason: "no_working" | "fully_occupied" | "partial";
  availableSlots: number;
  totalSlots: number;
  suggestedAlternative?: Date;
}

interface RangeDaySchedule {
  date: Date;
  selectedTime: string;
  isConflict: boolean;
  availableSlots: string[];
}

type DaySchedule = { working: true; start: string; end: string } | { working: false };

interface DoctorSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface DoctorWithSchedule {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  avatar: string;
  schedule: DoctorSchedule;
  occupiedSlots: Record<string, string[]>;
}

// Extended mock data for doctors with their schedules
const mockDoctorsWithSchedule: DoctorWithSchedule[] = [
  { 
    id: "1", 
    name: "Dr. Carlos Jiménez",
    specialty: "Cardiología", 
    available: true,
    avatar: "CJ",
    schedule: {
      monday: { working: true, start: "08:00", end: "16:00" },
      tuesday: { working: true, start: "08:00", end: "16:00" },
      wednesday: { working: true, start: "08:00", end: "14:00" },
      thursday: { working: true, start: "08:00", end: "16:00" },
      friday: { working: true, start: "08:00", end: "12:00" },
      saturday: { working: false },
      sunday: { working: false },
    },
    // Occupied slots by date (format: "YYYY-MM-DD": ["HH:MM", ...])
    occupiedSlots: {
      [format(new Date(), "yyyy-MM-dd")]: ["09:00", "09:30", "10:00", "14:00", "14:30"],
      [format(addDays(new Date(), 1), "yyyy-MM-dd")]: ["08:00", "08:30", "11:00"],
      [format(addDays(new Date(), 2), "yyyy-MM-dd")]: ["10:00", "10:30", "11:00", "11:30"],
    }
  },
  { 
    id: "2", 
    name: "Dra. Laura Sánchez", 
    specialty: "Pediatría", 
    available: true,
    avatar: "LS",
    schedule: {
      monday: { working: true, start: "09:00", end: "17:00" },
      tuesday: { working: true, start: "09:00", end: "17:00" },
      wednesday: { working: true, start: "09:00", end: "17:00" },
      thursday: { working: true, start: "09:00", end: "17:00" },
      friday: { working: true, start: "09:00", end: "15:00" },
      saturday: { working: true, start: "09:00", end: "12:00" },
      sunday: { working: false },
    },
    occupiedSlots: {
      [format(new Date(), "yyyy-MM-dd")]: ["09:00", "09:30", "12:00", "15:00", "15:30", "16:00"],
      [format(addDays(new Date(), 1), "yyyy-MM-dd")]: ["10:00", "10:30", "14:00", "14:30"],
    }
  },
  { 
    id: "3", 
    name: "Dr. Alejandro Martínez", 
    specialty: "Traumatología", 
    available: false,
    avatar: "AM",
    schedule: {
      monday: { working: true, start: "07:00", end: "15:00" },
      tuesday: { working: true, start: "07:00", end: "15:00" },
      wednesday: { working: false },
      thursday: { working: true, start: "07:00", end: "15:00" },
      friday: { working: true, start: "07:00", end: "13:00" },
      saturday: { working: false },
      sunday: { working: false },
    },
    occupiedSlots: {}
  },
  { 
    id: "4", 
    name: "Dra. María González", 
    specialty: "Dermatología", 
    available: true,
    avatar: "MG",
    schedule: {
      monday: { working: true, start: "10:00", end: "18:00" },
      tuesday: { working: true, start: "10:00", end: "18:00" },
      wednesday: { working: true, start: "10:00", end: "18:00" },
      thursday: { working: false },
      friday: { working: true, start: "10:00", end: "16:00" },
      saturday: { working: false },
      sunday: { working: false },
    },
    occupiedSlots: {
      [format(new Date(), "yyyy-MM-dd")]: ["10:00", "10:30", "11:00", "14:00"],
      [format(addDays(new Date(), 3), "yyyy-MM-dd")]: ["12:00", "12:30", "15:00", "15:30", "16:00"],
    }
  },
];

const services = [
  { id: "1", name: "Consulta General", duration: 30 },
  { id: "2", name: "Examen Completo", duration: 60 },
  { id: "3", name: "Control", duration: 15 },
  { id: "4", name: "Procedimiento Menor", duration: 45 },
];

const durations = [
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
  { value: 45, label: "45m" },
  { value: 60, label: "1h" },
  { value: 90, label: "1.5h" },
  { value: 120, label: "2h" }
];

const months = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

// Generate time slots from start to end time
const generateTimeSlots = (start: string, end: string): string[] => {
  const slots: string[] = [];
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(`${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`);
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }
  
  return slots;
};

export const SchedulingStep: React.FC<SchedulingStepProps> = ({
  patient,
  existingAppointments,
  onComplete,
  onBack,
  onChangePatient,
  onNewAppointment
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  
  // New states for advanced scheduling
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("control");
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | undefined>();
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [maxOccurrences, setMaxOccurrences] = useState(10);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("scheduling");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDoctorStatsOpen, setIsDoctorStatsOpen] = useState(false);
  
  // Range scheduling states
  const [timeAssignmentMode, setTimeAssignmentMode] = useState<TimeAssignmentMode>("fixed");
  const [rangeTimeWindow, setRangeTimeWindow] = useState<{ start: string; end: string }>({ start: "08:00", end: "12:00" });
  const [rangeDaySchedules, setRangeDaySchedules] = useState<RangeDaySchedule[]>([]);
  const [showConflictPanel, setShowConflictPanel] = useState(false);

  // Get unique specialties for filter
  const specialties = useMemo(() => {
    const specs = [...new Set(mockDoctorsWithSchedule.map(d => d.specialty))];
    return specs;
  }, []);

  // Filter doctors by search and specialty
  const filteredDoctors = useMemo(() => {
    return mockDoctorsWithSchedule.filter(doc => {
      const matchesSearch = searchQuery === "" || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialty = specialtyFilter === "all" || doc.specialty === specialtyFilter;
      
      return matchesSearch && matchesSpecialty;
    });
  }, [searchQuery, specialtyFilter]);

  const selectedDoctorData = useMemo(() => {
    return mockDoctorsWithSchedule.find(d => d.id === selectedDoctor);
  }, [selectedDoctor]);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const startDay = getDay(start);
    const paddingStart = startDay === 0 ? 6 : startDay - 1;
    const paddingDays = Array.from({ length: paddingStart }, (_, i) => 
      addDays(start, -(paddingStart - i))
    );
    return [...paddingDays, ...days];
  }, [currentDate]);

  // Get doctor's working status for a specific day
  const getDoctorDayStatus = (doctor: typeof mockDoctorsWithSchedule[0], date: Date) => {
    const dayName = dayNames[date.getDay()];
    const schedule = doctor.schedule[dayName];
    return schedule;
  };

  // Get available time slots for selected doctor on selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctorData) return [];
    
    const daySchedule = getDoctorDayStatus(selectedDoctorData, selectedDate);
    if (!daySchedule || !daySchedule.working) return [];
    
    const allSlots = generateTimeSlots(daySchedule.start as string, daySchedule.end as string);
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const occupied = selectedDoctorData.occupiedSlots[dateKey] || [];
    
    return allSlots.map(slot => ({
      time: slot,
      available: !occupied.includes(slot)
    }));
  }, [selectedDoctorData, selectedDate]);

  // Check if doctor works on a specific day
  const isDoctorWorkingOnDay = (date: Date) => {
    if (!selectedDoctorData) return false;
    const daySchedule = getDoctorDayStatus(selectedDoctorData, date);
    return daySchedule?.working || false;
  };

  // Get occupancy level for a day
  const getDayOccupancy = (date: Date) => {
    if (!selectedDoctorData) return "none";
    const daySchedule = getDoctorDayStatus(selectedDoctorData, date);
    if (!daySchedule || !daySchedule.working) return "none";
    
    const allSlots = generateTimeSlots(daySchedule.start as string, daySchedule.end as string);
    const dateKey = format(date, "yyyy-MM-dd");
    const occupied = selectedDoctorData.occupiedSlots[dateKey] || [];
    
    const occupancyRate = occupied.length / allSlots.length;
    if (occupancyRate === 0) return "free";
    if (occupancyRate < 0.5) return "low";
    if (occupancyRate < 0.8) return "medium";
    return "high";
  };

  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  };

  const handleNavigate = (direction: "prev" | "next") => {
    const modifier = direction === "prev" ? -1 : 1;
    switch (viewMode) {
      case "day":
        setCurrentDate(addDays(currentDate, modifier));
        setSelectedDate(addDays(currentDate, modifier));
        break;
      case "week":
        setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        break;
      case "year":
        setCurrentDate(direction === "prev" ? subYears(currentDate, 1) : addYears(currentDate, 1));
        break;
    }
  };

  const handleSelectDate = (date: Date) => {
    if (isRangeMode) {
      // Range mode: first click = start, second click = end
      if (!endDate && selectedDate && isAfter(date, selectedDate)) {
        // Set end date
        setEndDate(date);
      } else {
        // Set start date (reset end date)
        setSelectedDate(date);
        setCurrentDate(date);
        setEndDate(null);
      }
      setSelectedTime(""); // Reset time when date changes
    } else {
      setSelectedDate(date);
      setCurrentDate(date);
      setSelectedTime(""); // Reset time when date changes
      if (viewMode === "year") {
        setViewMode("month");
      } else if (viewMode === "month" || viewMode === "week") {
        setViewMode("day");
      }
    }
  };

  // Check if a date is within the selected range
  const isDateInRange = (date: Date) => {
    if (!isRangeMode || !endDate) return false;
    return isWithinInterval(date, { start: selectedDate, end: endDate });
  };

  // Calculate occurrences for range mode
  // Analyze range for conflicts and available slots
  const rangeAnalysis = useMemo(() => {
    if (!isRangeMode || !endDate || !selectedDoctorData) return { conflicts: [], validDays: [], totalDays: 0 };
    
    const days = eachDayOfInterval({ start: selectedDate, end: endDate });
    const conflicts: RangeConflict[] = [];
    const validDays: Date[] = [];
    
    days.forEach(day => {
      const dayOfWeek = day.getDay();
      if (!selectedDays.includes(dayOfWeek)) return;
      
      // Check recurrence pattern
      let shouldInclude = false;
      switch (recurrencePattern) {
        case "daily":
          shouldInclude = true;
          break;
        case "weekly":
          shouldInclude = dayOfWeek === selectedDays[0];
          break;
        case "biweekly":
          const weekDiff = Math.floor((day.getTime() - selectedDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          shouldInclude = weekDiff % 2 === 0 && dayOfWeek === selectedDays[0];
          break;
        case "monthly":
          shouldInclude = day.getDate() === selectedDate.getDate();
          break;
        default:
          shouldInclude = true;
      }
      
      if (!shouldInclude) return;
      
      const daySchedule = getDoctorDayStatus(selectedDoctorData, day);
      
      if (!daySchedule?.working) {
        // Find nearest working day as alternative
        let alternative: Date | undefined;
        for (let i = 1; i <= 3; i++) {
          const nextDay = addDays(day, i);
          const prevDay = addDays(day, -i);
          const nextSchedule = getDoctorDayStatus(selectedDoctorData, nextDay);
          const prevSchedule = getDoctorDayStatus(selectedDoctorData, prevDay);
          if (nextSchedule?.working && isAfter(nextDay, selectedDate) && (!endDate || isBefore(nextDay, addDays(endDate, 1)))) {
            alternative = nextDay;
            break;
          }
          if (prevSchedule?.working && isAfter(prevDay, selectedDate)) {
            alternative = prevDay;
            break;
          }
        }
        
        conflicts.push({
          date: day,
          reason: "no_working",
          availableSlots: 0,
          totalSlots: 0,
          suggestedAlternative: alternative
        });
        return;
      }
      
      const allSlots = generateTimeSlots(daySchedule.start as string, daySchedule.end as string);
      const dateKey = format(day, "yyyy-MM-dd");
      const occupied = selectedDoctorData.occupiedSlots[dateKey] || [];
      const availableCount = allSlots.filter(s => !occupied.includes(s)).length;
      
      if (availableCount === 0) {
        conflicts.push({
          date: day,
          reason: "fully_occupied",
          availableSlots: 0,
          totalSlots: allSlots.length
        });
      } else if (availableCount < allSlots.length * 0.3) {
        conflicts.push({
          date: day,
          reason: "partial",
          availableSlots: availableCount,
          totalSlots: allSlots.length
        });
        validDays.push(day);
      } else {
        validDays.push(day);
      }
    });
    
    return { conflicts, validDays, totalDays: validDays.length + conflicts.length };
  }, [isRangeMode, endDate, selectedDoctorData, selectedDate, selectedDays, recurrencePattern]);

  const rangeOccurrences = useMemo(() => {
    if (!isRangeMode || !endDate || !recurrencePattern) return 0;
    
    const days = eachDayOfInterval({ start: selectedDate, end: endDate });
    let count = 0;
    
    days.forEach(day => {
      const dayOfWeek = day.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        switch (recurrencePattern) {
          case "daily":
            count++;
            break;
          case "weekly":
            if (dayOfWeek === selectedDays[0]) count++;
            break;
          case "biweekly":
            const weekDiff = Math.floor((day.getTime() - selectedDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            if (weekDiff % 2 === 0 && dayOfWeek === selectedDays[0]) count++;
            break;
          case "monthly":
            if (day.getDate() === selectedDate.getDate()) count++;
            break;
        }
      }
    });
    
    return Math.min(count, maxOccurrences);
  }, [isRangeMode, endDate, recurrencePattern, selectedDate, selectedDays, maxOccurrences]);

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentDate(setMonth(currentDate, monthIndex));
    setViewMode("month");
  };

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setSelectedTime(""); // Reset time when doctor changes
  };

  const handleAppointmentTypeSelect = (type: AppointmentType, defaultDuration: number) => {
    setAppointmentType(type);
    setDuration(defaultDuration);
    // Set reason based on appointment type
    if (type === "first_time") setReason("Primera vez");
    else if (type === "follow_up") setReason("Seguimiento");
    else if (type === "control") setReason("Control");
    else if (type === "emergency") setReason("Urgencia");
    else if (type === "telemedicine") setReason("Telemedicina");
    else if (type === "procedure") setReason("Procedimiento");
    else if (type === "multispecialty") setReason("Multiespecialidad");
  };

  const handleResourceToggle = (resourceId: string) => {
    setSelectedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSubmit = () => {
    onComplete({
      date: selectedDate,
      endDate: isRangeMode ? endDate || undefined : undefined,
      time: selectedTime,
      duration,
      reason,
      notes,
      appointmentType,
      isRecurring: isRangeMode,
      recurrencePattern: isRangeMode ? recurrencePattern : undefined,
      selectedDays: isRangeMode ? selectedDays : undefined,
      maxOccurrences: isRangeMode ? maxOccurrences : undefined,
      resourceIds: selectedResources.length > 0 ? selectedResources : undefined
    });
  };

  // Enhanced validation for range mode
  const isRangeComplete = useMemo(() => {
    if (!isRangeMode || !endDate) return true;
    
    switch (timeAssignmentMode) {
      case "fixed":
        return !!selectedTime;
      case "per_day":
        return rangeDaySchedules.length > 0 && rangeDaySchedules.every(d => d.selectedTime);
      case "first_available":
      case "time_window":
        return true; // Auto-assigned
      default:
        return !!selectedTime;
    }
  }, [isRangeMode, endDate, timeAssignmentMode, selectedTime, rangeDaySchedules]);

  const canSubmit = selectedDoctor && reason && (isRangeMode ? (endDate && isRangeComplete) : selectedTime);

  // Dynamic progress steps
  const progressSteps = useMemo(() => {
    const steps = [
      {
        id: "doctor",
        label: "Profesional",
        description: selectedDoctorData ? selectedDoctorData.name : "Selecciona un profesional",
        completed: !!selectedDoctor,
        icon: Stethoscope,
      },
      {
        id: "date",
        label: isRangeMode ? "Rango de fechas" : "Fecha",
        description: isRangeMode 
          ? (endDate ? `${format(selectedDate, "dd/MM")} - ${format(endDate, "dd/MM")}` : "Selecciona inicio y fin")
          : format(selectedDate, "EEE d MMM", { locale: es }),
        completed: isRangeMode ? !!endDate : true, // Single date is always selected
        icon: CalendarIcon,
      },
      {
        id: "time",
        label: "Horario",
        description: isRangeMode 
          ? (isRangeComplete ? `Modo: ${timeAssignmentMode === "fixed" ? "Fijo" : timeAssignmentMode === "per_day" ? "Por día" : timeAssignmentMode === "first_available" ? "Auto" : "Ventana"}` : "Configura los horarios")
          : (selectedTime ? `${selectedTime} - ${getEndTime(selectedTime, duration)}` : "Selecciona un horario"),
        completed: isRangeMode ? isRangeComplete : !!selectedTime,
        icon: Clock,
      },
      {
        id: "reason",
        label: "Motivo",
        description: reason || "Escribe el motivo de la cita",
        completed: !!reason,
        icon: FileText,
      },
    ];
    return steps;
  }, [selectedDoctor, selectedDoctorData, selectedDate, endDate, isRangeMode, selectedTime, duration, reason, timeAssignmentMode, isRangeComplete]);

  const completedSteps = progressSteps.filter(s => s.completed).length;
  const nextIncompleteStep = progressSteps.find(s => !s.completed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "transition-all duration-300",
        isFullscreen 
          ? "fixed inset-0 z-50 bg-background" 
          : "h-[calc(100vh-180px)] min-h-[500px]"
      )}
    >
      {/* Fullscreen Header */}
      {isFullscreen && (
        <div className="h-12 px-4 flex items-center justify-between border-b border-border/30 bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium">{patient.firstName} {patient.lastName} • Agendamiento</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {selectedDoctorData && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDoctorStatsOpen(true)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <ResizablePanelGroup 
        direction="horizontal" 
        className={cn(
          "rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl overflow-hidden",
          isFullscreen ? "h-[calc(100vh-56px)] rounded-none border-0" : "h-full"
        )}
      >
        {/* Left Panel - Control Panel (30%) */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <SchedulingSidebar
            patient={patient}
            doctors={mockDoctorsWithSchedule as any}
            selectedDoctorId={selectedDoctor}
            selectedDoctorData={selectedDoctorData as any}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            duration={duration}
            reason={reason}
            notes={notes}
            appointmentType={appointmentType}
            isRangeMode={isRangeMode}
            endDate={endDate}
            recurrencePattern={recurrencePattern}
            selectedResources={selectedResources}
            canSubmit={!!canSubmit}
            availableTimeSlots={availableTimeSlots}
            timeAssignmentMode={timeAssignmentMode}
            rangeTimeWindow={rangeTimeWindow}
            onTimeAssignmentModeChange={setTimeAssignmentMode}
            onRangeTimeWindowChange={setRangeTimeWindow}
            onDoctorSelect={handleDoctorSelect}
            onAppointmentTypeSelect={handleAppointmentTypeSelect}
            onDurationChange={setDuration}
            onTimeSelect={setSelectedTime}
            onReasonChange={setReason}
            onNotesChange={setNotes}
            onResourceToggle={handleResourceToggle}
            onSubmit={handleSubmit}
            onChangePatient={onChangePatient}
            onNewAppointment={onNewAppointment}
            onBack={onBack}
            onOpenDoctorStats={() => setIsDoctorStatsOpen(true)}
            isFullscreen={isFullscreen}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Calendar (70%) */}
        <ResizablePanel defaultSize={70} minSize={50} className="overflow-hidden">
          <div className="h-full flex flex-col overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b border-border/20 space-y-3">
              <div className="flex items-center justify-between">
                {/* View Mode Tabs */}
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl">
                  {(["day", "week", "month", "year"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        viewMode === mode
                          ? "bg-background shadow-sm"
                          : "hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {mode === "day" ? "Día" : mode === "week" ? "Semana" : mode === "month" ? "Mes" : "Año"}
                    </button>
                  ))}
                </div>

                {/* Navigation + Fullscreen */}
                <div className="flex items-center gap-2">
                  {!isFullscreen && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsFullscreen(true)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleNavigate("prev")}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center capitalize">
                    {viewMode === "day" && format(currentDate, "d MMMM", { locale: es })}
                    {viewMode === "week" && `${format(weekStart, "d")} - ${format(addDays(weekStart, 6), "d MMM", { locale: es })}`}
                    {viewMode === "month" && format(currentDate, "MMMM yyyy", { locale: es })}
                    {viewMode === "year" && format(currentDate, "yyyy")}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleNavigate("next")}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Range Mode Toggle & Today Button */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all",
                    isRangeMode ? "bg-lime/20 border border-lime/30" : "bg-muted/30"
                  )}>
                    <CalendarRange className={cn("w-4 h-4", isRangeMode ? "text-lime-foreground" : "text-muted-foreground")} />
                    <span className="text-xs font-medium">Rango</span>
                    <Switch
                      checked={isRangeMode}
                      onCheckedChange={(checked) => {
                        setIsRangeMode(checked);
                        if (!checked) setEndDate(null);
                      }}
                      className="scale-75"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setCurrentDate(new Date());
                      setSelectedDate(new Date());
                      setEndDate(null);
                    }}
                    className="h-8 rounded-lg text-xs"
                  >
                    Hoy
                  </Button>
                </div>
              </div>

              {/* Range Mode Options - Inline */}
              {isRangeMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/20"
                >
                  {/* Selected Range Display */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30">
                    <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs">
                      {format(selectedDate, "dd MMM", { locale: es })}
                      {endDate && (
                        <> → {format(endDate, "dd MMM", { locale: es })}</>
                      )}
                      {!endDate && <span className="text-muted-foreground"> (selecciona fin)</span>}
                    </span>
                  </div>

                  {/* Recurrence Pattern */}
                  <Select 
                    value={recurrencePattern} 
                    onValueChange={(v) => setRecurrencePattern(v as RecurrencePattern)}
                  >
                    <SelectTrigger className="h-8 w-[140px] rounded-xl text-xs">
                      <Repeat className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Patrón" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quincenal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Day Selection */}
                  <div className="flex items-center gap-1">
                    {[
                      { value: 1, label: "L" },
                      { value: 2, label: "M" },
                      { value: 3, label: "X" },
                      { value: 4, label: "J" },
                      { value: 5, label: "V" },
                      { value: 6, label: "S" },
                      { value: 0, label: "D" },
                    ].map((day) => (
                      <button
                        key={day.value}
                        onClick={() => {
                          if (selectedDays.includes(day.value)) {
                            setSelectedDays(selectedDays.filter(d => d !== day.value));
                          } else {
                            setSelectedDays([...selectedDays, day.value].sort());
                          }
                        }}
                        className={cn(
                          "w-7 h-7 rounded-lg text-[10px] font-medium transition-all",
                          selectedDays.includes(day.value)
                            ? "bg-lime text-lime-foreground"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>

                  {/* Max Occurrences */}
                  <Select value={maxOccurrences.toString()} onValueChange={(v) => setMaxOccurrences(parseInt(v))}>
                    <SelectTrigger className="h-8 w-[90px] rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 30].map(n => (
                        <SelectItem key={n} value={n.toString()}>Máx {n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Summary Badge */}
                  {recurrencePattern && endDate && (
                    <Badge className="bg-lime text-lime-foreground">
                      {rangeOccurrences} cita{rangeOccurrences !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>

            {/* Legend - Subtle inline below header */}
            {selectedDoctor && (
              <div className="px-4 py-2 border-b border-border/10 flex items-center justify-center gap-6 bg-muted/5">
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2.5 h-2.5 fill-lime text-lime" />
                  <span className="text-[10px] text-muted-foreground">Libre</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                  <span className="text-[10px] text-muted-foreground">Parcial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                  <span className="text-[10px] text-muted-foreground">Ocupado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2.5 h-2.5 fill-muted text-muted" />
                  <span className="text-[10px] text-muted-foreground">No trabaja</span>
                </div>
              </div>
            )}

            {/* Calendar Content */}
            <ScrollArea className="flex-1 h-0 min-h-0">
              <div className="p-4">
              {!selectedDoctor ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                    <Stethoscope className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Seleccione un profesional</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Para ver la disponibilidad del calendario, primero seleccione un médico o profesional de la salud.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewMode + currentDate.toISOString() + selectedDoctor}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    {/* Day View - Show Time Slots */}
                    {viewMode === "day" && (
                      <div className="h-full">
                        <div className="text-center mb-6">
                          <p className="text-5xl font-bold text-primary mb-1">
                            {format(currentDate, "d")}
                          </p>
                          <p className="text-lg capitalize text-muted-foreground">
                            {format(currentDate, "EEEE", { locale: es })}
                          </p>
                          <p className="text-sm text-muted-foreground/60 capitalize">
                            {format(currentDate, "MMMM yyyy", { locale: es })}
                          </p>
                        </div>
                        
                        {!isDoctorWorkingOnDay(selectedDate) ? (
                          <div className="flex flex-col items-center justify-center py-8">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                              {selectedDoctorData?.name} no trabaja este día
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {availableTimeSlots.map((slot) => (
                              <motion.button
                                key={slot.time}
                                onClick={() => slot.available && setSelectedTime(slot.time)}
                                disabled={!slot.available}
                                whileHover={slot.available ? { scale: 1.05 } : {}}
                                whileTap={slot.available ? { scale: 0.95 } : {}}
                                className={cn(
                                  "py-3 px-2 rounded-xl text-sm font-medium transition-all",
                                  !slot.available
                                    ? "bg-orange-500/20 text-orange-600 cursor-not-allowed"
                                    : selectedTime === slot.time
                                    ? "bg-lime text-lime-foreground shadow-lg ring-2 ring-lime/50"
                                    : "bg-lime/20 text-lime-foreground hover:bg-lime/30"
                                )}
                              >
                                {slot.time}
                              </motion.button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Week View */}
                    {viewMode === "week" && (
                      <div className="relative">
                        {/* Range connector bar - positioned behind the grid */}
                        {isRangeMode && endDate && (() => {
                          const startIdx = weekDays.findIndex(d => isSameDay(d, selectedDate));
                          const endIdx = weekDays.findIndex(d => isSameDay(d, endDate));
                          
                          if (startIdx >= 0 && endIdx >= 0 && startIdx <= endIdx) {
                            const leftPercent = (startIdx / 7) * 100 + (100 / 14);
                            const widthPercent = ((endIdx - startIdx) / 7) * 100;
                            
                            return (
                              <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                className="absolute top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-lime via-lime/60 to-primary rounded-full z-0"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                }}
                              />
                            );
                          }
                          return null;
                        })()}
                        
                        <div className="grid grid-cols-7 gap-2 h-full relative z-10">
                          {weekDays.map((day, dayIndex) => {
                            const isWorking = isDoctorWorkingOnDay(day);
                            const occupancy = getDayOccupancy(day);
                            const isStartDate = isSameDay(day, selectedDate);
                            const isEndDate = endDate && isSameDay(day, endDate);
                            const isInRange = isDateInRange(day);
                            const today = isToday(day);

                            const getOccupancyColor = () => {
                              if (!isWorking) return "bg-muted/30";
                              switch (occupancy) {
                                case "free": return "bg-lime/20 hover:bg-lime/30";
                                case "low": return "bg-yellow-500/20 hover:bg-yellow-500/30";
                                case "medium": return "bg-orange-500/20 hover:bg-orange-500/30";
                                case "high": return "bg-red-500/20 hover:bg-red-500/30";
                                default: return "bg-muted/20";
                              }
                            };

                            // Check if this day is first or last in range within this week
                            const isFirstInWeekRange = isInRange && (dayIndex === 0 || isSameDay(day, selectedDate));
                            const isLastInWeekRange = isInRange && (dayIndex === 6 || (endDate && isSameDay(day, endDate)));

                            return (
                              <motion.button
                                key={day.toISOString()}
                                onClick={() => handleSelectDate(day)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                  "relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all h-full min-h-[120px]",
                                  isStartDate
                                    ? "bg-lime text-lime-foreground shadow-lg ring-2 ring-lime/50"
                                    : isEndDate
                                    ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50"
                                    : isInRange
                                    ? "bg-lime/20 border-2 border-lime/40 border-dashed"
                                    : today
                                    ? "ring-2 ring-primary/30 " + getOccupancyColor()
                                    : getOccupancyColor()
                                )}
                              >
                                {/* Range position indicators */}
                                {isStartDate && isRangeMode && endDate && (
                                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-lime rounded-full border-2 border-background shadow-md z-20">
                                    <ChevronRight className="w-2 h-2 text-lime-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                  </div>
                                )}
                                {isEndDate && (
                                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md z-20">
                                    <ChevronLeft className="w-2 h-2 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                  </div>
                                )}
                                
                                <span className="text-xs uppercase opacity-60 mb-1">
                                  {format(day, "EEE", { locale: es })}
                                </span>
                                <span className="font-bold text-3xl">
                                  {format(day, "d")}
                                </span>
                                {!isWorking && (
                                  <Badge variant="secondary" className="mt-2 text-[9px]">
                                    No trabaja
                                  </Badge>
                                )}
                                {isStartDate && isRangeMode && (
                                  <Badge className="mt-2 text-[8px] bg-lime-foreground/20 gap-1">
                                    <CalendarIcon className="w-2.5 h-2.5" />
                                    Inicio
                                  </Badge>
                                )}
                                {isEndDate && (
                                  <Badge className="mt-2 text-[8px] bg-primary-foreground/20 gap-1">
                                    <Check className="w-2.5 h-2.5" />
                                    Fin
                                  </Badge>
                                )}
                                {isInRange && !isStartDate && !isEndDate && (
                                  <div className="absolute top-2 right-2">
                                    <div className="w-2 h-2 rounded-full bg-lime/60 animate-pulse" />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Month View */}
                    {viewMode === "month" && (
                      <div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                            <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">
                              {d}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {monthDays.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isWorking = isDoctorWorkingOnDay(day);
                            const occupancy = getDayOccupancy(day);
                            const isStartDate = isSameDay(day, selectedDate);
                            const isEndDate = endDate && isSameDay(day, endDate);
                            const isInRange = isDateInRange(day);
                            const today = isToday(day);
                            
                            // Calculate position in range for connectors
                            const colIndex = idx % 7;
                            const isFirstInRow = colIndex === 0;
                            const isLastInRow = colIndex === 6;
                            
                            // Check adjacent days for connector logic
                            const prevDay = idx > 0 ? monthDays[idx - 1] : null;
                            const nextDay = idx < monthDays.length - 1 ? monthDays[idx + 1] : null;
                            const isPrevInRange = prevDay && isDateInRange(prevDay);
                            const isNextInRange = nextDay && isDateInRange(nextDay);
                            
                            // Determine if we need left/right connectors
                            const showLeftConnector = isInRange && !isFirstInRow && (isPrevInRange || isSameDay(day, selectedDate));
                            const showRightConnector = isInRange && !isLastInRow && (isNextInRange || (endDate && isSameDay(day, endDate)));

                            const getOccupancyIndicator = () => {
                              if (!isWorking || !isCurrentMonth) return null;
                              switch (occupancy) {
                                case "free": return "bg-lime";
                                case "low": return "bg-yellow-500";
                                case "medium": return "bg-orange-500";
                                case "high": return "bg-red-500";
                                default: return null;
                              }
                            };

                            const indicatorColor = getOccupancyIndicator();

                            return (
                              <motion.button
                                key={idx}
                                onClick={() => handleSelectDate(day)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                  "relative aspect-square flex flex-col items-center justify-center text-sm transition-all",
                                  !isCurrentMonth && "opacity-25",
                                  !isWorking && isCurrentMonth && "opacity-40",
                                  // Base rounded corners
                                  "rounded-xl",
                                  // Range styling with connected look
                                  isStartDate
                                    ? "bg-lime text-lime-foreground shadow-md z-10"
                                    : isEndDate
                                    ? "bg-primary text-primary-foreground shadow-md z-10"
                                    : isInRange
                                    ? "bg-gradient-to-r from-lime/30 to-lime/20 border-y-2 border-lime/30 border-dashed rounded-none"
                                    : today
                                    ? "bg-primary/10 ring-2 ring-primary/30"
                                    : "hover:bg-muted/50"
                                )}
                              >
                                {/* Horizontal connector lines for range */}
                                {isInRange && !isStartDate && !isEndDate && (
                                  <>
                                    {/* Left connector */}
                                    {!isFirstInRow && isPrevInRange && (
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 -ml-1 bg-lime/50 rounded-full" />
                                    )}
                                    {/* Right connector */}
                                    {!isLastInRow && isNextInRange && (
                                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 -mr-1 bg-lime/50 rounded-full" />
                                    )}
                                  </>
                                )}
                                
                                {/* Start date arrow indicator */}
                                {isStartDate && isRangeMode && endDate && (
                                  <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 z-20">
                                    <div className="w-2 h-4 bg-lime rounded-r-full flex items-center justify-center">
                                      <ChevronRight className="w-2 h-2 text-lime-foreground" />
                                    </div>
                                  </div>
                                )}
                                
                                {/* End date arrow indicator */}
                                {isEndDate && (
                                  <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 z-20">
                                    <div className="w-2 h-4 bg-primary rounded-l-full flex items-center justify-center">
                                      <ChevronLeft className="w-2 h-2 text-primary-foreground" />
                                    </div>
                                  </div>
                                )}
                                
                                <span className="font-medium">{format(day, "d")}</span>
                                
                                {/* Occupancy indicator */}
                                {indicatorColor && !isStartDate && !isEndDate && !isInRange && (
                                  <div className={cn(
                                    "absolute bottom-1.5 w-1.5 h-1.5 rounded-full",
                                    indicatorColor
                                  )} />
                                )}
                                
                                {/* Range day indicator - small dot for days in range */}
                                {isInRange && !isStartDate && !isEndDate && (
                                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-lime animate-pulse" />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                        
                        {/* Range summary bar */}
                        {isRangeMode && endDate && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-lime/20 via-lime/10 to-primary/20 border border-lime/30 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-lime" />
                                <span className="text-xs font-medium">{format(selectedDate, "dd MMM", { locale: es })}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <div className="w-8 h-0.5 bg-gradient-to-r from-lime to-primary rounded-full" />
                                <span className="text-[10px]">rango</span>
                                <div className="w-8 h-0.5 bg-gradient-to-r from-lime to-primary rounded-full" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-xs font-medium">{format(endDate, "dd MMM", { locale: es })}</span>
                              </div>
                            </div>
                            <Badge className="bg-lime/20 text-lime-foreground border border-lime/30">
                              {rangeOccurrences} cita{rangeOccurrences !== 1 ? "s" : ""}
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Year View */}
                    {viewMode === "year" && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 h-full content-center">
                        {months.map((month, idx) => {
                          const isCurrentMonth = new Date().getMonth() === idx && new Date().getFullYear() === currentDate.getFullYear();
                          const isSelectedMonth = currentDate.getMonth() === idx;
                          
                          return (
                            <motion.button
                              key={month}
                              onClick={() => handleSelectMonth(idx)}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className={cn(
                                "py-6 px-4 rounded-2xl text-sm font-medium transition-all",
                                isCurrentMonth
                                  ? "bg-lime text-lime-foreground shadow-lg"
                                  : isSelectedMonth
                                  ? "bg-primary/20 ring-2 ring-primary/30"
                                  : "bg-muted/30 hover:bg-muted/50"
                              )}
                            >
                              {month}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Doctor Stats Drawer */}
      <DoctorStatsDrawer
        open={isDoctorStatsOpen}
        onOpenChange={setIsDoctorStatsOpen}
        doctor={selectedDoctorData ? {
          id: selectedDoctorData.id,
          name: selectedDoctorData.name,
          specialty: selectedDoctorData.specialty,
          avatar: selectedDoctorData.avatar
        } : null}
      />
    </motion.div>
  );
};

export default SchedulingStep;
