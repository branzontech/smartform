
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, Filter, Search, Stethoscope, CalendarDays, CheckCircle, XCircle, AlertCircle, X, CalendarX, CalendarCheck, Users, Check } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Appointment, AppointmentStatus, AppointmentView, Doctor } from "@/types/patient-types";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Datos mock de médicos disponibles
const mockDoctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. Carlos López",
    specialty: "Medicina General",
    documentId: "12345678",
    licenseNumber: "MED-001",
    contactNumber: "+58-212-555-0101",
    email: "carlos.lopez@hospital.com",
    createdAt: new Date(),
    status: "Activo",
    specialties: ["Medicina General", "Consulta Externa"]
  },
  {
    id: "2", 
    name: "Dra. María Rodríguez",
    specialty: "Cardiología",
    documentId: "23456789",
    licenseNumber: "MED-002",
    contactNumber: "+58-212-555-0102",
    email: "maria.rodriguez@hospital.com",
    createdAt: new Date(),
    status: "Activo",
    specialties: ["Cardiología", "Medicina Interna"]
  },
  {
    id: "3",
    name: "Dr. José Martínez",
    specialty: "Dermatología",
    documentId: "34567890",
    licenseNumber: "MED-003",
    contactNumber: "+58-212-555-0103",
    email: "jose.martinez@hospital.com",
    createdAt: new Date(),
    status: "Activo",
    specialties: ["Dermatología", "Cirugía Dermatológica"]
  },
  {
    id: "4",
    name: "Dra. Ana Fernández",
    specialty: "Pediatría",
    documentId: "45678901",
    licenseNumber: "MED-004",
    contactNumber: "+58-212-555-0104",
    email: "ana.fernandez@hospital.com",
    createdAt: new Date(),
    status: "Activo",
    specialties: ["Pediatría", "Neonatología"]
  },
  {
    id: "5",
    name: "Dr. Roberto García",
    specialty: "Psicología",
    documentId: "56789012",
    licenseNumber: "PSI-001",
    contactNumber: "+58-212-555-0105",
    email: "roberto.garcia@hospital.com",
    createdAt: new Date(),
    status: "Activo",
    specialties: ["Psicología Clínica", "Terapia Familiar"]
  }
];

