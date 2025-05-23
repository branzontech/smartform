
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, Filter, Search, Stethoscope } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Appointment, AppointmentStatus, AppointmentView } from "@/types/patient-types";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const AppointmentCard = ({ appointment, onClick, onStartConsultation }: { 
  appointment: Appointment, 
  onClick: () => void,
  onStartConsultation: () => void 
}) => {
  return (
    <Card 
      className="mb-2 hover:shadow-md transition-shadow cursor-pointer relative bg-[#F1F0FB] dark:bg-gray-800" // Added soft pastel gray background
    >
      <CardContent className="p-3" onClick={onClick}>
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium">{appointment.patientName}</div>
            <div className="text-sm text-gray-500 flex items-center mt-1">
              <Clock size={14} className="mr-1" />
              {appointment.time} ({appointment.duration} min)
            </div>
            <div className="text-sm mt-1">{appointment.reason}</div>
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
  // Set default view mode to 'day'
  const [viewMode, setViewMode] = useState<AppointmentView>('day');

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

  const appointmentsByDay = filteredAppointments.reduce((acc, appointment) => {
    const dateKey = format(appointment.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const renderViewContent = () => {
    if (filteredAppointments.length === 0) {
      return (
        <EmptyState
          title="No hay citas para mostrar"
          description="No se encontraron citas que coincidan con los criterios de búsqueda."
          icon={<Calendar size={48} className="text-gray-300" />}
          buttonText="Nueva cita"
          onClick={handleCreateAppointment}
        />
      );
    }

    if (viewMode === 'day') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            {isToday(selectedDate) && <span className="ml-2 text-purple-500">(Hoy)</span>}
          </h3>
          <div className="space-y-2">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onClick={() => handleViewAppointment(appointment.id)}
                onStartConsultation={() => handleStartConsultation(appointment)}
              />
            ))}
          </div>
        </div>
      );
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
      <main className="flex-1 container mx-auto py-8 px-4">
        <BackButton />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Calendar className="mr-2 text-purple-500" />
            Citas
          </h1>
          <Button 
            onClick={handleCreateAppointment}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2" size={16} />
            Nueva cita
          </Button>
        </div>

        <div className="mb-6">
          <Tabs defaultValue={viewMode} onValueChange={(v) => setViewMode(v as AppointmentView)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="day">Día</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mes</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center">
                {viewMode === 'day' && (
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => changeDay(-1)}>
                      <ChevronLeft size={18} />
                    </Button>
                    <span className="mx-2 text-sm font-medium">
                      {format(selectedDate, "d 'de' MMMM", { locale: es })}
                      {isToday(selectedDate) && <span className="ml-1 text-purple-500">(Hoy)</span>}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => changeDay(1)}>
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                )}
                
                {viewMode === 'week' && (
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={() => changeWeek(-1)}>
                      <ChevronLeft size={18} />
                    </Button>
                    <span className="mx-2 text-sm font-medium">
                      {format(weekDays[0], "d MMM", { locale: es })} - {format(weekDays[6], "d MMM", { locale: es })}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => changeWeek(1)}>
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                )}
                
                {viewMode === 'month' && (
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedDate(newDate);
                      }}
                    >
                      <ChevronLeft size={18} />
                    </Button>
                    <span className="mx-2 text-sm font-medium">
                      {format(selectedDate, "MMMM yyyy", { locale: es })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                      }}
                    >
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-4 flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar paciente o motivo"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center">
                <Filter size={16} className="mr-2 text-gray-500" />
                <select
                  className="rounded-md border border-input px-3 py-2 bg-background"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="Todas">Todas</option>
                  <option value="Programada">Programadas</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="Reprogramada">Reprogramadas</option>
                  <option value="Completada">Completadas</option>
                  <option value="Cancelada">Canceladas</option>
                </select>
              </div>
            </div>
            
            {viewMode === 'week' && (
              <div className={`grid grid-cols-7 gap-1 mb-4 ${isMobile ? 'overflow-x-auto' : ''}`}>
                {weekDays.map((day, i) => (
                  <Button
                    key={i}
                    variant={isSameDay(day, selectedDate) ? "default" : "outline"}
                    className={`text-xs h-auto py-1 ${isSameDay(day, new Date()) ? 'bg-purple-100 text-purple-700 border-purple-300' : ''} ${isMobile ? 'min-w-[4rem]' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex flex-col">
                      <span>{format(day, "EEE", { locale: es })}</span>
                      <span className="text-lg">{format(day, "d")}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            <div className="mt-4">
              {renderViewContent()}
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AppointmentList;
