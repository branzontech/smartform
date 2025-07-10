import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Search, Users, AlertCircle, Save } from "lucide-react";
import { Shift, Professional, TimeSlot } from "@/types/shift-types";
import { getAllShifts, getAllProfessionals, reassignShift } from "@/utils/shift-utils";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/App";

export default function ShiftModification() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [searchDate, setSearchDate] = useState("");
  const [searchProfessional, setSearchProfessional] = useState("");
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para reasignación
  const [newProfessionalId, setNewProfessionalId] = useState("");
  const [reassignmentReason, setReassignmentReason] = useState("");
  const [isPartialReassignment, setIsPartialReassignment] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterShifts();
  }, [shifts, searchDate, searchProfessional]);

  // Verificar si hay parámetros en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shiftId = urlParams.get('shiftId');
    
    if (shiftId && shifts.length > 0) {
      const shift = shifts.find(s => s.id === shiftId);
      if (shift) {
        setSelectedShift(shift);
      }
    }
  }, [shifts]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftData, profData] = await Promise.all([
        getAllShifts(),
        getAllProfessionals()
      ]);
      
      setShifts(shiftData);
      setProfessionals(profData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterShifts = () => {
    let filtered = [...shifts];
    
    if (searchDate) {
      const searchDateObj = new Date(searchDate);
      filtered = filtered.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.toDateString() === searchDateObj.toDateString();
      });
    }
    
    if (searchProfessional && searchProfessional !== "all") {
      filtered = filtered.filter(shift => 
        shift.professionalId === searchProfessional
      );
    }
    
    // Ordenar por fecha
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setFilteredShifts(filtered);
  };

  const handleShiftSelect = (shift: Shift) => {
    setSelectedShift(shift);
    setNewProfessionalId("");
    setReassignmentReason("");
    setIsPartialReassignment(false);
    setSelectedTimeSlots([]);
  };

  const handleTimeSlotToggle = (slotId: string) => {
    if (selectedTimeSlots.includes(slotId)) {
      setSelectedTimeSlots(selectedTimeSlots.filter(id => id !== slotId));
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, slotId]);
    }
  };

  const handleReassignment = async () => {
    if (!selectedShift || !newProfessionalId || !reassignmentReason.trim()) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (isPartialReassignment && selectedTimeSlots.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un horario para la reasignación parcial",
        variant: "destructive",
      });
      return;
    }

    if (isPartialReassignment && selectedTimeSlots.length === selectedShift.timeSlots.length) {
      toast({
        title: "Advertencia",
        description: "Has seleccionado todos los horarios. ¿Quieres hacer una reasignación completa en su lugar?",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      await reassignShift(
        selectedShift.id,
        newProfessionalId,
        reassignmentReason,
        isPartialReassignment,
        isPartialReassignment ? selectedTimeSlots : undefined
      );

      toast({
        title: "Éxito",
        description: `Turno ${isPartialReassignment ? 'parcialmente ' : ''}reasignado correctamente`,
      });

      // Recargar datos y limpiar selección
      await loadData();
      setSelectedShift(null);
      setNewProfessionalId("");
      setReassignmentReason("");
      setIsPartialReassignment(false);
      setSelectedTimeSlots([]);

    } catch (error) {
      console.error("Error reassigning shift:", error);
      toast({
        title: "Error",
        description: "No se pudo reasignar el turno",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getShiftStatusColor = (status: string) => {
    const colors = {
      'Asignado': 'bg-green-100 text-green-800',
      'Disponible': 'bg-blue-100 text-blue-800',
      'Incapacidad': 'bg-red-100 text-red-800',
      'Vacaciones': 'bg-yellow-100 text-yellow-800',
      'Reasignado': 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading && shifts.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-form-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando turnos...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Edit className="h-8 w-8 text-form-primary" />
            Modificar Turnos
          </h1>
          <p className="text-gray-600 mt-2">
            Reasigna turnos cuando los profesionales no estén disponibles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de búsqueda y lista de turnos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Turnos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search-date">Filtrar por Fecha</Label>
                  <Input
                    id="search-date"
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="search-professional">Filtrar por Profesional</Label>
                  <Select value={searchProfessional} onValueChange={setSearchProfessional}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los profesionales" />
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

              {/* Lista de turnos */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredShifts.map((shift) => (
                  <div
                    key={shift.id}
                    onClick={() => handleShiftSelect(shift)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedShift?.id === shift.id ? 'ring-2 ring-form-primary bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{shift.professionalName}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(shift.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge className={getShiftStatusColor(shift.status)}>
                        {shift.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Turnos: {shift.timeSlots.length}</span>
                      {shift.timeSlots.length > 0 && (
                        <span>
                          {shift.timeSlots[0].startTime} - {shift.timeSlots[shift.timeSlots.length - 1].endTime}
                        </span>
                      )}
                    </div>
                    
                    {shift.status === 'Reasignado' && (
                      <div className="mt-2 p-2 bg-orange-50 rounded text-xs">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        {shift.isPartialReassignment ? 'Reasignación parcial' : 'Reasignado completamente'}
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredShifts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron turnos con los filtros aplicados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Panel de reasignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reasignar Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedShift ? (
                <div className="space-y-4">
                  {/* Información del turno seleccionado */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Turno Seleccionado</h4>
                    <p className="text-sm"><strong>Profesional:</strong> {selectedShift.professionalName}</p>
                    <p className="text-sm">
                      <strong>Fecha:</strong> {new Date(selectedShift.date).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-sm"><strong>Estado:</strong> {selectedShift.status}</p>
                  </div>

                  {/* Seleccionar nuevo profesional */}
                  <div>
                    <Label htmlFor="new-professional">Nuevo Profesional</Label>
                    <Select value={newProfessionalId} onValueChange={setNewProfessionalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals
                          .filter(prof => prof.id !== selectedShift.professionalId && prof.isActive)
                          .map((prof) => (
                            <SelectItem key={prof.id} value={prof.id}>
                              {prof.name} - {prof.specialty}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de reasignación */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="partial-reassignment"
                      checked={isPartialReassignment}
                      onCheckedChange={(checked) => setIsPartialReassignment(checked === true)}
                    />
                    <label htmlFor="partial-reassignment" className="text-sm font-medium">
                      Reasignación parcial
                    </label>
                  </div>

                  {/* Seleccionar horarios para reasignación parcial */}
                  {isPartialReassignment && (
                    <div>
                      <Label>Seleccionar Horarios a Reasignar</Label>
                      <div className="space-y-2 mt-2">
                        {selectedShift.timeSlots.map((slot, index) => (
                          <div key={slot.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`slot-${slot.id}`}
                              checked={selectedTimeSlots.includes(slot.id)}
                              onCheckedChange={(checked) => {
                                if (checked === true) {
                                  setSelectedTimeSlots([...selectedTimeSlots, slot.id]);
                                } else {
                                  setSelectedTimeSlots(selectedTimeSlots.filter(id => id !== slot.id));
                                }
                              }}
                            />
                            <label htmlFor={`slot-${slot.id}`} className="text-sm">
                              Turno {index + 1}: {slot.startTime} - {slot.endTime}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Motivo de reasignación */}
                  <div>
                    <Label htmlFor="reason">Motivo de Reasignación</Label>
                    <Textarea
                      id="reason"
                      placeholder="Explica el motivo de la reasignación..."
                      value={reassignmentReason}
                      onChange={(e) => setReassignmentReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Botón de reasignar */}
                  <Button 
                    onClick={handleReassignment}
                    disabled={loading || !newProfessionalId || !reassignmentReason.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Reasignar Turno
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un turno para modificar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
