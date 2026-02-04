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
  setMonth
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Check,
  X,
  RefreshCw,
  User,
  Stethoscope,
  FileText,
  Briefcase,
  Sun,
  Sunrise,
  Sunset
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable";

export interface SchedulingData {
  date: Date;
  time: string;
  duration: number;
  reason: string;
  notes: string;
}

interface SchedulingStepProps {
  patient: ExtendedPatient;
  existingAppointments: any[];
  onComplete: (data: SchedulingData) => void;
  onBack: () => void;
}

type ViewMode = "day" | "week" | "month" | "year";

const timeSlotGroups = {
  morning: { label: "Mañana", icon: Sunrise, slots: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  afternoon: { label: "Tarde", icon: Sun, slots: ["12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"] },
  evening: { label: "Noche", icon: Sunset, slots: ["17:00", "17:30", "18:00"] }
};

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

const mockDoctors = [
  { id: "1", name: "Dr. Carlos Jiménez", specialty: "Cardiología", available: true },
  { id: "2", name: "Dra. Laura Sánchez", specialty: "Pediatría", available: true },
  { id: "3", name: "Dr. Alejandro Martínez", specialty: "Traumatología", available: false },
];

const services = [
  { id: "1", name: "Consulta General", duration: 30 },
  { id: "2", name: "Examen Completo", duration: 60 },
  { id: "3", name: "Control", duration: 15 },
  { id: "4", name: "Procedimiento Menor", duration: 45 },
];

export const SchedulingStep: React.FC<SchedulingStepProps> = ({
  patient,
  existingAppointments,
  onComplete,
  onBack
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

  const dayAppointments = useMemo(() => {
    return existingAppointments.filter(apt => {
      const aptDate = new Date(apt.date || apt.time?.split("T")[0] || selectedDate);
      return isSameDay(aptDate, selectedDate);
    });
  }, [existingAppointments, selectedDate]);

  const isTimeSlotOccupied = (time: string) => {
    return dayAppointments.some(apt => apt.time === time);
  };

  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  };

  const hasAppointmentsOnDay = (day: Date) => {
    return existingAppointments.some(apt => {
      const aptDate = new Date(apt.date || apt.time?.split("T")[0]);
      return isSameDay(aptDate, day);
    });
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
    setSelectedDate(date);
    setCurrentDate(date);
    if (viewMode === "year") {
      setViewMode("month");
    } else if (viewMode === "month") {
      setViewMode("day");
    }
  };

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentDate(setMonth(currentDate, monthIndex));
    setViewMode("month");
  };

  const handleSubmit = () => {
    onComplete({
      date: selectedDate,
      time: selectedTime,
      duration,
      reason,
      notes
    });
  };

  const canSubmit = selectedTime && reason;

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
            {/* Patient Header */}
            <div className="p-4 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{patient.firstName} {patient.lastName}</p>
                  <p className="text-xs text-muted-foreground">{patient.documentId}</p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {/* Time Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Horarios</span>
                    <Badge variant="outline" className="ml-auto text-[10px] rounded-md">
                      {format(selectedDate, "d MMM", { locale: es })}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(timeSlotGroups).map(([key, group]) => {
                      const Icon = group.icon;
                      const availableSlots = group.slots.filter(t => !isTimeSlotOccupied(t));
                      
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{group.label}</span>
                            <span className="text-[10px] text-muted-foreground/60 ml-auto">{availableSlots.length} disp.</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {group.slots.map((time) => {
                              const occupied = isTimeSlotOccupied(time);
                              const isSelected = time === selectedTime;
                              
                              return (
                                <button
                                  key={time}
                                  onClick={() => !occupied && setSelectedTime(time)}
                                  disabled={occupied}
                                  className={cn(
                                    "py-1.5 rounded-md text-[11px] font-medium transition-all",
                                    occupied
                                      ? "bg-muted/20 text-muted-foreground/40 cursor-not-allowed"
                                      : isSelected
                                      ? "bg-lime text-lime-foreground shadow-sm"
                                      : "bg-background hover:bg-muted/50 border border-border/30"
                                  )}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-border/20" />

                {/* Doctor Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Médico</span>
                  </div>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue placeholder="Seleccionar médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDoctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id} disabled={!doc.available}>
                          <div className="flex items-center gap-2">
                            <span>{doc.name}</span>
                            {!doc.available && <Badge variant="secondary" className="text-[9px]">No disp.</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Servicio</span>
                  </div>
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

                {/* Reason */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Motivo</span>
                  </div>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consulta general">Consulta general</SelectItem>
                      <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                      <SelectItem value="Control">Control</SelectItem>
                      <SelectItem value="Examen médico">Examen médico</SelectItem>
                      <SelectItem value="Urgencia">Urgencia</SelectItem>
                      <SelectItem value="Primera vez">Primera vez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div>
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
              </div>
            </ScrollArea>

            {/* Action Buttons - Always Visible */}
            <div className="p-4 border-t border-border/20 bg-background/50 space-y-2">
              {/* Selection Summary */}
              {selectedTime && (
                <div className="p-2.5 rounded-xl bg-lime/10 border border-lime/20 mb-3">
                  <p className="text-xs font-medium capitalize">
                    {format(selectedDate, "EEE d MMM", { locale: es })} • {selectedTime} - {getEndTime(selectedTime, duration)}
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
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="h-full flex flex-col">
            {/* Calendar Header */}
            <div className="p-4 border-b border-border/20 flex items-center justify-between">
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

              {/* Today Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                className="h-8 rounded-lg text-xs"
              >
                Hoy
              </Button>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 p-4 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode + currentDate.toISOString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {/* Day View */}
                  {viewMode === "day" && (
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 max-w-md w-full">
                        <p className="text-7xl font-bold text-primary mb-2">
                          {format(currentDate, "d")}
                        </p>
                        <p className="text-xl capitalize text-muted-foreground">
                          {format(currentDate, "EEEE", { locale: es })}
                        </p>
                        <p className="text-sm text-muted-foreground/60 mt-1 capitalize">
                          {format(currentDate, "MMMM yyyy", { locale: es })}
                        </p>
                        {dayAppointments.length > 0 && (
                          <Badge className="mt-4 rounded-lg bg-lime/20 text-lime-foreground hover:bg-lime/30">
                            {dayAppointments.length} citas programadas
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Week View */}
                  {viewMode === "week" && (
                    <div className="grid grid-cols-7 gap-2 h-full">
                      {weekDays.map((day) => {
                        const hasAppts = hasAppointmentsOnDay(day);
                        const isSelected = isSameDay(day, selectedDate);
                        const today = isToday(day);

                        return (
                          <motion.button
                            key={day.toISOString()}
                            onClick={() => handleSelectDate(day)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all h-full min-h-[120px]",
                              isSelected
                                ? "bg-lime text-lime-foreground shadow-lg"
                                : today
                                ? "bg-primary/10 hover:bg-primary/15"
                                : "bg-muted/20 hover:bg-muted/40"
                            )}
                          >
                            <span className="text-xs uppercase opacity-60 mb-1">
                              {format(day, "EEE", { locale: es })}
                            </span>
                            <span className="font-bold text-3xl">
                              {format(day, "d")}
                            </span>
                            {hasAppts && (
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full mt-2",
                                isSelected ? "bg-lime-foreground" : "bg-primary"
                              )} />
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
                          const hasAppts = hasAppointmentsOnDay(day);
                          const isSelected = isSameDay(day, selectedDate);
                          const today = isToday(day);

                          return (
                            <motion.button
                              key={idx}
                              onClick={() => handleSelectDate(day)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                "relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all",
                                !isCurrentMonth && "opacity-25",
                                isSelected
                                  ? "bg-lime text-lime-foreground shadow-md"
                                  : today
                                  ? "bg-primary/10 ring-2 ring-primary/30"
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <span className="font-medium">{format(day, "d")}</span>
                              {hasAppts && isCurrentMonth && (
                                <div className={cn(
                                  "absolute bottom-1.5 w-1 h-1 rounded-full",
                                  isSelected ? "bg-lime-foreground" : "bg-lime"
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
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </motion.div>
  );
};

export default SchedulingStep;
