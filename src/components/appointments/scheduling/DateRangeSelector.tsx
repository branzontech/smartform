import React, { useState } from "react";
import { motion } from "framer-motion";
import { format, addDays, eachDayOfInterval, isAfter, isBefore, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  CalendarRange,
  ChevronRight,
  Check,
  X,
  Repeat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RecurrencePattern } from "@/types/appointment-types";

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date | null;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date | null) => void;
  isRangeMode: boolean;
  onRangeModeChange: (enabled: boolean) => void;
  recurrencePattern?: RecurrencePattern;
  onRecurrenceChange?: (pattern: RecurrencePattern | undefined) => void;
  selectedDays?: number[];
  onSelectedDaysChange?: (days: number[]) => void;
  maxOccurrences?: number;
  onMaxOccurrencesChange?: (count: number) => void;
}

const dayLabels = [
  { value: 1, label: "L", fullLabel: "Lunes" },
  { value: 2, label: "M", fullLabel: "Martes" },
  { value: 3, label: "X", fullLabel: "Miércoles" },
  { value: 4, label: "J", fullLabel: "Jueves" },
  { value: 5, label: "V", fullLabel: "Viernes" },
  { value: 6, label: "S", fullLabel: "Sábado" },
  { value: 0, label: "D", fullLabel: "Domingo" },
];

const recurrenceOptions: { value: RecurrencePattern; label: string; description: string }[] = [
  { value: "daily", label: "Diario", description: "Todos los días" },
  { value: "weekly", label: "Semanal", description: "Una vez por semana" },
  { value: "biweekly", label: "Quincenal", description: "Cada dos semanas" },
  { value: "monthly", label: "Mensual", description: "Una vez al mes" },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  isRangeMode,
  onRangeModeChange,
  recurrencePattern,
  onRecurrenceChange,
  selectedDays = [1, 2, 3, 4, 5],
  onSelectedDaysChange,
  maxOccurrences = 10,
  onMaxOccurrencesChange,
}) => {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const toggleDay = (day: number) => {
    if (!onSelectedDaysChange) return;
    if (selectedDays.includes(day)) {
      onSelectedDaysChange(selectedDays.filter(d => d !== day));
    } else {
      onSelectedDaysChange([...selectedDays, day].sort());
    }
  };

  // Calculate how many appointments will be generated
  const calculateOccurrences = () => {
    if (!isRangeMode || !endDate || !recurrencePattern) return 0;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    let count = 0;
    
    days.forEach(day => {
      const dayOfWeek = day.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        switch (recurrencePattern) {
          case "daily":
            count++;
            break;
          case "weekly":
            // Count only once per week
            if (dayOfWeek === selectedDays[0]) count++;
            break;
          case "biweekly":
            // Count every two weeks
            const weekDiff = Math.floor((day.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            if (weekDiff % 2 === 0 && dayOfWeek === selectedDays[0]) count++;
            break;
          case "monthly":
            // Count once per month
            if (day.getDate() === startDate.getDate()) count++;
            break;
        }
      }
    });
    
    return Math.min(count, maxOccurrences);
  };

  const occurrences = calculateOccurrences();

  return (
    <div className="space-y-4">
      {/* Range Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/20">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs font-medium">Agendar por Rango</p>
            <p className="text-[10px] text-muted-foreground">
              Múltiples citas en un período
            </p>
          </div>
        </div>
        <Switch
          checked={isRangeMode}
          onCheckedChange={onRangeModeChange}
        />
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start Date */}
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1.5 block">
            {isRangeMode ? "Fecha inicio" : "Fecha"}
          </Label>
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-9 justify-start text-left rounded-xl text-xs font-normal"
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                {format(startDate, "dd MMM yyyy", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  if (date) {
                    onStartDateChange(date);
                    setStartOpen(false);
                  }
                }}
                disabled={(date) => isBefore(date, new Date())}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date (only in range mode) */}
        {isRangeMode && (
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">
              Fecha fin
            </Label>
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-9 justify-start text-left rounded-xl text-xs font-normal"
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  {endDate ? format(endDate, "dd MMM yyyy", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={(date) => {
                    if (date) {
                      onEndDateChange(date);
                      setEndOpen(false);
                    }
                  }}
                  disabled={(date) => isBefore(date, startDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Recurrence Options (only in range mode) */}
      {isRangeMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {/* Recurrence Pattern */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">
              Patrón de Recurrencia
            </Label>
            <Select 
              value={recurrencePattern} 
              onValueChange={(v) => onRecurrenceChange?.(v as RecurrencePattern)}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <Repeat className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Seleccionar patrón" />
              </SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-muted-foreground ml-2 text-[10px]">
                        {opt.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Selection */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">
              Días de la Semana
            </Label>
            <div className="flex gap-1">
              {dayLabels.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-medium transition-all",
                    selectedDays.includes(day.value)
                      ? "bg-lime text-lime-foreground"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                  title={day.fullLabel}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Occurrences */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">
              Máximo de Citas
            </Label>
            <div className="flex gap-1">
              {[5, 10, 15, 20, 30].map((num) => (
                <button
                  key={num}
                  onClick={() => onMaxOccurrencesChange?.(num)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                    maxOccurrences === num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {recurrencePattern && endDate && (
            <div className="p-3 rounded-xl bg-lime/10 border border-lime/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Citas a generar:
                </span>
                <Badge className="bg-lime text-lime-foreground">
                  {occurrences} cita{occurrences !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {format(startDate, "dd MMM", { locale: es })} → {format(endDate, "dd MMM yyyy", { locale: es })}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
