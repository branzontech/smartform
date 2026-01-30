
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, Filter, Search, Stethoscope, CalendarDays, CheckCircle, XCircle, AlertCircle, X, CalendarX, CalendarCheck, Users, Check, LayoutGrid, CalendarRange, FileText, Settings } from "lucide-react";
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
import { Dock, DockItem } from "@/components/ui/dock";
import { AnimatePresence } from "framer-motion";

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
    <div 
      className={`mb-3 p-4 rounded-2xl backdrop-blur-md border transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/10 border-primary/30' 
          : 'bg-card/60 border-border/50 hover:bg-card/80 hover:border-border hover:shadow-lg'
      }`}
    >
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
            <div className="font-semibold text-foreground">{appointment.patientName}</div>
            <div className="text-sm text-muted-foreground flex items-center mt-1.5">
              <div className="p-1 rounded-md bg-muted/50 mr-2">
                <Clock size={12} />
              </div>
              {appointment.time} ({appointment.duration} min)
            </div>
            <div className="text-sm text-muted-foreground mt-1">{appointment.reason}</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <AppointmentStatusBadge status={appointment.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/50" onClick={(e) => e.stopPropagation()}>
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl backdrop-blur-xl bg-popover/95 border-border/50">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onStartConsultation();
                }}
                className="rounded-lg"
              >
                <Stethoscope className="mr-2 h-4 w-4" />
                <span>Iniciar consulta</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
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
  const [doctorFilter, setDoctorFilter] = useState<string>('Todos');
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

  // Función especial para seleccionar todas las citas de un médico específico
  const handleSelectAllDoctorAppointments = (doctorId: string) => {
    const doctorAppointments = appointments.filter(app => 
      app.doctorId === doctorId && 
      (app.status === 'Programada' || app.status === 'Pendiente')
    );
    setSelectedAppointments(doctorAppointments.map(app => app.id));
    setDoctorFilter(doctorId); // Asegurar que el filtro esté aplicado
    toast({
      title: "Citas seleccionadas",
      description: `Se seleccionaron ${doctorAppointments.length} citas del médico para redistribución`,
    });
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
    const matchesDoctor = doctorFilter === 'Todos' || appointment.doctorId === doctorFilter;
    
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
    
    return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
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
          
          
          {/* Layout de contenido principal - ahora ocupa todo el ancho */}
          <div className="mt-6">

            {/* Contenido principal - Lista de citas - ancho completo */}
            <div>
              <div className="h-full rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden">
                {/* Header con filtros modernos */}
                <div className="p-6 border-b border-border/50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <Calendar className="text-primary" size={20} />
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Navegación de fecha */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-9 w-9 p-0 rounded-xl hover:bg-muted/50"
                          onClick={() => viewMode === 'day' ? changeDay(-1) : viewMode === 'week' ? changeWeek(-1) : setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                        >
                          <ChevronLeft size={18} />
                        </Button>
                        
                        <div>
                          <h1 className="text-xl font-semibold text-foreground">
                            {viewMode === 'day' && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                            {viewMode === 'week' && "Vista Semanal"}
                            {viewMode === 'month' && format(selectedDate, "MMMM yyyy", { locale: es })}
                          </h1>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-9 w-9 p-0 rounded-xl hover:bg-muted/50"
                          onClick={() => viewMode === 'day' ? changeDay(1) : viewMode === 'week' ? changeWeek(1) : setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                        >
                          <ChevronRight size={18} />
                        </Button>
                        
                        {/* Selector de vista */}
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as AppointmentView)} className="ml-4">
                          <TabsList className="rounded-xl bg-muted/50 p-1">
                            <TabsTrigger value="day" className="text-xs rounded-lg px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Día</TabsTrigger>
                            <TabsTrigger value="week" className="text-xs rounded-lg px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Semana</TabsTrigger>
                            <TabsTrigger value="month" className="text-xs rounded-lg px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Mes</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      
                      {filteredAppointments.length > 0 && (viewMode === 'week' || viewMode === 'month') && (
                        <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-border/50">
                          <Checkbox
                            checked={selectedAppointments.length === filteredAppointments.length}
                            onCheckedChange={handleSelectAll}
                            className="rounded-md"
                          />
                          <span className="text-sm text-muted-foreground">Seleccionar todo</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Filtros de búsqueda modernos */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar citas..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-56 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <SelectTrigger className="w-44 h-11 rounded-xl bg-muted/50 border-0 focus:ring-1 focus:ring-primary/50">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl backdrop-blur-xl bg-popover/95 border-border/50">
                          <SelectItem value="Todas" className="rounded-lg">Todas</SelectItem>
                          <SelectItem value="Programada" className="rounded-lg">Programadas</SelectItem>
                          <SelectItem value="Pendiente" className="rounded-lg">Pendientes</SelectItem>
                          <SelectItem value="Completada" className="rounded-lg">Completadas</SelectItem>
                          <SelectItem value="Cancelada" className="rounded-lg">Canceladas</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                        <SelectTrigger className="w-52 h-11 rounded-xl bg-muted/50 border-0 focus:ring-1 focus:ring-primary/50">
                          <SelectValue placeholder="Médico" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl backdrop-blur-xl bg-popover/95 border-border/50">
                          <SelectItem value="Todos" className="rounded-lg">Todos los médicos</SelectItem>
                          {mockDoctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id} className="rounded-lg">
                              {doctor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                
                {/* Alerta especial cuando se filtra por médico específico */}
                {doctorFilter !== 'Todos' && (
                  <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-amber-500/20">
                          <Users className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          Mostrando citas de: {mockDoctors.find(d => d.id === doctorFilter)?.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectAllDoctorAppointments(doctorFilter)}
                          className="rounded-xl text-amber-700 border-amber-300 hover:bg-amber-500/10"
                        >
                          <Users size={14} className="mr-1" />
                          Seleccionar todas sus citas
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDoctorFilter('Todos')}
                          className="rounded-xl h-8 w-8 p-0 hover:bg-muted/50"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 ml-11">
                      ⚠️ Útil para redistribuir citas cuando un médico se incapacita o no está disponible
                    </p>
                  </div>
                )}
                
                <div className="p-6">
                  {viewMode === 'week' && (
                    <div className={`grid grid-cols-7 gap-2 mb-6 ${isMobile ? 'overflow-x-auto' : ''}`}>
                      {weekDays.map((day, i) => (
                        <Button
                          key={i}
                          variant="ghost"
                          className={`text-xs h-auto py-3 rounded-xl transition-all ${
                            isSameDay(day, selectedDate) 
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                              : isSameDay(day, new Date()) 
                                ? 'bg-primary/10 text-primary border border-primary/30' 
                                : 'hover:bg-muted/50'
                          } ${isMobile ? 'min-w-[5rem]' : ''}`}
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
                  
                  <div className="overflow-auto max-h-[600px] pb-40">
                    {renderViewContent()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dock flotante con opciones principales */}
          <AnimatePresence>
            {!showBulkActions && (
              <Dock
                items={[
                  {
                    id: "new-appointment",
                    label: "Nueva cita",
                    icon: Plus,
                    onClick: handleCreateAppointment,
                    isActive: false,
                  },
                  {
                    id: "day-summary",
                    label: `Resumen: ${dayStats.total} citas`,
                    icon: CalendarDays,
                    badge: dayStats.total,
                    badgeVariant: "default",
                  },
                  {
                    id: "schedule",
                    label: "Programación",
                    icon: CalendarRange,
                    onClick: () => setViewMode('week'),
                    isActive: viewMode === 'week',
                  },
                  {
                    id: "reports",
                    label: "Reportes",
                    icon: FileText,
                    onClick: () => navigate('/app/informes'),
                  },
                  {
                    id: "settings",
                    label: "Configuración",
                    icon: Settings,
                    onClick: () => navigate('/app/configuracion'),
                  },
                ] as DockItem[]}
                magnification={72}
                baseSize={52}
              />
            )}
          </AnimatePresence>
          
          {/* Barra de acciones rápidas flotante para selección múltiple */}
          {showBulkActions && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
              <div className="px-6 py-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm font-medium">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">{selectedAppointments.length} cita{selectedAppointments.length > 1 ? 's' : ''} seleccionada{selectedAppointments.length > 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="h-6 w-px bg-border" />
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelAppointments(selectedAppointments)}
                      className="flex items-center space-x-1 rounded-xl"
                    >
                      <CalendarX size={16} />
                      <span>Cancelar</span>
                    </Button>
                    
                    <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <CalendarCheck size={16} />
                          <span>Reasignar</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            Reasignar {selectedAppointments.length} cita{selectedAppointments.length > 1 ? 's' : ''}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium text-foreground">Nueva fecha</label>
                            <Input
                              type="date"
                              value={reassignDate}
                              onChange={(e) => setReassignDate(e.target.value)}
                              className="mt-2 rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">Nueva hora</label>
                            <Select value={reassignTime} onValueChange={setReassignTime}>
                              <SelectTrigger className="mt-2 rounded-xl">
                                <SelectValue placeholder="Seleccionar hora" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time} className="rounded-lg">
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">Médico (opcional)</label>
                            <Select value={reassignDoctorId} onValueChange={setReassignDoctorId}>
                              <SelectTrigger className="mt-2 rounded-xl">
                                <SelectValue placeholder="Mantener médico actual o seleccionar nuevo" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="keep-current" className="rounded-lg">Mantener médico actual</SelectItem>
                                {mockDoctors.filter(doctor => doctor.status === 'Activo').map((doctor) => (
                                  <SelectItem key={doctor.id} value={doctor.id} className="rounded-lg">
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
                              className="rounded-xl"
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleReassignAppointments}
                              className="rounded-xl bg-primary hover:bg-primary/90"
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
                      className="flex items-center space-x-1 rounded-xl hover:bg-muted/50"
                    >
                      <X size={16} />
                      <span>Limpiar</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentList;
