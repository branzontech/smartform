import React, { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  User,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Horarios disponibles
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

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  reason: string;
  status: string;
}

interface AppointmentSchedulerProps {
  existingAppointments: Appointment[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  patientName?: string;
  onSubmit: () => void;
  isEditing?: boolean;
}

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  existingAppointments,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  duration,
  onDurationChange,
  reason,
  onReasonChange,
  notes,
  onNotesChange,
  patientName,
  onSubmit,
  isEditing = false
}) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Días de la semana actual
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Citas del día seleccionado
  const dayAppointments = useMemo(() => {
    return existingAppointments.filter(apt => {
      const aptDate = new Date(apt.time.split("T")[0] || selectedDate);
      return isSameDay(aptDate, selectedDate);
    });
  }, [existingAppointments, selectedDate]);

  // Verificar si un horario está ocupado
  const isTimeSlotOccupied = (time: string) => {
    return dayAppointments.some(apt => apt.time === time);
  };

  // Calcular el slot final según duración
  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header con navegación de semana */}
      <div className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Agendar Cita</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd MMM yyyy", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Navegación semanal */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                className={cn(
                  "flex flex-col items-center py-2 px-1 rounded-xl transition-all",
                  isSameDay(day, selectedDate)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isToday(day)
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "hover:bg-muted"
                )}
              >
                <span className="text-xs opacity-70">
                  {format(day, "EEE", { locale: es })}
                </span>
                <span className="font-semibold text-lg">
                  {format(day, "d")}
                </span>
              </button>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Lista de horarios */}
        <div className="w-1/2 border-r border-border/50">
          <div className="p-3 border-b border-border/50 bg-muted/30">
            <p className="text-sm font-medium">
              Horarios disponibles - {format(selectedDate, "EEEE d", { locale: es })}
            </p>
          </div>
          <ScrollArea className="h-[calc(100%-45px)]">
            <div className="p-3 grid grid-cols-2 gap-2">
              {timeSlots.map((time) => {
                const occupied = isTimeSlotOccupied(time);
                const isSelected = time === selectedTime;
                
                return (
                  <button
                    key={time}
                    onClick={() => !occupied && onTimeChange(time)}
                    disabled={occupied}
                    className={cn(
                      "flex items-center justify-center py-3 px-4 rounded-xl text-sm font-medium transition-all",
                      occupied
                        ? "bg-muted/50 text-muted-foreground cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card hover:bg-accent border border-border/50"
                    )}
                  >
                    <Clock className={cn(
                      "mr-2 h-4 w-4",
                      occupied && "opacity-50"
                    )} />
                    {time}
                    {occupied && <X className="ml-2 h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Panel de detalles de cita */}
        <div className="w-1/2 flex flex-col">
          <div className="p-3 border-b border-border/50 bg-muted/30">
            <p className="text-sm font-medium">Detalles de la cita</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Resumen de selección */}
              {selectedTime && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
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
                    {patientName && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{patientName}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Duración */}
              <div>
                <Label className="text-sm">Duración</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {durations.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => onDurationChange(d.value)}
                      className={cn(
                        "py-2 px-3 rounded-xl text-sm font-medium transition-all border",
                        duration === d.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card hover:bg-accent border-border/50"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivo */}
              <div>
                <Label className="text-sm">Motivo de la cita</Label>
                <Select value={reason} onValueChange={onReasonChange}>
                  <SelectTrigger className="mt-2">
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

              {/* Notas */}
              <div>
                <Label className="text-sm">Notas adicionales (opcional)</Label>
                <Textarea
                  placeholder="Indicaciones, recordatorios..."
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={3}
                  className="mt-2 resize-none"
                />
              </div>
            </div>
          </ScrollArea>

          {/* Botón de acción */}
          <div className="p-4 border-t border-border/50 bg-card/50">
            <Button 
              className="w-full rounded-xl h-12 text-base font-medium"
              onClick={onSubmit}
              disabled={!selectedTime || !reason}
            >
              <Check className="mr-2 h-5 w-5" />
              {isEditing ? "Actualizar cita" : "Confirmar cita"}
            </Button>
          </div>
        </div>
      </div>

      {/* Vista previa de citas del día */}
      {dayAppointments.length > 0 && (
        <div className="border-t border-border/50 p-4 bg-muted/30">
          <p className="text-sm font-medium mb-3">
            Citas programadas para hoy ({dayAppointments.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dayAppointments.map((apt) => (
              <Card key={apt.id} className="shrink-0 w-48 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant={apt.status === "Completada" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {apt.time}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {apt.duration} min
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{apt.patientName}</p>
                  <p className="text-xs text-muted-foreground truncate">{apt.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