const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientId: "1",
    patientName: "Juan Pérez",
    date: new Date(),
    time: "09:00",
    duration: 30,
    reason: "Consulta de seguimiento",
    status: "Programada",
    notes: "Traer análisis recientes",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
    doctorId: "1",
    doctorName: "Dr. Carlos López"
  },
  {
    id: "2",
    patientId: "2",
    patientName: "María García",
    date: new Date(),
    time: "10:30",
    duration: 45,
    reason: "Primera consulta",
    status: "Programada",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
    doctorId: "2",
    doctorName: "Dra. María Rodríguez"
  },
  {
    id: "3",
    patientId: "3",
    patientName: "Carlos Rodríguez",
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    time: "11:15",
    duration: 30,
    reason: "Revisión de tratamiento",
    status: "Pendiente",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    doctorId: "1",
    doctorName: "Dr. Carlos López"
  },
  {
    id: "4",
    patientId: "1",
    patientName: "Juan Pérez",
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    time: "15:00",
    duration: 60,
    reason: "Procedimiento menor",
    status: "Programada",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 7)),
    doctorId: "3",
    doctorName: "Dr. José Martínez"
  },
  {
    id: "5",
    patientId: "4",
    patientName: "Ana Martínez",
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    time: "16:30",
    duration: 30,
    reason: "Control rutinario",
    status: "Completada",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)),
    doctorId: "4",
    doctorName: "Dra. Ana Fernández"
  },
  {
    id: "6",
    patientId: "5",
    patientName: "Pedro Gómez",
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    time: "09:30",
    duration: 45,
    reason: "Consulta de emergencia",
    status: "Cancelada",
    notes: "Paciente canceló por enfermedad",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 4)),
    doctorId: "1",
    doctorName: "Dr. Carlos López"
  },
  {
    id: "7",
    patientId: "6",
    patientName: "Laura Fernández",
    date: new Date(),
    time: "13:00",
    duration: 30,
    reason: "Consulta de nutrición",
    status: "Programada",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    doctorId: "2",
    doctorName: "Dra. María Rodríguez"
  },
  {
    id: "8",
    patientId: "7",
    patientName: "Roberto Silva",
    date: new Date(),
    time: "14:30",
    duration: 45,
    reason: "Evaluación psicológica",
    status: "Programada",
    notes: "Primera sesión",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 6)),
    doctorId: "5",
    doctorName: "Dr. Roberto García"
  },
  {
    id: "9",
    patientId: "8",
    patientName: "Carmen López",
    date: new Date(),
    time: "18:00",
    duration: 60,
    reason: "Cirugía menor",
    status: "Programada",
    notes: "Ayuno desde medianoche",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 8)),
    doctorId: "3",
    doctorName: "Dr. José Martínez"
  },
  {
    id: "10",
    patientId: "9",
    patientName: "Diego Morales",
    date: new Date(),
    time: "17:00",
    duration: 30,
    reason: "Terapia física",
    status: "Pendiente",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
    doctorId: "4",
    doctorName: "Dra. Ana Fernández"
  },
  {
    id: "11",
    patientId: "10",
    patientName: "Isabel Herrera",
    date: new Date(new Date().setDate(new Date().getDate() - 3)),
    time: "12:00",
    duration: 45,
    reason: "Control post-operatorio",
    status: "Completada",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 15)),
    doctorId: "2",
    doctorName: "Dra. María Rodríguez"
  },
  {
    id: "12",
    patientId: "11",
    patientName: "Andrés Castro",
    date: new Date(new Date().setDate(new Date().getDate() + 4)),
    time: "16:00",
    duration: 30,
    reason: "Consulta dermatológica",
    status: "Programada",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    doctorId: "3",
    doctorName: "Dr. José Martínez"
  },
  {
    id: "13",
    patientId: "12",
    patientName: "Patricia Jiménez",
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    time: "10:00",
    duration: 60,
    reason: "Evaluación cardiológica",
    status: "Programada",
    notes: "Traer electrocardiograma previo",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 9)),
    doctorId: "2",
    doctorName: "Dra. María Rodríguez"
  },
  {
    id: "14",
    patientId: "13",
    patientName: "Fernando Vargas",
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    time: "11:30",
    duration: 30,
    reason: "Consulta oftalmológica",
    status: "Reprogramada",
    notes: "Reprogramada por solicitud del paciente",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 12)),
    doctorId: "1",
    doctorName: "Dr. Carlos López"
  },
];

