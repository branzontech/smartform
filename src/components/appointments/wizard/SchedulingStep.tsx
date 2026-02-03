import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Check,
  User,
  Phone,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
  "17:00", "17:30", "18:00"
];

const durations = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" }
];

export const SchedulingStep: React.FC<SchedulingStepProps> = ({
  patient,
  existingAppointments,
  onComplete,
  onBack
}) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

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

  const handleSubmit = () => {
    onComplete({
      date: selectedDate,
      time: selectedTime,
      duration,
      reason,
      notes
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
          <CalendarIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Selecciona fecha y hora</h2>
        <p className="text-muted-foreground mt-1">
          Elige el mejor horario para {patient.firstName}
        </p>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {/* Week Navigator */}
            <div className="p-4 border-b border-border/30 bg-muted/20">
              <div className="flex items-center justify-between mb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-2xl h-11 gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {format(selectedDate, "MMMM yyyy", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setWeekStart(subWeeks(weekStart, 1))}
                    className="rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                    className="rounded-xl"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const hasAppointments = existingAppointments.some(apt => {
                    const aptDate = new Date(apt.date || apt.time?.split("T")[0]);
                    return isSameDay(aptDate, day);
                  });

                  return (
                    <motion.button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative flex flex-col items-center py-3 px-2 rounded-2xl transition-all duration-200",
                        isSameDay(day, selectedDate)
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                          : isToday(day)
                          ? "bg-primary/10 hover:bg-primary/20"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="text-xs opacity-70 uppercase">
                        {format(day, "EEE", { locale: es })}
                      </span>
                      <span className="font-bold text-xl mt-1">
                        {format(day, "d")}
                      </span>
                      {hasAppointments && (
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full mt-1",
                          isSameDay(day, selectedDate) ? "bg-primary-foreground" : "bg-primary"
                        )} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/30">
              {/* Time Slots */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Horarios disponibles
                  </h3>
                  <Badge variant="secondary" className="rounded-xl">
                    {format(selectedDate, "EEEE d", { locale: es })}
                  </Badge>
                </div>

                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => {
                      const occupied = isTimeSlotOccupied(time);
                      const isSelected = time === selectedTime;
                      
                      return (
                        <motion.button
                          key={time}
                          onClick={() => !occupied && setSelectedTime(time)}
                          disabled={occupied}
                          whileHover={{ scale: occupied ? 1 : 1.05 }}
                          whileTap={{ scale: occupied ? 1 : 0.95 }}
                          className={cn(
                            "py-3 px-2 rounded-xl font-medium transition-all duration-200",
                            occupied
                              ? "bg-muted/50 text-muted-foreground cursor-not-allowed line-through opacity-50"
                              : isSelected
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                              : "bg-background hover:bg-accent border border-border/50"
                          )}
                        >
                          {time}
                        </motion.button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Details Panel */}
              <div className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Detalles de la cita
                </h3>

                {/* Selection Summary */}
                {selectedTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <CalendarIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {format(selectedDate, "EEEE, d MMMM", { locale: es })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedTime} - {getEndTime(selectedTime, duration)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Duration */}
                <div>
                  <Label className="text-sm mb-2 block">Duración</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {durations.slice(0, 6).map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={cn(
                          "py-2 px-3 rounded-xl text-sm font-medium transition-all border",
                          duration === d.value
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-background hover:bg-accent border-border/50"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <Label className="text-sm mb-2 block">Motivo de la cita</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="h-11 rounded-xl">
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
                  <Label className="text-sm mb-2 block">Notas (opcional)</Label>
                  <Textarea
                    placeholder="Indicaciones, recordatorios..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="rounded-xl resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Existing appointments for the day */}
            {dayAppointments.length > 0 && (
              <div className="p-4 border-t border-border/30 bg-muted/10">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Citas del día ({dayAppointments.length})
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {dayAppointments.map((apt, index) => (
                    <Card key={apt.id || index} className="shrink-0 w-40 border-border/30 rounded-2xl">
                      <CardContent className="p-3">
                        <Badge variant="outline" className="mb-2 rounded-lg text-xs">
                          {apt.time}
                        </Badge>
                        <p className="text-sm font-medium truncate">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">{apt.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="p-4 border-t border-border/30 bg-card/50">
              <Button 
                onClick={handleSubmit}
                disabled={!selectedTime || !reason}
                className="w-full h-14 rounded-2xl text-lg font-semibold"
              >
                <Check className="mr-2 w-5 h-5" />
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
          className="rounded-xl gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SchedulingStep;
