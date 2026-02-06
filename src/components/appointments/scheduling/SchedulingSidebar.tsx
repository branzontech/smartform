import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  User,
  UserSearch,
  CalendarPlus,
  CalendarIcon,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  FileText,
  CalendarRange,
  AlertCircle,
  BarChart3,
  Ban,
  ListTodo,
  Repeat,
  Target,
  Zap,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { ExtendedPatient } from "../PatientPanel";
import { AppointmentType, RecurrencePattern } from "@/types/appointment-types";
import {
  AppointmentTypeInline,
  AvailabilityBlockManager,
  WaitingListPanel,
  AppointmentActionsPanel,
  ResourceAvailabilityPanel,
} from "../scheduling";
import { DoctorSearchCombobox, DoctorOption } from "./DoctorSearchCombobox";

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export type TimeAssignmentMode = "fixed" | "per_day" | "first_available" | "time_window";

// Generic doctor type that works with any schedule structure
export interface DoctorForSidebar extends DoctorOption {
  schedule: {
    [key: string]: { working: boolean; start?: string; end?: string } | undefined;
  };
}

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  icon: React.ElementType;
}

interface SchedulingSidebarProps {
  patient: ExtendedPatient;
  doctors: DoctorForSidebar[];
  selectedDoctorId: string;
  selectedDoctorData: DoctorForSidebar | undefined;
  selectedDate: Date;
  selectedTime: string;
  duration: number;
  reason: string;
  notes: string;
  appointmentType: AppointmentType;
  isRangeMode: boolean;
  endDate: Date | null;
  recurrencePattern?: RecurrencePattern;
  selectedResources: string[];
  canSubmit: boolean;
  availableTimeSlots: { time: string; available: boolean }[];
  
  // Time mode props
  timeAssignmentMode: TimeAssignmentMode;
  rangeTimeWindow: { start: string; end: string };
  onTimeAssignmentModeChange: (mode: TimeAssignmentMode) => void;
  onRangeTimeWindowChange: (window: { start: string; end: string }) => void;
  
  // Callbacks
  onDoctorSelect: (doctorId: string) => void;
  onAppointmentTypeSelect: (type: AppointmentType, defaultDuration?: number) => void;
  onDurationChange: (duration: number) => void;
  onTimeSelect: (time: string) => void;
  onReasonChange: (reason: string) => void;
  onNotesChange: (notes: string) => void;
  onResourceToggle: (resourceId: string) => void;
  onSubmit: () => void;
  onChangePatient?: () => void;
  onNewAppointment?: () => void;
  onBack: () => void;
  onOpenDoctorStats: () => void;
  isFullscreen?: boolean;
}

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
  { value: 120, label: "2h" },
];