const AppointmentStatusBadge = ({ status }: { status: AppointmentStatus }) => {
  const getStatusConfig = (status: AppointmentStatus) => {
    switch (status) {
      case "Programada":
        return { variant: "default", className: "bg-blue-500" };
      case "Pendiente":
        return { variant: "outline", className: "text-yellow-600 border-yellow-400" };
      case "Completada":
        return { variant: "default", className: "bg-green-500" };
      case "Cancelada":
        return { variant: "destructive" };
      case "Reprogramada":
        return { variant: "default", className: "bg-purple-500" };
      default:
        return { variant: "default" };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge variant={config.variant as any} className={config.className}>
      {status}
    </Badge>
  );
};

const AppointmentCard = ({ 
  appointment, 
  onClick, 
  onStartConsultation,
  isSelected = false,
  onSelect,
  showSelection = false
}: { 
  appointment: Appointment, 
  onClick: () => void,
  onStartConsultation: () => void,
  isSelected?: boolean,
  onSelect?: (isSelected: boolean) => void,
  showSelection?: boolean
}) => {
  return (
    <Card 
      className={`mb-2 hover:shadow-md transition-shadow cursor-pointer relative ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-[#F1F0FB]'
      } dark:bg-gray-800`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {showSelection && onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            <div className="flex-1" onClick={onClick}>
              <div className="font-medium">{appointment.patientName}</div>
              <div className="text-sm text-gray-500 flex items-center mt-1">
                <Clock size={14} className="mr-1" />
                {appointment.time} ({appointment.duration} min)
              </div>
              <div className="text-sm mt-1">{appointment.reason}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AppointmentStatusBadge status={appointment.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onStartConsultation();
                }}>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  <span>Iniciar consulta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AppointmentList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'Todas'>('Todas');
  const [viewMode, setViewMode] = useState<AppointmentView>('day');
  
  // Estados para selección múltiple y acciones rápidas
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [reassignDate, setReassignDate] = useState<string>("");
  const [reassignTime, setReassignTime] = useState<string>("");
  const [reassignDoctorId, setReassignDoctorId] = useState<string>("");

  // Effect para mostrar/ocultar las acciones rápidas
  useEffect(() => {
    setShowBulkActions(selectedAppointments.length > 0);
  }, [selectedAppointments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedAppointments = localStorage.getItem("appointments");
      if (savedAppointments) {
        try {
          const parsedAppointments = JSON.parse(savedAppointments).map((app: any) => ({
            ...app,
            date: new Date(app.date),
            createdAt: new Date(app.createdAt),
            updatedAt: app.updatedAt ? new Date(app.updatedAt) : undefined,
          }));
          setAppointments(parsedAppointments);
        } catch (error) {
          console.error("Error parsing appointments:", error);
          setAppointments(mockAppointments);
        }
      } else {
        setAppointments(mockAppointments);
        localStorage.setItem("appointments", JSON.stringify(mockAppointments));
      }
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleViewAppointment = (id: string) => {
    navigate(`/citas/${id}`);
  };

  const handleCreateAppointment = () => {
    navigate("/citas/nueva");
  };

  const handleStartConsultation = (appointment: Appointment) => {
    if (appointment.status === 'Cancelada') {
      toast({
        title: "No se puede iniciar consulta",
        description: "No se puede iniciar una consulta para una cita cancelada",
        variant: "destructive"
      });
      return;
    }
    
    if (appointment.status !== 'Completada') {
      const updatedAppointments = appointments.map(app => 
        app.id === appointment.id 
          ? { ...app, status: 'Completada' as AppointmentStatus, updatedAt: new Date() }
          : app
      );
      setAppointments(updatedAppointments);
      localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
    }
    
    navigate(`/pacientes/nueva-consulta?patientId=${appointment.patientId}`);
  };

  // Funciones para acciones rápidas
  const handleSelectAppointment = (appointmentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAppointments(prev => [...prev, appointmentId]);
    } else {
      setSelectedAppointments(prev => prev.filter(id => id !== appointmentId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedAppointments(filteredAppointments.map(app => app.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleCancelAppointments = (appointmentIds: string[]) => {
    const updatedAppointments = appointments.map(app => 
      appointmentIds.includes(app.id) 
        ? { ...app, status: 'Cancelada' as AppointmentStatus, updatedAt: new Date() }
        : app
    );
    setAppointments(updatedAppointments);
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
    
    toast({
      title: "Citas canceladas",
      description: `Se ${appointmentIds.length === 1 ? 'canceló' : 'cancelaron'} ${appointmentIds.length} cita${appointmentIds.length === 1 ? '' : 's'} exitosamente`,
    });
    
    setSelectedAppointments([]);
  };

  const handleReassignAppointments = () => {
    if (!reassignDate || !reassignTime) {
      toast({
        title: "Error",
        description: "Debe seleccionar fecha y hora para reasignar",
        variant: "destructive"
      });
      return;
    }

    const newDate = new Date(reassignDate);
    const selectedDoctor = (reassignDoctorId && reassignDoctorId !== "keep-current") 
      ? mockDoctors.find(doctor => doctor.id === reassignDoctorId) 
      : null;
    
    const updatedAppointments = appointments.map(app => 
      selectedAppointments.includes(app.id)
        ? { 
            ...app, 
            date: newDate,
            time: reassignTime,
            doctorId: (reassignDoctorId && reassignDoctorId !== "keep-current") ? reassignDoctorId : app.doctorId,
            doctorName: selectedDoctor?.name || app.doctorName,
            status: 'Reprogramada' as AppointmentStatus, 
            updatedAt: new Date() 
          }
        : app
    );
    
    setAppointments(updatedAppointments);
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
    
    const doctorInfo = selectedDoctor ? ` con ${selectedDoctor.name}` : '';
    toast({
      title: "Citas reasignadas",
      description: `Se reasignaron ${selectedAppointments.length} cita${selectedAppointments.length === 1 ? '' : 's'} exitosamente${doctorInfo}`,
    });
    
    setSelectedAppointments([]);
    setIsReassignDialogOpen(false);
    setReassignDate("");
    setReassignTime("");
    setReassignDoctorId("");
  };

  const changeWeek = (amount: number) => {
    setSelectedDate(addDays(selectedDate, amount * 7));
  };

  const changeDay = (amount: number) => {
    setSelectedDate(addDays(selectedDate, amount));
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });

  // Función para generar horarios disponibles desde las 8:00 hasta las 18:00 cada 30 minutos
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 17) { // No agregar :30 para las 17 porque sería 17:30 y queremos parar en 18:00
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todas' || appointment.status === statusFilter;
    
    let matchesDate = false;
    if (viewMode === 'day') {
      matchesDate = isSameDay(appointment.date, selectedDate);
    } else if (viewMode === 'week') {
      const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
      matchesDate = appointment.date >= startDate && appointment.date <= endDate;
    } else if (viewMode === 'month') {
      matchesDate = appointment.date.getMonth() === selectedDate.getMonth() && 
                    appointment.date.getFullYear() === selectedDate.getFullYear();
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calcular estadísticas del día seleccionado para el panel izquierdo
  const todayAppointments = appointments.filter(app => isSameDay(app.date, selectedDate));
  const dayStats = {
    total: todayAppointments.length,
    confirmed: todayAppointments.filter(app => app.status === 'Programada').length,
    pending: todayAppointments.filter(app => app.status === 'Pendiente').length,
    cancelled: todayAppointments.filter(app => app.status === 'Cancelada').length,
  };

  const appointmentsByDay = filteredAppointments.reduce((acc, appointment) => {
    const dateKey = format(appointment.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Componente para renderizar el slot de tiempo con cita o disponible
  const TimeSlotCard = ({ time, appointment }: { time: string, appointment?: Appointment }) => {
    if (appointment) {
      const statusColors = {
        'Programada': 'bg-green-50 border-l-4 border-l-green-500',
        'Pendiente': 'bg-yellow-50 border-l-4 border-l-yellow-500',
        'Cancelada': 'bg-red-50 border-l-4 border-l-red-500',
        'Completada': 'bg-blue-50 border-l-4 border-l-blue-500',
        'Reprogramada': 'bg-purple-50 border-l-4 border-l-purple-500'
      };
      
      return (
        <div className={`p-4 rounded-lg ${statusColors[appointment.status]} cursor-pointer hover:shadow-md transition-shadow`}
             onClick={() => handleViewAppointment(appointment.id)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {appointment.patientName.charAt(0)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
                <p className="text-sm text-gray-600 flex items-center">
                  <Clock size={12} className="mr-1" />
                  {appointment.duration} min • {appointment.doctorName || 'Sin médico asignado'}
                </p>
              </div>
            </div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 cursor-pointer transition-colors group"
           onClick={handleCreateAppointment}>
        <div className="flex items-center justify-center text-gray-400 group-hover:text-purple-500">
          <Plus size={16} className="mr-2" />
          <span className="text-sm">Slot disponible</span>
        </div>
      </div>
    );
  };

  const renderDayScheduleView = () => {
    const dayAppointments = filteredAppointments.filter(app => isSameDay(app.date, selectedDate));
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-600">Hora</h3>
          <h3 className="text-lg font-medium text-gray-600">Citas programadas</h3>
        </div>
        
        {timeSlots.map((time) => {
          const appointment = dayAppointments.find(app => app.time === time);
          
          return (
            <div key={time} className="grid grid-cols-12 gap-4 items-center py-1">
              <div className="col-span-2 text-sm font-medium text-gray-600">
                {time}
              </div>
              <div className="col-span-10">
                <TimeSlotCard time={time} appointment={appointment} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderViewContent = () => {
    if (viewMode === 'day') {
      return renderDayScheduleView();
    }

    if (viewMode === 'week') {
      return (
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointmentsByDay[dateKey] || [];

            if (dayAppointments.length === 0) {
              return null;
            }

            return (
              <div key={dateKey} className="space-y-2">
                <h3 className="text-lg font-medium">
                  {format(day, "EEEE d", { locale: es })}
                  {isToday(day) && <span className="ml-2 text-purple-500">(Hoy)</span>}
                </h3>
                {dayAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => handleViewAppointment(appointment.id)}
                    onStartConsultation={() => handleStartConsultation(appointment)}
                    isSelected={selectedAppointments.includes(appointment.id)}
                    onSelect={(isSelected) => handleSelectAppointment(appointment.id, isSelected)}
                    showSelection={true}
                  />
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    if (viewMode === 'month') {
      const groupedByDate = Object.keys(appointmentsByDay).sort();
      
      return (
        <div className="space-y-4">
          {groupedByDate.map((dateKey) => {
            const date = new Date(dateKey);
            const dayAppointments = appointmentsByDay[dateKey] || [];

            return (
              <div key={dateKey} className="space-y-2">
                <h3 className="text-lg font-medium">
                  {format(date, "EEEE d", { locale: es })}
                  {isToday(date) && <span className="ml-2 text-purple-500">(Hoy)</span>}
                </h3>
                {dayAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => handleViewAppointment(appointment.id)}
                    onStartConsultation={() => handleStartConsultation(appointment)}
                    isSelected={selectedAppointments.includes(appointment.id)}
                    onSelect={(isSelected) => handleSelectAppointment(appointment.id, isSelected)}
                    showSelection={true}
                  />
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6 mx-auto"></div>
            <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto px-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto py-6 px-4">
          <BackButton />
          
          {/* Layout con dos columnas: panel izquierdo y contenido principal */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
            {/* Panel izquierdo - Vista de estadísticas y acciones */}
            <div className="lg:col-span-1 space-y-4">
              {/* Navegación de fechas */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">Vista</h3>
                    <Filter size={16} className="text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Tabs defaultValue={viewMode} onValueChange={(v) => setViewMode(v as AppointmentView)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="day" className="text-xs">Día</TabsTrigger>
                      <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
                      <TabsTrigger value="month" className="text-xs">Mes</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Navegación de fecha específica */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => viewMode === 'day' ? changeDay(-1) : viewMode === 'week' ? changeWeek(-1) : setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                    >
                      <ChevronLeft size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => viewMode === 'day' ? changeDay(1) : viewMode === 'week' ? changeWeek(1) : setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                    >
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-semibold">
                      {viewMode === 'day' && format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                      {viewMode === 'week' && `${format(weekDays[0], "d MMM", { locale: es })} - ${format(weekDays[6], "d MMM", { locale: es })}`}
                      {viewMode === 'month' && format(selectedDate, "MMMM yyyy", { locale: es })}
                    </h2>
                    {isToday(selectedDate) && viewMode === 'day' && (
                      <span className="text-xs text-purple-500 font-medium">Hoy</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen del día */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Resumen del día
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Total de citas */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CalendarDays size={16} className="text-blue-600" />
                      <span className="text-sm font-medium">Total citas</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{dayStats.total}</span>
                  </div>

                  {/* Confirmadas */}
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm font-medium">Confirmadas</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{dayStats.confirmed}</span>
                  </div>

                  {/* Pendientes */}
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle size={16} className="text-yellow-600" />
                      <span className="text-sm font-medium">Pendientes</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">{dayStats.pending}</span>
                  </div>

                  {/* Canceladas */}
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle size={16} className="text-red-600" />
                      <span className="text-sm font-medium">Canceladas</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{dayStats.cancelled}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones rápidas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Acciones rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={handleCreateAppointment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="mr-2" size={16} />
                    Nueva cita
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contenido principal - Lista de citas */}
            <div className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="text-purple-500" size={20} />
                      <h1 className="text-xl font-semibold">
                        {viewMode === 'day' && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        {viewMode === 'week' && "Vista Semanal"}
                        {viewMode === 'month' && format(selectedDate, "MMMM yyyy", { locale: es })}
                      </h1>
                      {filteredAppointments.length > 0 && (viewMode === 'week' || viewMode === 'month') && (
                        <div className="flex items-center space-x-2 ml-4">
                          <Checkbox
                            checked={selectedAppointments.length === filteredAppointments.length}
                            onCheckedChange={handleSelectAll}
                          />
                          <span className="text-sm text-gray-600">Seleccionar todo</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Filtros de búsqueda */}
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-48"
                        />
                      </div>
                      <select
                        className="rounded-md border border-input px-3 py-2 bg-background text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                      >
                        <option value="Todas">Todas</option>
                        <option value="Programada">Programadas</option>
                        <option value="Pendiente">Pendientes</option>
                        <option value="Completada">Completadas</option>
                        <option value="Cancelada">Canceladas</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {viewMode === 'week' && (
                    <div className={`grid grid-cols-7 gap-1 mb-6 ${isMobile ? 'overflow-x-auto' : ''}`}>
                      {weekDays.map((day, i) => (
                        <Button
                          key={i}
                          variant={isSameDay(day, selectedDate) ? "default" : "outline"}
                          className={`text-xs h-auto py-2 ${isSameDay(day, new Date()) ? 'bg-purple-100 text-purple-700 border-purple-300' : ''} ${isMobile ? 'min-w-[5rem]' : ''}`}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{format(day, "EEE", { locale: es })}</span>
                            <span className="text-lg font-bold">{format(day, "d")}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="overflow-auto max-h-[600px]">
                    {renderViewContent()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Barra de acciones rápidas flotante */}
          {showBulkActions && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
              <Card className="shadow-lg border-2 border-blue-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      <Check className="h-4 w-4 text-blue-600" />
                      <span>{selectedAppointments.length} cita{selectedAppointments.length > 1 ? 's' : ''} seleccionada{selectedAppointments.length > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="h-6 w-px bg-gray-300" />
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelAppointments(selectedAppointments)}
                        className="flex items-center space-x-1"
                      >
                        <CalendarX size={16} />
                        <span>Cancelar</span>
                      </Button>
                      
                      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <CalendarCheck size={16} />
                            <span>Reasignar</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Reasignar {selectedAppointments.length} cita{selectedAppointments.length > 1 ? 's' : ''}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <label className="text-sm font-medium">Nueva fecha</label>
                              <Input
                                type="date"
                                value={reassignDate}
                                onChange={(e) => setReassignDate(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Nueva hora</label>
                              <Select value={reassignTime} onValueChange={setReassignTime}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Seleccionar hora" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Médico (opcional)</label>
                              <Select value={reassignDoctorId} onValueChange={setReassignDoctorId}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Mantener médico actual o seleccionar nuevo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="keep-current">Mantener médico actual</SelectItem>
                                  {mockDoctors.filter(doctor => doctor.status === 'Activo').map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                      {doctor.name} - {doctor.specialty}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => setIsReassignDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleReassignAppointments}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Reasignar citas
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAppointments([])}
                        className="flex items-center space-x-1"
                      >
                        <X size={16} />
                        <span>Limpiar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentList;
