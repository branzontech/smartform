
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  X, 
  AlertTriangle, 
  User, 
  Search,
  PlusCircle,
  Bell,
  Edit
} from "lucide-react";
import { FollowUp, FollowUpStatus, PatientAlert, Patient } from "@/types/patient-types";
import { format, differenceInDays, isPast, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

interface PatientFollowUpsProps {
  patientId?: string;
  className?: string;
  limit?: number;
}

export function PatientFollowUps({ patientId, className, limit = 5 }: PatientFollowUpsProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | 'all'>('all');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  
  // Estado para el nuevo seguimiento
  const [newFollowUp, setNewFollowUp] = useState({
    patientId: patientId || '',
    followUpDate: new Date(),
    reason: '',
    notes: '',
    status: 'Pendiente' as FollowUpStatus,
    createAlert: true,
    alertPriority: 'Media' as 'Alta' | 'Media' | 'Baja',
    reminderDays: 2
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Cargar pacientes
      const savedPatients = localStorage.getItem('patients');
      if (savedPatients) {
        try {
          const parsedPatients = JSON.parse(savedPatients);
          setPatients(parsedPatients);
        } catch (error) {
          console.error('Error parsing patients:', error);
          setPatients([]);
        }
      }
      
      // Cargar seguimientos
      const savedFollowUps = localStorage.getItem('followUps');
      if (savedFollowUps) {
        try {
          let parsedFollowUps = JSON.parse(savedFollowUps);
          
          // Convertir fechas
          parsedFollowUps = parsedFollowUps.map((followUp: any) => ({
            ...followUp,
            followUpDate: new Date(followUp.followUpDate),
            createdAt: new Date(followUp.createdAt),
            reminderDate: followUp.reminderDate ? new Date(followUp.reminderDate) : undefined
          }));
          
          // Filtrar por paciente si se proporciona un ID
          if (patientId) {
            parsedFollowUps = parsedFollowUps.filter((followUp: FollowUp) => followUp.patientId === patientId);
          }
          
          // Ordenar por fecha
          parsedFollowUps.sort((a: FollowUp, b: FollowUp) => a.followUpDate.getTime() - b.followUpDate.getTime());
          
          setFollowUps(parsedFollowUps);
        } catch (error) {
          console.error('Error parsing follow-ups:', error);
          setFollowUps([]);
        }
      } else {
        setFollowUps([]);
      }
      
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [patientId]);

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Paciente desconocido';
  };

  const handleStatusChange = (followUpId: string, newStatus: FollowUpStatus) => {
    // Actualizar el estado del seguimiento en localStorage
    const savedFollowUps = localStorage.getItem('followUps');
    if (savedFollowUps) {
      const parsedFollowUps = JSON.parse(savedFollowUps);
      const updatedFollowUps = parsedFollowUps.map((followUp: any) => {
        if (followUp.id === followUpId) {
          return {
            ...followUp,
            status: newStatus
          };
        }
        return followUp;
      });
      
      localStorage.setItem('followUps', JSON.stringify(updatedFollowUps));
      
      // Actualizar el estado local
      setFollowUps(followUps.map(followUp => {
        if (followUp.id === followUpId) {
          return {
            ...followUp,
            status: newStatus
          };
        }
        return followUp;
      }));
      
      // Actualizar la alerta correspondiente si existe
      const savedAlerts = localStorage.getItem('patientAlerts');
      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts);
        const updatedAlerts = parsedAlerts.map((alert: any) => {
          if (alert.followUpId === followUpId) {
            return {
              ...alert,
              status: newStatus === 'Completado' ? 'Completada' : 
                     newStatus === 'Cancelado' ? 'Cancelada' : 'Pendiente',
              dismissedAt: (newStatus === 'Completado' || newStatus === 'Cancelado') 
                ? new Date().toISOString() 
                : undefined
            };
          }
          return alert;
        });
        
        localStorage.setItem('patientAlerts', JSON.stringify(updatedAlerts));
      }
      
      toast({
        title: `Seguimiento ${newStatus.toLowerCase()}`,
        description: `El seguimiento ha sido marcado como ${newStatus.toLowerCase()}`,
      });
    }
  };

  const handleCreateFollowUp = () => {
    if (!newFollowUp.patientId || !newFollowUp.reason) {
      toast({
        title: "Datos incompletos",
        description: "Por favor complete los campos requeridos",
        variant: "destructive"
      });
      return;
    }
    
    const followUpId = nanoid();
    
    // Crear el objeto de seguimiento
    const followUp: FollowUp = {
      id: followUpId,
      patientId: newFollowUp.patientId,
      consultationId: '', // No está asociado a una consulta específica
      followUpDate: newFollowUp.followUpDate,
      reason: newFollowUp.reason,
      status: newFollowUp.status,
      notes: newFollowUp.notes,
      createdAt: new Date(),
      reminderSent: false
    };
    
    // Guardar el seguimiento
    const savedFollowUps = localStorage.getItem('followUps');
    const existingFollowUps = savedFollowUps ? JSON.parse(savedFollowUps) : [];
    const updatedFollowUps = [...existingFollowUps, followUp];
    localStorage.setItem('followUps', JSON.stringify(updatedFollowUps));
    
    // Si se habilitó el recordatorio, crear la alerta
    if (newFollowUp.createAlert) {
      const reminderDate = new Date(newFollowUp.followUpDate);
      reminderDate.setDate(reminderDate.getDate() - newFollowUp.reminderDays);
      
      const patientName = getPatientName(newFollowUp.patientId);
      
      const newAlert: PatientAlert = {
        id: nanoid(),
        patientId: newFollowUp.patientId,
        patientName,
        followUpId,
        type: 'Seguimiento',
        message: `Próximo seguimiento: ${newFollowUp.reason}`,
        dueDate: newFollowUp.followUpDate,
        status: 'Pendiente',
        priority: newFollowUp.alertPriority,
        createdAt: new Date()
      };
      
      // Guardar la alerta
      const savedAlerts = localStorage.getItem('patientAlerts');
      const existingAlerts = savedAlerts ? JSON.parse(savedAlerts) : [];
      const updatedAlerts = [...existingAlerts, newAlert];
      localStorage.setItem('patientAlerts', JSON.stringify(updatedAlerts));
    }
    
    // Actualizar el estado local
    setFollowUps([...followUps, followUp]);
    
    // Resetear el formulario y cerrar el diálogo
    setNewFollowUp({
      patientId: patientId || '',
      followUpDate: new Date(),
      reason: '',
      notes: '',
      status: 'Pendiente',
      createAlert: true,
      alertPriority: 'Media',
      reminderDays: 2
    });
    
    setOpenCreateDialog(false);
    
    toast({
      title: "Seguimiento creado",
      description: "El seguimiento ha sido creado exitosamente",
    });
  };

  const handleUpdateFollowUp = () => {
    if (!selectedFollowUp || !newFollowUp.reason) {
      toast({
        title: "Datos incompletos",
        description: "Por favor complete los campos requeridos",
        variant: "destructive"
      });
      return;
    }
    
    // Actualizar el seguimiento en localStorage
    const savedFollowUps = localStorage.getItem('followUps');
    if (savedFollowUps) {
      const parsedFollowUps = JSON.parse(savedFollowUps);
      const updatedFollowUps = parsedFollowUps.map((followUp: any) => {
        if (followUp.id === selectedFollowUp.id) {
          return {
            ...followUp,
            followUpDate: newFollowUp.followUpDate.toISOString(),
            reason: newFollowUp.reason,
            notes: newFollowUp.notes,
            status: newFollowUp.status
          };
        }
        return followUp;
      });
      
      localStorage.setItem('followUps', JSON.stringify(updatedFollowUps));
      
      // Actualizar el estado local
      setFollowUps(followUps.map(followUp => {
        if (followUp.id === selectedFollowUp.id) {
          return {
            ...followUp,
            followUpDate: newFollowUp.followUpDate,
            reason: newFollowUp.reason,
            notes: newFollowUp.notes,
            status: newFollowUp.status
          };
        }
        return followUp;
      }));
      
      // Actualizar la alerta correspondiente si existe
      const savedAlerts = localStorage.getItem('patientAlerts');
      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts);
        const updatedAlerts = parsedAlerts.map((alert: any) => {
          if (alert.followUpId === selectedFollowUp.id) {
            return {
              ...alert,
              dueDate: newFollowUp.followUpDate.toISOString(),
              message: `Próximo seguimiento: ${newFollowUp.reason}`,
              status: newFollowUp.status === 'Completado' ? 'Completada' : 
                     newFollowUp.status === 'Cancelado' ? 'Cancelada' : 'Pendiente'
            };
          }
          return alert;
        });
        
        localStorage.setItem('patientAlerts', JSON.stringify(updatedAlerts));
      }
      
      toast({
        title: "Seguimiento actualizado",
        description: "Los cambios han sido guardados",
      });
      
      setOpenEditDialog(false);
    }
  };

  const handleEdit = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setNewFollowUp({
      patientId: followUp.patientId,
      followUpDate: followUp.followUpDate,
      reason: followUp.reason,
      notes: followUp.notes || '',
      status: followUp.status,
      createAlert: true,
      alertPriority: 'Media',
      reminderDays: 2
    });
    setOpenEditDialog(true);
  };

  const navigateToPatient = (patientId: string) => {
    navigate(`/pacientes/${patientId}`);
  };

  const getFollowUpStatusBadge = (followUp: FollowUp) => {
    if (followUp.status === 'Completado') {
      return (
        <Badge className="bg-green-500 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Completado
        </Badge>
      );
    } else if (followUp.status === 'Cancelado') {
      return (
        <Badge variant="outline" className="border-gray-500 text-gray-700 flex items-center gap-1">
          <X className="h-3 w-3" />
          Cancelado
        </Badge>
      );
    } else {
      // Es pendiente, verificar fechas
      const isPastDue = isPast(followUp.followUpDate) && !isToday(followUp.followUpDate);
      const isToday_ = isToday(followUp.followUpDate);
      const isTomorrow_ = isTomorrow(followUp.followUpDate);
      
      if (isPastDue) {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Vencido</span>
          </Badge>
        );
      } else if (isToday_) {
        return (
          <Badge variant="default" className="bg-yellow-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Hoy</span>
          </Badge>
        );
      } else if (isTomorrow_) {
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>Mañana</span>
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700 flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>Pendiente</span>
          </Badge>
        );
      }
    }
  };

  // Filtrar seguimientos
  const filteredFollowUps = followUps
    .filter(followUp => {
      // Filtrar por estado
      if (statusFilter !== 'all' && followUp.status !== statusFilter) {
        return false;
      }
      
      // Filtrar por búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const patientName = getPatientName(followUp.patientId).toLowerCase();
        
        return (
          patientName.includes(term) ||
          followUp.reason.toLowerCase().includes(term) ||
          (followUp.notes && followUp.notes.toLowerCase().includes(term))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Ordenar: primero los pendientes por fecha, luego completados, luego cancelados
      if (a.status === 'Pendiente' && b.status !== 'Pendiente') return -1;
      if (a.status !== 'Pendiente' && b.status === 'Pendiente') return 1;
      
      if (a.status === 'Pendiente' && b.status === 'Pendiente') {
        return a.followUpDate.getTime() - b.followUpDate.getTime();
      }
      
      return b.followUpDate.getTime() - a.followUpDate.getTime();
    })
    .slice(0, limit); // Limitar resultados si es necesario

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2" />
            Seguimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-lg">
            <CalendarIcon className="mr-2 text-purple-500" />
            Seguimientos programados
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setOpenCreateDialog(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <PlusCircle className="mr-1 h-4 w-4" />
            Nuevo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar seguimientos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as FollowUpStatus | 'all')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Completado">Completado</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {filteredFollowUps.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No hay seguimientos programados</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => setOpenCreateDialog(true)}
            >
              <PlusCircle className="mr-1 h-4 w-4" />
              Crear seguimiento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFollowUps.map(followUp => {
              const isPastDue = isPast(followUp.followUpDate) && !isToday(followUp.followUpDate);
              const isToday_ = isToday(followUp.followUpDate);
              
              return (
                <div 
                  key={followUp.id}
                  className={`p-3 rounded-lg border ${
                    followUp.status === 'Completado' 
                      ? 'bg-green-50 border-green-200' :
                    followUp.status === 'Cancelado'
                      ? 'bg-gray-50 border-gray-200' :
                    isPastDue
                      ? 'bg-red-50 border-red-200' :
                    isToday_
                      ? 'bg-yellow-50 border-yellow-200' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getFollowUpStatusBadge(followUp)}
                        
                        {!patientId && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 p-1" 
                            onClick={() => navigateToPatient(followUp.patientId)}
                          >
                            <User className="h-3 w-3 mr-1" />
                            {getPatientName(followUp.patientId)}
                          </Button>
                        )}
                      </div>
                      
                      <h4 className="font-medium">
                        {followUp.reason}
                      </h4>
                      
                      {followUp.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {followUp.notes}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Fecha: {format(followUp.followUpDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                    
                    <div className="flex space-x-1">
                      {followUp.status === 'Pendiente' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0" 
                          onClick={() => handleEdit(followUp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {followUp.status === 'Pendiente' && (
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-200">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleStatusChange(followUp.id, 'Cancelado')}
                      >
                        <X className="h-3 w-3 mr-1" /> Cancelar
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="h-7 bg-green-600 hover:bg-green-700 text-xs"
                        onClick={() => handleStatusChange(followUp.id, 'Completado')}
                      >
                        <Check className="h-3 w-3 mr-1" /> Completar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Diálogo para crear un nuevo seguimiento */}
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear nuevo seguimiento</DialogTitle>
              <DialogDescription>
                Programe un seguimiento para un paciente y configure alertas
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {!patientId && (
                <div className="space-y-2">
                  <Label htmlFor="patientId">Paciente *</Label>
                  <Select 
                    value={newFollowUp.patientId} 
                    onValueChange={(value) => setNewFollowUp({...newFollowUp, patientId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Fecha de seguimiento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newFollowUp.followUpDate, "PPP", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newFollowUp.followUpDate}
                      onSelect={(date) => date && setNewFollowUp({...newFollowUp, followUpDate: date})}
                      locale={es}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo del seguimiento *</Label>
                <Input
                  id="reason"
                  value={newFollowUp.reason}
                  onChange={(e) => setNewFollowUp({...newFollowUp, reason: e.target.value})}
                  placeholder="Ej: Control de presión arterial"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp({...newFollowUp, notes: e.target.value})}
                  placeholder="Instrucciones o detalles adicionales"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newFollowUp.createAlert}
                    onChange={(e) => setNewFollowUp({...newFollowUp, createAlert: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="flex items-center">
                    <Bell className="h-4 w-4 mr-1 text-purple-500" />
                    Crear alerta para este seguimiento
                  </span>
                </Label>
                
                {newFollowUp.createAlert && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="reminderDays">Días de anticipación</Label>
                      <Input
                        id="reminderDays"
                        type="number"
                        min={1}
                        max={30}
                        value={newFollowUp.reminderDays}
                        onChange={(e) => setNewFollowUp({...newFollowUp, reminderDays: parseInt(e.target.value) || 2})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="alertPriority">Prioridad</Label>
                      <Select 
                        value={newFollowUp.alertPriority} 
                        onValueChange={(value) => setNewFollowUp({...newFollowUp, alertPriority: value as 'Alta' | 'Media' | 'Baja'})}
                      >
                        <SelectTrigger id="alertPriority">
                          <SelectValue placeholder="Seleccionar prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                          <SelectItem value="Baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateFollowUp}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para editar un seguimiento */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar seguimiento</DialogTitle>
              <DialogDescription>
                Actualice los detalles del seguimiento programado
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Fecha de seguimiento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newFollowUp.followUpDate, "PPP", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newFollowUp.followUpDate}
                      onSelect={(date) => date && setNewFollowUp({...newFollowUp, followUpDate: date})}
                      locale={es}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo del seguimiento *</Label>
                <Input
                  id="reason"
                  value={newFollowUp.reason}
                  onChange={(e) => setNewFollowUp({...newFollowUp, reason: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp({...newFollowUp, notes: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select 
                  value={newFollowUp.status} 
                  onValueChange={(value) => setNewFollowUp({...newFollowUp, status: value as FollowUpStatus})}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Completado">Completado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEditDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateFollowUp}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
