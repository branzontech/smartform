import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, TrendingUp, Database } from "lucide-react";
import { Professional, Shift, MonthlyShiftView, TimeSlot } from "@/types/shift-types";
import { getAllProfessionals, createMonthlyShiftView, getShiftsByMonth, generateSampleShifts } from "@/utils/shift-utils";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, startOfMonth, endOfMonth, getWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "day" | "week" | "month";

interface ShiftVisualizationProps {
  refreshTrigger?: number;
}

export function ShiftVisualization({ refreshTrigger = 0 }: ShiftVisualizationProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [monthlyView, setMonthlyView] = useState<MonthlyShiftView | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (viewMode === "month") {
      loadMonthlyView();
    } else {
      loadShifts();
    }
  }, [selectedDate, selectedProfessional, viewMode, refreshTrigger]);

  const loadProfessionals = async () => {
    try {
      const profs = await getAllProfessionals();
      setProfessionals(profs.filter(p => p.isActive));
    } catch (error) {
      console.error("Error loading professionals:", error);
    }
  };

  const loadShifts = async () => {
    try {
      setLoading(true);
      const allShifts = await getShiftsByMonth(selectedDate.getMonth(), selectedDate.getFullYear());
      
      if (selectedProfessional === "all") {
        setShifts(allShifts);
      } else {
        setShifts(allShifts.filter(shift => shift.professionalId === selectedProfessional));
      }
    } catch (error) {
      console.error("Error loading shifts:", error);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyView = async () => {
    try {
      setLoading(true);
      const view = await createMonthlyShiftView(selectedDate.getMonth(), selectedDate.getFullYear());
      setMonthlyView(view);
    } catch (error) {
      console.error("Error loading monthly view:", error);
      setMonthlyView(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSampleData = async () => {
    try {
      setGenerating(true);
      await generateSampleShifts(selectedDate.getMonth(), selectedDate.getFullYear());
      
      toast({
        title: "Datos generados",
        description: "Se han generado turnos de ejemplo para todos los profesionales",
      });
      
      // Recargar datos
      if (viewMode === "month") {
        await loadMonthlyView();
      } else {
        await loadShifts();
      }
    } catch (error) {
      console.error("Error generating sample data:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los datos de ejemplo",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const calculateHours = (timeSlots: TimeSlot[]): number => {
    return timeSlots.reduce((total, slot) => total + (slot.duration / 60), 0);
  };

  const getShiftsForDate = (date: Date): Shift[] => {
    return shifts.filter(shift => 
      format(shift.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getWeekShifts = (startDate: Date): Shift[] => {
    const weekEnd = endOfWeek(startDate, { locale: es });
    return shifts.filter(shift => 
      shift.date >= startDate && shift.date <= weekEnd
    );
  };

  const renderDayView = () => {
    const dayShifts = getShiftsForDate(selectedDate);
    const totalHours = dayShifts.reduce((total, shift) => total + calculateHours(shift.timeSlots), 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
            <Badge variant="secondary">{totalHours.toFixed(1)}h total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dayShifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay turnos asignados para este día
            </div>
          ) : (
            <div className="space-y-4">
              {dayShifts.map((shift) => (
                <div key={shift.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {shift.professionalName}
                    </h4>
                    <Badge variant={shift.status === 'Asignado' ? 'default' : 'secondary'}>
                      {shift.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {shift.timeSlots.map((slot, index) => (
                      <div key={slot.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {slot.startTime} - {slot.endTime} ({(slot.duration / 60).toFixed(1)}h)
                        </span>
                      </div>
                    ))}
                  </div>
                  {shift.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{shift.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { locale: es });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart, { locale: es })
    });
    const weekShifts = getWeekShifts(weekStart);
    const totalWeekHours = weekShifts.reduce((total, shift) => total + calculateHours(shift.timeSlots), 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Semana del {format(weekStart, "d 'de' MMMM", { locale: es })}
            </span>
            <Badge variant="secondary">{totalWeekHours.toFixed(1)}h total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayShifts = getShiftsForDate(day);
              const dayHours = dayShifts.reduce((total, shift) => total + calculateHours(shift.timeSlots), 0);
              
              return (
                <div key={day.toString()} className="border rounded-lg p-3">
                  <div className="text-center mb-2">
                    <p className="font-medium text-sm">{format(day, "EEE", { locale: es })}</p>
                    <p className="text-lg font-bold">{format(day, "d")}</p>
                    {dayHours > 0 && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {dayHours.toFixed(1)}h
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayShifts.map((shift) => (
                      <div key={shift.id} className="text-xs p-1 bg-primary/10 rounded">
                        <p className="font-medium truncate">{shift.professionalName}</p>
                        <p className="text-muted-foreground">
                          {shift.timeSlots.length} turno{shift.timeSlots.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMonthView = () => {
    if (!monthlyView) return null;

    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const totalMonthHours = shifts.reduce((total, shift) => total + calculateHours(shift.timeSlots), 0);

    return (
      <div className="space-y-6">
        {/* Resumen del mes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumen de {format(selectedDate, "MMMM yyyy", { locale: es })}
              </span>
              <Badge variant="secondary">{totalMonthHours.toFixed(1)}h total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{shifts.length}</p>
                <p className="text-sm text-muted-foreground">Turnos totales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {shifts.filter(s => s.status === 'Asignado').length}
                </p>
                <p className="text-sm text-muted-foreground">Asignados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {shifts.filter(s => s.status === 'Disponible').length}
                </p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {professionals.length}
                </p>
                <p className="text-sm text-muted-foreground">Profesionales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vista por semanas */}
        {monthlyView.weeks.map((week, weekIndex) => {
          const weekShifts = shifts.filter(shift => {
            const shiftWeek = getWeek(shift.date, { locale: es });
            return shiftWeek === week.weekNumber;
          });
          const weekHours = weekShifts.reduce((total, shift) => total + calculateHours(shift.timeSlots), 0);

          return (
            <Card key={weekIndex}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>
                    Semana {week.weekNumber} ({format(week.startDate, "d MMM", { locale: es })} - {format(week.endDate, "d MMM", { locale: es })})
                  </span>
                  <Badge variant="outline">{weekHours.toFixed(1)}h</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {week.days.map((day) => {
                    const dayShifts = getShiftsForDate(day.date);
                    const dayHours = dayShifts.reduce((total, shift) => total + calculateHours(shift.timeSlots), 0);
                    const isCurrentMonth = day.isCurrentMonth;

                    return (
                      <div
                        key={day.date.toString()}
                        className={`border rounded-lg p-2 min-h-[120px] ${
                          !isCurrentMonth ? 'opacity-40 bg-muted/30' : ''
                        }`}
                      >
                        <div className="text-center mb-2">
                          <p className="text-xs font-medium">{day.dayName.slice(0, 3)}</p>
                          <p className="text-lg font-bold">{format(day.date, "d")}</p>
                          {dayHours > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {dayHours.toFixed(1)}h
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayShifts.slice(0, 2).map((shift) => (
                            <div key={shift.id} className="text-xs p-1 bg-primary/10 rounded">
                              <p className="font-medium truncate">{shift.professionalName}</p>
                              <p className="text-muted-foreground">
                                {shift.timeSlots.length} turno{shift.timeSlots.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          ))}
                          {dayShifts.length > 2 && (
                            <div className="text-xs text-center text-muted-foreground">
                              +{dayShifts.length - 2} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Visualización de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Modo de vista */}
            <div>
              <label className="text-sm font-medium mb-2 block">Modo de Vista</label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("day")}
                >
                  Día
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                >
                  Semana
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                >
                  Mes
                </Button>
              </div>
            </div>

            {/* Selector de fecha */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {viewMode === "month" ? "Mes/Año" : "Fecha"}
              </label>
              <input
                type={viewMode === "month" ? "month" : "date"}
                value={viewMode === "month" 
                  ? format(selectedDate, "yyyy-MM") 
                  : format(selectedDate, "yyyy-MM-dd")
                }
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Selector de profesional */}
            <div>
              <label className="text-sm font-medium mb-2 block">Profesional</label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los profesionales</SelectItem>
                  {professionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name} - {prof.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Botón para generar datos de ejemplo */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Datos de ejemplo</p>
                <p className="text-xs text-muted-foreground">
                  Genera turnos para todos los profesionales ({professionals.length} médicos disponibles)
                </p>
              </div>
              <Button 
                onClick={handleGenerateSampleData}
                disabled={generating}
                variant="outline"
                className="flex items-center gap-2"
              >
                {generating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Database className="h-4 w-4" />
                )}
                {generating ? "Generando..." : "Generar Datos"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista principal */}
      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span>Cargando turnos...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
        </>
      )}
    </div>
  );
}