export const SchedulingSidebar: React.FC<SchedulingSidebarProps> = ({
  patient,
  doctors,
  selectedDoctorId,
  selectedDoctorData,
  selectedDate,
  selectedTime,
  duration,
  reason,
  notes,
  appointmentType,
  isRangeMode,
  endDate,
  recurrencePattern,
  selectedResources,
  canSubmit,
  availableTimeSlots,
  timeAssignmentMode,
  rangeTimeWindow,
  onTimeAssignmentModeChange,
  onRangeTimeWindowChange,
  onDoctorSelect,
  onAppointmentTypeSelect,
  onDurationChange,
  onTimeSelect,
  onReasonChange,
  onNotesChange,
  onResourceToggle,
  onSubmit,
  onChangePatient,
  onNewAppointment,
  onBack,
  onOpenDoctorStats,
  isFullscreen,
}) => {
  const [activeTab, setActiveTab] = useState("scheduling");
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(() => ({
    professional: !selectedDoctorId, // Collapse if doctor already selected
    date: false,
    time: !!selectedDoctorId, // Open time if doctor selected
    reason: false,
  }));
  const [selectedService, setSelectedService] = useState("");

  // Time mode options
  const timeModeOptions = [
    { value: "fixed" as TimeAssignmentMode, label: "Fijo", icon: Target, description: "Mismo horario" },
    { value: "per_day" as TimeAssignmentMode, label: "Por día", icon: CalendarRange, description: "Diferente cada día" },
    { value: "first_available" as TimeAssignmentMode, label: "Auto", icon: Zap, description: "Primera disponible" },
    { value: "time_window" as TimeAssignmentMode, label: "Ventana", icon: Timer, description: "Rango de horas" },
  ];

  // Generate time options for window selector
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let h = 6; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }
    return options;
  }, []);

  // Progress steps
  const progressSteps: ProgressStep[] = useMemo(() => [
    {
      id: "professional",
      label: "Profesional",
      description: selectedDoctorData ? selectedDoctorData.name : "Selecciona un profesional",
      completed: !!selectedDoctorId,
      icon: Stethoscope,
    },
    {
      id: "date",
      label: "Fecha",
      description: format(selectedDate, "EEE d MMM", { locale: es }),
      completed: true, // Date always has a default
      icon: CalendarIcon,
    },
    {
      id: "time",
      label: "Horario",
      description: selectedTime || "Selecciona un horario",
      completed: !!selectedTime,
      icon: Clock,
    },
    {
      id: "reason",
      label: "Motivo",
      description: reason || "Escribe el motivo de la cita",
      completed: !!reason.trim(),
      icon: FileText,
    },
  ], [selectedDoctorId, selectedDoctorData, selectedDate, selectedTime, reason]);

  const completedSteps = progressSteps.filter((s) => s.completed).length;
  const nextIncompleteStep = progressSteps.find((s) => !s.completed);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  // Auto-collapse professional step when doctor is selected
  const handleDoctorSelect = (doctorId: string) => {
    onDoctorSelect(doctorId);
    setExpandedSteps((prev) => ({
      ...prev,
      professional: false,
      date: false,
      time: true, // Auto-open time step to show available slots
    }));
  };

  // Unlock professional step for editing
  const handleUnlockProfessional = () => {
    setExpandedSteps((prev) => ({
      ...prev,
      professional: true,
    }));
  };

  return (
    <div className="h-full flex flex-col bg-muted/5">
      {/* Patient Header */}
      <div className="p-4 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">
              {patient.firstName} {patient.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{patient.documentId}</p>
          </div>
        </div>
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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-4 pt-2 shrink-0">
          <TabsList className="w-full h-9 bg-muted/30 rounded-xl p-1">
            <TabsTrigger
              value="scheduling"
              className="flex-1 text-[10px] rounded-lg data-[state=active]:bg-background"
            >
              <CalendarIcon className="w-3 h-3 mr-1" />
              Agendar
            </TabsTrigger>
            <TabsTrigger
              value="blocks"
              className="flex-1 text-[10px] rounded-lg data-[state=active]:bg-background"
            >
              <Ban className="w-3 h-3 mr-1" />
              Bloqueos
            </TabsTrigger>
            <TabsTrigger
              value="waiting"
              className="flex-1 text-[10px] rounded-lg data-[state=active]:bg-background"
            >
              <ListTodo className="w-3 h-3 mr-1" />
              Espera
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable Content */}
        <TabsContent
          value="scheduling"
          className="flex-1 mt-0 flex flex-col min-h-0 overflow-hidden"
        >
          <div
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
            style={{ paddingBottom: "100px" }}
          >
            <div className="p-4 space-y-4">
              {/* Progress Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Progreso
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {progressSteps.map((step) => (
                      <div
                        key={step.id}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          step.completed ? "bg-lime" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {completedSteps}/{progressSteps.length}
                  </span>
                </div>
              </div>

              {/* Step 1: Professional Selection */}
              <CollapsibleStep
                step={progressSteps[0]}
                isExpanded={expandedSteps.professional}
                onToggle={() => toggleStep("professional")}
                isNext={nextIncompleteStep?.id === "professional"}
                showNextButton={!selectedDoctorId}
              >
                <DoctorSearchCombobox
                  doctors={doctors}
                  selectedDoctorId={selectedDoctorId}
                  onSelect={handleDoctorSelect}
                  isLocked={!!selectedDoctorId && !expandedSteps.professional}
                  onUnlock={handleUnlockProfessional}
                />

                {/* Doctor Schedule Info */}
                {selectedDoctorData && expandedSteps.professional && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold">Horario</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onOpenDoctorStats}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Button>
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
                  </motion.div>
                )}
              </CollapsibleStep>

              {/* Show remaining steps only after doctor selection */}
              {selectedDoctorId && (
                <>
                  {/* Step 2: Date */}
                  <CollapsibleStep
                    step={progressSteps[1]}
                    isExpanded={expandedSteps.date}
                    onToggle={() => toggleStep("date")}
                    isNext={nextIncompleteStep?.id === "date"}
                  >
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
                              {format(selectedDate, "dd MMM", { locale: es })} →{" "}
                              {format(endDate, "dd MMM", { locale: es })}
                            </span>
                          </div>
                          {recurrencePattern && (
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-muted-foreground">Patrón:</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {recurrencePattern === "daily"
                                  ? "Diario"
                                  : recurrencePattern === "weekly"
                                  ? "Semanal"
                                  : recurrencePattern === "biweekly"
                                  ? "Quincenal"
                                  : "Mensual"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Selecciona la fecha en el calendario →
                      </p>
                    </div>
                  </CollapsibleStep>

                  {/* Step 3: Time */}
                  <CollapsibleStep
                    step={progressSteps[2]}
                    isExpanded={expandedSteps.time}
                    onToggle={() => toggleStep("time")}
                    isNext={nextIncompleteStep?.id === "time"}
                  >
                    {/* Time Mode Selector */}
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground">
                        Modo de asignación
                      </Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {timeModeOptions.map((mode) => {
                          const Icon = mode.icon;
                          const isActive = timeAssignmentMode === mode.value;
                          return (
                            <button
                              key={mode.value}
                              onClick={() => onTimeAssignmentModeChange(mode.value)}
                              className={cn(
                                "p-2 rounded-lg border transition-all text-left",
                                isActive
                                  ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                  : "bg-muted/10 border-border/20 hover:bg-muted/20"
                              )}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Icon className={cn(
                                  "w-3 h-3",
                                  isActive ? "text-primary" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                  "text-[10px] font-semibold",
                                  isActive ? "text-primary" : "text-foreground"
                                )}>
                                  {mode.label}
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground leading-tight">
                                {mode.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Window Selector (only for time_window mode) */}
                    {timeAssignmentMode === "time_window" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
                      >
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Ventana de tiempo preferida
                        </Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={rangeTimeWindow.start}
                            onValueChange={(val) => onRangeTimeWindowChange({ ...rangeTimeWindow, start: val })}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Desde" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground">a</span>
                          <Select
                            value={rangeTimeWindow.end}
                            onValueChange={(val) => onRangeTimeWindowChange({ ...rangeTimeWindow, end: val })}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Hasta" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </motion.div>
                    )}

                    {/* Auto mode info */}
                    {timeAssignmentMode === "first_available" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 p-3 rounded-xl bg-lime/10 border border-lime/20"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-lime" />
                          <span className="text-xs font-medium text-lime">Modo automático</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Se asignará el primer horario disponible del día
                        </p>
                      </motion.div>
                    )}

                    {/* Selected Time Display */}
                    {selectedTime && timeAssignmentMode === "fixed" && (
                      <div className="p-3 rounded-xl bg-lime/10 border border-lime/30 mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-lime/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-lime" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-lime">{selectedTime}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Duración: {duration} min
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Available Time Slots (only for fixed mode or per_day mode) */}
                    {(timeAssignmentMode === "fixed" || timeAssignmentMode === "per_day") && (
                      <div className="space-y-2 mt-3">
                        <Label className="text-xs text-muted-foreground">
                          {timeAssignmentMode === "fixed" ? "Horarios disponibles" : "Selecciona horario para este día"}
                        </Label>
                        
                        {availableTimeSlots.length === 0 ? (
                          <div className="p-4 rounded-xl bg-muted/20 border border-border/20 text-center">
                            <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground">
                              No hay horarios disponibles para esta fecha
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              El profesional no trabaja este día o selecciona otra fecha
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 pr-1">
                            {availableTimeSlots.map((slot) => (
                              <button
                                key={slot.time}
                                onClick={() => slot.available && onTimeSelect(slot.time)}
                                disabled={!slot.available}
                                className={cn(
                                  "py-2 px-1 rounded-lg text-[11px] font-medium transition-all",
                                  !slot.available && "opacity-40 cursor-not-allowed bg-muted/20 line-through",
                                  slot.available && selectedTime === slot.time
                                    ? "bg-lime text-lime-foreground shadow-md ring-2 ring-lime/30"
                                    : slot.available
                                    ? "bg-background hover:bg-primary/10 border border-border/30"
                                    : ""
                                )}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Duration selector */}
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <Label className="text-xs mb-2 block text-muted-foreground">
                        Duración
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {durations.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => onDurationChange(d.value)}
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
                  </CollapsibleStep>

                  {/* Step 4: Reason */}
                  <CollapsibleStep
                    step={progressSteps[3]}
                    isExpanded={expandedSteps.reason}
                    onToggle={() => toggleStep("reason")}
                    isNext={nextIncompleteStep?.id === "reason"}
                  >
                    <div className="space-y-3">
                      {/* Appointment Type */}
                      <div>
                        <Label className="text-xs mb-2 block text-muted-foreground">
                          Tipo de Cita
                        </Label>
                        <AppointmentTypeInline
                          selectedType={appointmentType}
                          onSelect={onAppointmentTypeSelect}
                        />
                      </div>

                      {/* Reason text */}
                      <div>
                        <Label className="text-xs mb-2 block text-muted-foreground">
                          Motivo
                        </Label>
                        <Textarea
                          placeholder="Describe el motivo de la cita..."
                          value={reason}
                          onChange={(e) => onReasonChange(e.target.value)}
                          rows={2}
                          className="rounded-xl resize-none text-xs"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <Label className="text-xs mb-2 block text-muted-foreground">
                          Notas adicionales
                        </Label>
                        <Textarea
                          placeholder="Indicaciones especiales..."
                          value={notes}
                          onChange={(e) => onNotesChange(e.target.value)}
                          rows={2}
                          className="rounded-xl resize-none text-xs"
                        />
                      </div>
                    </div>
                  </CollapsibleStep>

                  {/* Resources - Only for procedure types */}
                  {(appointmentType === "procedure" ||
                    appointmentType === "multispecialty") && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-[10px] font-bold">5</span>
                        </div>
                        <span className="text-sm font-semibold">Recursos</span>
                      </div>
                      <ResourceAvailabilityPanel
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        duration={duration}
                        selectedResources={selectedResources}
                        onResourceToggle={onResourceToggle}
                      />
                    </div>
                  )}

                  <Separator className="bg-border/20" />

                  {/* Quick Actions */}
                  <AppointmentActionsPanel />
                </>
              )}
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="p-4 border-t border-border/20 bg-background/95 backdrop-blur-sm shrink-0 z-10">
            <Button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={cn(
                "w-full h-11 rounded-xl font-semibold text-sm transition-all",
                canSubmit &&
                  "bg-lime hover:bg-lime/90 text-lime-foreground shadow-lg shadow-lime/25"
              )}
            >
              {canSubmit ? (
                <>
                  <Check className="mr-2 w-4 h-4" />
                  Confirmar Cita
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 w-4 h-4" />
                  Completa los pasos
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="blocks" className="flex-1 mt-0 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent p-4">
            <AvailabilityBlockManager doctorId={selectedDoctorId} />
          </div>
        </TabsContent>

        <TabsContent value="waiting" className="flex-1 mt-0 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent p-4">
            <WaitingListPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Collapsible Step Component
interface CollapsibleStepProps {
  step: ProgressStep;
  isExpanded: boolean;
  onToggle: () => void;
  isNext: boolean;
  showNextButton?: boolean;
  children: React.ReactNode;
}

const CollapsibleStep: React.FC<CollapsibleStepProps> = ({
  step,
  isExpanded,
  onToggle,
  isNext,
  showNextButton,
  children,
}) => {
  const Icon = step.icon;

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        step.completed
          ? "bg-lime/5 border-lime/20"
          : isNext
          ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
          : "bg-muted/10 border-border/20"
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 text-left"
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
            step.completed
              ? "bg-lime text-lime-foreground"
              : isNext
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {step.completed ? (
            <Check className="w-4 h-4" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              step.completed && "text-lime line-through"
            )}
          >
            {step.label}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {step.description}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isNext && showNextButton && (
            <Badge className="text-[9px] bg-primary text-primary-foreground">
              Siguiente
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content - Collapsible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchedulingSidebar;
