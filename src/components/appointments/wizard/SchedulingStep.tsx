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
  setYear
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Check,
  Sparkles,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  Sun,
  Sunrise,
  Sunset
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";

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
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" }
];

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const SchedulingStep: React.FC<SchedulingStepProps> = ({
  patient,
  existingAppointments,
  onComplete,
  onBack
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [expandedTimeGroup, setExpandedTimeGroup] = useState<string | null>("morning");
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
    
    // Add padding days from previous month
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
      setViewMode("week");
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

  const renderNavigationTitle = () => {
    switch (viewMode) {
      case "day":
        return format(currentDate, "EEEE, d MMMM yyyy", { locale: es });
      case "week":
        return `${format(weekStart, "d MMM", { locale: es })} - ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}`;
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: es });
      case "year":
        return format(currentDate, "yyyy");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-3">
          <CalendarIcon className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Selecciona fecha y hora</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Elige el mejor horario para {patient.firstName}
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {/* View Mode Tabs & Navigation */}
            <div className="p-4 border-b border-border/20 bg-muted/10">
              <div className="flex items-center justify-between gap-4">
                {/* View Mode Tabs */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList className="h-9 rounded-xl bg-background/50">
                    <TabsTrigger value="day" className="text-xs px-3 rounded-lg gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Día</span>
                    </TabsTrigger>
                    <TabsTrigger value="week" className="text-xs px-3 rounded-lg gap-1.5">
                      <CalendarRange className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Semana</span>
                    </TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-3 rounded-lg gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mes</span>
                    </TabsTrigger>
                    <TabsTrigger value="year" className="text-xs px-3 rounded-lg gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Año</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

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
                  <span className="text-sm font-medium min-w-[140px] text-center capitalize">
                    {renderNavigationTitle()}
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
              </div>
            </div>

            {/* Calendar Views */}
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Day View */}
                {viewMode === "day" && (
                  <div className="p-4">
                    <div className="text-center py-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl">
                      <p className="text-4xl font-bold text-primary">
                        {format(currentDate, "d")}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        {format(currentDate, "EEEE", { locale: es })}
                      </p>
                      {hasAppointmentsOnDay(currentDate) && (
                        <Badge variant="secondary" className="mt-2 rounded-lg">
                          {dayAppointments.length} citas programadas
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Week View */}
                {viewMode === "week" && (
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1.5">
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
                              "relative flex flex-col items-center py-3 rounded-xl transition-all",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md"
                                : today
                                ? "bg-primary/10 hover:bg-primary/15"
                                : "hover:bg-muted/50"
                            )}
                          >
                            <span className="text-[10px] uppercase opacity-60">
                              {format(day, "EEE", { locale: es })}
                            </span>
                            <span className="font-semibold text-lg">
                              {format(day, "d")}
                            </span>
                            {hasAppts && (
                              <div className={cn(
                                "w-1 h-1 rounded-full mt-0.5",
                                isSelected ? "bg-primary-foreground" : "bg-primary"
                              )} />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Month View */}
                {viewMode === "month" && (
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-0.5 mb-2">
                      {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                        <div key={d} className="text-center text-[10px] text-muted-foreground py-1 font-medium">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
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
                              "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all",
                              !isCurrentMonth && "opacity-30",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : today
                                ? "bg-primary/10"
                                : "hover:bg-muted/50"
                            )}
                          >
                            <span className="font-medium">{format(day, "d")}</span>
                            {hasAppts && isCurrentMonth && (
                              <div className={cn(
                                "absolute bottom-1 w-1 h-1 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-primary"
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
                  <div className="p-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {months.map((month, idx) => {
                        const isCurrentMonth = currentDate.getMonth() === idx;
                        
                        return (
                          <motion.button
                            key={month}
                            onClick={() => handleSelectMonth(idx)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "py-4 px-3 rounded-xl text-sm font-medium transition-all",
                              isCurrentMonth
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-muted/30 hover:bg-muted/50"
                            )}
                          >
                            {month}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Time Selection & Details */}
            {viewMode !== "year" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-border/20">
                {/* Time Slots - Grouped */}
                <div className="p-4 border-b lg:border-b-0 lg:border-r border-border/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Horarios
                    </h3>
                    <Badge variant="outline" className="text-xs rounded-lg">
                      {format(selectedDate, "d MMM", { locale: es })}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(timeSlotGroups).map(([key, group]) => {
                      const Icon = group.icon;
                      const availableSlots = group.slots.filter(t => !isTimeSlotOccupied(t));
                      const isExpanded = expandedTimeGroup === key;

                      return (
                        <div key={key} className="rounded-xl border border-border/30 overflow-hidden">
                          <button
                            onClick={() => setExpandedTimeGroup(isExpanded ? null : key)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 transition-colors",
                              isExpanded ? "bg-muted/30" : "hover:bg-muted/20"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{group.label}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs rounded-md">
                              {availableSlots.length} disponibles
                            </Badge>
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-2 pt-0 grid grid-cols-4 gap-1.5">
                                  {group.slots.map((time) => {
                                    const occupied = isTimeSlotOccupied(time);
                                    const isSelected = time === selectedTime;
                                    
                                    return (
                                      <motion.button
                                        key={time}
                                        onClick={() => !occupied && setSelectedTime(time)}
                                        disabled={occupied}
                                        whileHover={{ scale: occupied ? 1 : 1.03 }}
                                        whileTap={{ scale: occupied ? 1 : 0.97 }}
                                        className={cn(
                                          "py-2 rounded-lg text-xs font-medium transition-all",
                                          occupied
                                            ? "bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through"
                                            : isSelected
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-background hover:bg-accent border border-border/40"
                                        )}
                                      >
                                        {time}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details Panel */}
                <div className="p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Detalles
                  </h3>

                  {/* Selection Summary */}
                  {selectedTime && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate capitalize">
                            {format(selectedDate, "EEEE, d MMMM", { locale: es })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedTime} - {getEndTime(selectedTime, duration)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Duration */}
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground">Duración</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {durations.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setDuration(d.value)}
                          className={cn(
                            "py-1.5 px-3 rounded-lg text-xs font-medium transition-all",
                            duration === d.value
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/30 hover:bg-muted/50"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground">Motivo</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger className="h-10 rounded-xl text-sm">
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consulta general">Consulta general</SelectItem>
                        <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                        <SelectItem value="Control">Control</SelectItem>
                        <SelectItem value="Examen médico">Examen médico</SelectItem>
                        <SelectItem value="Urgencia">Urgencia</SelectItem>
                        <SelectItem value="Primera vez">Primera vez</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground">Notas (opcional)</Label>
                    <Textarea
                      placeholder="Indicaciones..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="rounded-xl resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="p-4 border-t border-border/20 bg-muted/5">
              <Button 
                onClick={handleSubmit}
                disabled={!selectedTime || !reason}
                className="w-full h-12 rounded-xl font-semibold"
              >
                <Check className="mr-2 w-4 h-4" />
                Confirmar cita
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Back button */}
      <motion.div variants={itemVariants} className="flex justify-start">
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-xl gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SchedulingStep;
