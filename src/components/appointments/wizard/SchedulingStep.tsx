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
  Repeat
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
  ResourceAvailabilityPanel
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

  const canSubmit = selectedTime && reason && selectedDoctor;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-180px)] min-h-[500px]"
    >
      <ResizablePanelGroup direction="horizontal" className="h-full rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl overflow-hidden">
        {/* Left Panel - Control Panel (30%) */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="h-full flex flex-col bg-muted/5">
            {/* Patient Header with Quick Actions */}
            <div className="p-4 border-b border-border/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{patient.firstName} {patient.lastName}</p>
                  <p className="text-xs text-muted-foreground">{patient.documentId}</p>
                </div>
              </div>
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangePatient || onBack}
                  className="flex-1 h-8 rounded-lg text-[10px]"
                >
                  <UserSearch className="w-3 h-3 mr-1" />
                  Otro paciente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNewAppointment || onBack}
                  className="flex-1 h-8 rounded-lg text-[10px]"
                >
                  <CalendarPlus className="w-3 h-3 mr-1" />
                  Nueva cita
                </Button>
              </div>
            </div>

            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 pt-2">
                <TabsList className="w-full h-9 bg-muted/30 rounded-xl p-1">
                  <TabsTrigger value="scheduling" className="flex-1 text-[10px] rounded-lg data-[state=active]:bg-background">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    Agendar
                  </TabsTrigger>
                  <TabsTrigger value="blocks" className="flex-1 text-[10px] rounded-lg data-[state=active]:bg-background">
                    <Ban className="w-3 h-3 mr-1" />
                    Bloqueos
                  </TabsTrigger>
                  <TabsTrigger value="waiting" className="flex-1 text-[10px] rounded-lg data-[state=active]:bg-background">
                    <ListTodo className="w-3 h-3 mr-1" />
                    Espera
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="scheduling" className="flex-1 mt-0 flex flex-col min-h-0">
                <ScrollArea className="flex-1 h-0 min-h-0">
                  <div className="p-4 space-y-5">
                {/* Step 1: Doctor Selection - PRIMARY */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary-foreground">1</span>
                    </div>
                    <span className="text-sm font-semibold">Seleccionar Profesional</span>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="space-y-2 mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre o especialidad..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 rounded-xl text-xs"
                      />
                    </div>
                    <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                      <SelectTrigger className="h-8 rounded-xl text-xs">
                        <Filter className="w-3 h-3 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Filtrar por especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las especialidades</SelectItem>
                        {specialties.map((spec) => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Doctor List */}
                  <div className="space-y-2">
                    {filteredDoctors.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No se encontraron profesionales</p>
                      </div>
                    ) : (
                      filteredDoctors.map((doc) => (
                      <motion.button
                        key={doc.id}
                        onClick={() => doc.available && handleDoctorSelect(doc.id)}
                        disabled={!doc.available}
                        whileHover={doc.available ? { scale: 1.01 } : {}}
                        whileTap={doc.available ? { scale: 0.99 } : {}}
                        className={cn(
                          "w-full p-3 rounded-xl text-left transition-all flex items-center gap-3",
                          !doc.available 
                            ? "opacity-50 cursor-not-allowed bg-muted/20"
                            : selectedDoctor === doc.id
                            ? "bg-lime text-lime-foreground shadow-md ring-2 ring-lime/50"
                            : "bg-background hover:bg-muted/50 border border-border/30"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                          selectedDoctor === doc.id 
                            ? "bg-lime-foreground/20 text-lime-foreground"
                            : "bg-primary/10 text-primary"
                        )}>
                          {doc.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <p className={cn(
                            "text-xs truncate",
                            selectedDoctor === doc.id ? "opacity-80" : "text-muted-foreground"
                          )}>
                            {doc.specialty}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {doc.available ? (
                            <Badge variant="outline" className={cn(
                              "text-[9px] rounded-md",
                              selectedDoctor === doc.id 
                                ? "border-lime-foreground/30 text-lime-foreground"
                                : "border-green-500/30 text-green-600"
                            )}>
                              Disponible
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] rounded-md">
                              No disponible
                            </Badge>
                          )}
                        </div>
                      </motion.button>
                    ))
                    )}
                  </div>
                </div>

                {/* Show rest of options only after doctor selection */}
                {selectedDoctor && (
                  <>
                    <Separator className="bg-border/20" />

                    {/* Doctor Schedule Info */}
                    {selectedDoctorData && (
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold">Horario del Profesional</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {["L", "M", "X", "J", "V", "S", "D"].map((day, idx) => {
                            const dayKey = dayNames[(idx + 1) % 7];
                            const schedule = selectedDoctorData.schedule[dayKey];
                            const isWorking = schedule?.working;
                            
                            return (
                              <div
                                key={day}
                                className={cn(
                                  "text-center py-1.5 rounded-md text-[10px] font-medium",
                                  isWorking 
                                    ? "bg-lime/20 text-lime-foreground"
                                    : "bg-muted/30 text-muted-foreground"
                                )}
                              >
                                {day}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Appointment Type Selection */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-[10px] font-bold">2</span>
                        </div>
                        <span className="text-sm font-semibold">Tipo de Cita</span>
                      </div>
                      <AppointmentTypeInline
                        selectedType={appointmentType}
                        onSelect={handleAppointmentTypeSelect}
                      />
                    </div>

                    {/* Date Display - Simple summary since range is controlled from calendar */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-[10px] font-bold">3</span>
                        </div>
                        <span className="text-sm font-semibold">Fecha Seleccionada</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">
                            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                          </span>
                        </div>
                        {isRangeMode && endDate && (
                          <div className="mt-2 pt-2 border-t border-border/20">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Rango:</span>
                              <span className="font-medium">
                                {format(selectedDate, "dd MMM", { locale: es })} → {format(endDate, "dd MMM", { locale: es })}
                              </span>
                            </div>
                            {recurrencePattern && (
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-muted-foreground">Patrón:</span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {recurrencePattern === "daily" ? "Diario" : 
                                   recurrencePattern === "weekly" ? "Semanal" :
                                   recurrencePattern === "biweekly" ? "Quincenal" : "Mensual"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                        {isRangeMode && !endDate && (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Activa el modo rango en el calendario y selecciona la fecha final
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Resources - Only for procedure types */}
                    {(appointmentType === "procedure" || appointmentType === "multispecialty") && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-[10px] font-bold">4</span>
                          </div>
                          <span className="text-sm font-semibold">Recursos</span>
                        </div>
                        <ResourceAvailabilityPanel
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          duration={duration}
                          selectedResources={selectedResources}
                          onResourceToggle={handleResourceToggle}
                        />
                      </div>
                    )}

                    {/* Quick Actions Panel */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Acciones Rápidas</span>
                      </div>
                      <AppointmentActionsPanel />
                    </div>

                    <Separator className="bg-border/20" />

                    {/* Additional Details - Collapsed by default */}
                    <div>
                      <Label className="text-xs mb-2 block text-muted-foreground">Servicio (Opcional)</Label>
                      <Select value={selectedService} onValueChange={(v) => {
                        setSelectedService(v);
                        const service = services.find(s => s.id === v);
                        if (service) setDuration(service.duration);
                      }}>
                        <SelectTrigger className="h-9 rounded-xl text-xs">
                          <SelectValue placeholder="Seleccionar servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} ({service.duration}min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duration */}
                    <div>
                      <Label className="text-xs mb-2 block text-muted-foreground">Duración</Label>
                      <Label className="text-xs mb-2 block text-muted-foreground">Duración</Label>
                      <div className="flex flex-wrap gap-1">
                        {durations.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => setDuration(d.value)}
                            className={cn(
                              "py-1 px-2.5 rounded-md text-[11px] font-medium transition-all",
                              duration === d.value
                                ? "bg-lime text-lime-foreground"
                                : "bg-muted/30 hover:bg-muted/50"
                            )}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label className="text-xs mb-2 block text-muted-foreground">Notas</Label>
                      <Textarea
                        placeholder="Indicaciones..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="rounded-xl resize-none text-xs"
                      />
                    </div>

                  </>
                )}
              </div>
            </ScrollArea>
              </TabsContent>

              <TabsContent value="blocks" className="flex-1 mt-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <AvailabilityBlockManager doctorId={selectedDoctor} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="waiting" className="flex-1 mt-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <WaitingListPanel />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Action Buttons - Always Visible */}
            <div className="p-4 border-t border-border/20 bg-background/50 space-y-2">
              {/* Selection Summary */}
              {selectedTime && selectedDoctor && (
                <div className="p-2.5 rounded-xl bg-lime/10 border border-lime/20 mb-3">
                  <p className="text-xs font-medium capitalize">
                    {format(selectedDate, "EEE d MMM", { locale: es })} • {selectedTime} - {getEndTime(selectedTime, duration)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {selectedDoctorData?.name}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full h-10 rounded-xl font-semibold text-sm"
              >
                <Check className="mr-2 w-4 h-4" />
                Confirmar Cita
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  className="h-9 rounded-xl text-xs"
                >
                  <X className="mr-1.5 w-3.5 h-3.5" />
                  Cancelar
                </Button>
                <Button 
                  variant="outline"
                  className="h-9 rounded-xl text-xs"
                >
                  <RefreshCw className="mr-1.5 w-3.5 h-3.5" />
                  Reprogramar
                </Button>
              </div>
            </div>
          </div>
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

                {/* Navigation */}
                <div className="flex items-center gap-2">
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
                      <div className="grid grid-cols-7 gap-2 h-full">
                        {weekDays.map((day) => {
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
                                  ? "bg-lime/30 ring-1 ring-lime/30"
                                  : today
                                  ? "ring-2 ring-primary/30 " + getOccupancyColor()
                                  : getOccupancyColor()
                              )}
                            >
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
                                <Badge className="mt-2 text-[8px] bg-lime-foreground/20">Inicio</Badge>
                              )}
                              {isEndDate && (
                                <Badge className="mt-2 text-[8px] bg-primary-foreground/20">Fin</Badge>
                              )}
                            </motion.button>
                          );
                        })}
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
                                  "relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all",
                                  !isCurrentMonth && "opacity-25",
                                  !isWorking && isCurrentMonth && "opacity-40",
                                  isStartDate
                                    ? "bg-lime text-lime-foreground shadow-md"
                                    : isEndDate
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : isInRange
                                    ? "bg-lime/30 ring-1 ring-lime/20"
                                    : today
                                    ? "bg-primary/10 ring-2 ring-primary/30"
                                    : "hover:bg-muted/50"
                                )}
                              >
                                <span className="font-medium">{format(day, "d")}</span>
                                {indicatorColor && !isStartDate && !isEndDate && !isInRange && (
                                  <div className={cn(
                                    "absolute bottom-1.5 w-1.5 h-1.5 rounded-full",
                                    indicatorColor
                                  )} />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
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
    </motion.div>
  );
};

export default SchedulingStep;
