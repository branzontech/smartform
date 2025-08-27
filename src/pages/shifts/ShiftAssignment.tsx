
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarPlus, Clock, Save, Users, Eye } from "lucide-react";
import { Professional, TimeSlot } from "@/types/shift-types";
import { getAllProfessionals, assignShifts, generateMonthlyShifts } from "@/utils/shift-utils";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/App";
import { Calendar } from "@/components/ui/calendar";
import { ShiftVisualization } from "@/components/shifts/ShiftVisualization";

export default function ShiftAssignment() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: "morning", startTime: "08:00", endTime: "12:00", duration: 240 },
    { id: "afternoon", startTime: "14:00", endTime: "18:00", duration: 240 },
  ]);
  const [loading, setLoading] = useState(false);
  const [generateMode, setGenerateMode] = useState<"manual" | "auto">("manual");
  const [autoMonth, setAutoMonth] = useState(new Date().getMonth());
  const [autoYear, setAutoYear] = useState(new Date().getFullYear());
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lunes a Viernes
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      const profs = await getAllProfessionals();
      setProfessionals(profs.filter(p => p.isActive));
    } catch (error) {
      console.error("Error loading professionals:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los profesionales",
        variant: "destructive",
      });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = selectedDates.some(d => d.toDateString() === date.toDateString());
    if (dateExists) {
      setSelectedDates(selectedDates.filter(d => d.toDateString() !== date.toDateString()));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleTimeSlotChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index][field] = value;
    
    // Calcular duración automáticamente
    if (field === 'startTime' || field === 'endTime') {
      const start = new Date(`1970-01-01T${updatedSlots[index].startTime}`);
      const end = new Date(`1970-01-01T${updatedSlots[index].endTime}`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutos
      updatedSlots[index].duration = duration > 0 ? duration : 0;
    }
    
    setTimeSlots(updatedSlots);
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      startTime: "09:00",
      endTime: "12:00",
      duration: 180,
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const handleWorkDayToggle = (dayIndex: number) => {
    if (workDays.includes(dayIndex)) {
      setWorkDays(workDays.filter(d => d !== dayIndex));
    } else {
      setWorkDays([...workDays, dayIndex]);
    }
  };

  const handleManualAssignment = async () => {
    if (!selectedProfessional || selectedDates.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona un profesional y al menos una fecha",
        variant: "destructive",
      });
      return;
    }

    if (timeSlots.length === 0) {
      toast({
        title: "Error",
        description: "Agrega al menos un turno de tiempo",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await assignShifts(selectedProfessional, selectedDates, timeSlots);
      
      toast({
        title: "Éxito",
        description: `Se asignaron ${selectedDates.length} turnos correctamente`,
      });
      
      // Limpiar formulario
      setSelectedDates([]);
      setSelectedProfessional("");
      
      // Actualizar visualización
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error assigning shifts:", error);
      toast({
        title: "Error",
        description: "No se pudieron asignar los turnos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGeneration = async () => {
    if (!selectedProfessional || workDays.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona un profesional y al menos un día de trabajo",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await generateMonthlyShifts(selectedProfessional, autoMonth, autoYear, workDays, timeSlots);
      
      toast({
        title: "Éxito",
        description: `Se generaron los turnos para ${new Date(autoYear, autoMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      });
      
      setSelectedProfessional("");
      
      // Actualizar visualización
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error generating shifts:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los turnos automáticamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { index: 1, name: "Lunes" },
    { index: 2, name: "Martes" },
    { index: 3, name: "Miércoles" },
    { index: 4, name: "Jueves" },
    { index: 5, name: "Viernes" },
    { index: 6, name: "Sábado" },
    { index: 0, name: "Domingo" },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarPlus className="h-8 w-8 text-form-primary" />
            Gestión de Turnos
          </h1>
          <p className="text-gray-600 mt-2">
            Asigna y visualiza turnos de los profesionales
          </p>
        </div>

        <Tabs defaultValue="assign" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Asignar Turnos
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Turnos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuración del profesional */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Seleccionar Profesional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="professional">Profesional</Label>
                    <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.name} - {prof.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Modo de asignación */}
                  <div>
                    <Label>Modo de Asignación</Label>
                    <div className="flex gap-4 mt-2">
                      <Button
                        variant={generateMode === "manual" ? "default" : "outline"}
                        onClick={() => setGenerateMode("manual")}
                        className="flex-1"
                      >
                        Manual
                      </Button>
                      <Button
                        variant={generateMode === "auto" ? "default" : "outline"}
                        onClick={() => setGenerateMode("auto")}
                        className="flex-1"
                      >
                        Automático
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración de horarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Configurar Horarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {timeSlots.map((slot, index) => (
                    <div key={slot.id} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Hora Inicio</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Hora Fin</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <Label>Min</Label>
                        <Input
                          type="number"
                          value={slot.duration}
                          readOnly
                          className="text-center bg-gray-50"
                        />
                      </div>
                      {timeSlots.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTimeSlot(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button variant="outline" onClick={addTimeSlot} className="w-full">
                    + Agregar Horario
                  </Button>
                </CardContent>
              </Card>

              {/* Configuración específica según el modo */}
              {generateMode === "manual" ? (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Seleccionar Fechas Específicas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Calendar
                          mode="multiple"
                          selected={selectedDates}
                          onSelect={(dates) => dates && setSelectedDates(dates)}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Fechas Seleccionadas ({selectedDates.length})</h4>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {selectedDates.map((date, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm">
                                {date.toLocaleDateString('es-ES', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDateSelect(date)}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Generación Automática Mensual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="month">Mes</Label>
                        <Select value={autoMonth.toString()} onValueChange={(value) => setAutoMonth(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 12}, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="year">Año</Label>
                        <Input
                          type="number"
                          value={autoYear}
                          onChange={(e) => setAutoYear(parseInt(e.target.value))}
                          min={new Date().getFullYear()}
                          max={new Date().getFullYear() + 5}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Días de Trabajo</Label>
                      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                        {weekDays.map((day) => (
                          <div key={day.index} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.index}`}
                              checked={workDays.includes(day.index)}
                              onCheckedChange={() => handleWorkDayToggle(day.index)}
                            />
                            <label
                              htmlFor={`day-${day.index}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {day.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botones de acción */}
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex gap-4 justify-end">
                    <Button variant="outline" onClick={() => window.location.href = '/app/turnos'}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={generateMode === "manual" ? handleManualAssignment : handleAutoGeneration}
                      disabled={loading || !selectedProfessional}
                      className="min-w-32"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {generateMode === "manual" ? "Asignar Turnos" : "Generar Automáticamente"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="view" className="space-y-6">
            <ShiftVisualization refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
