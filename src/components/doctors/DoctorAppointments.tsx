
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, User, Calendar as CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Appointment, AppointmentStatus } from "@/types/patient-types";
import { getDoctorAppointments } from "@/utils/doctor-utils";

interface DoctorAppointmentsProps {
  doctorId: string;
}

const DoctorAppointments = ({ doctorId }: DoctorAppointmentsProps) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "Todas">("Todas");
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getDoctorAppointments(doctorId);
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [doctorId]);
  
  const handleNewAppointment = () => {
    navigate(`/app/citas/nueva?doctorId=${doctorId}`);
  };
  
  const handleViewAppointment = (appointmentId: string) => {
    navigate(`/app/citas/${appointmentId}`);
  };
  
  // Filtrar citas por fecha
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  const isTomorrow = (date: Date) => {
    return date.getDate() === tomorrow.getDate() && 
           date.getMonth() === tomorrow.getMonth() && 
           date.getFullYear() === tomorrow.getFullYear();
  };
  
  const isPast = (date: Date) => {
    return date < today && !isToday(date);
  };
  
  const isFuture = (date: Date) => {
    return date > tomorrow && !isTomorrow(date);
  };
  
  // Filtrar citas por estado si se ha seleccionado uno
  const filteredAppointments = appointments.filter(appointment => 
    filterStatus === "Todas" || appointment.status === filterStatus
  );
  
  // Agrupar citas por fecha
  const todayAppointments = filteredAppointments.filter(a => isToday(new Date(a.date)));
  const tomorrowAppointments = filteredAppointments.filter(a => isTomorrow(new Date(a.date)));
  const pastAppointments = filteredAppointments.filter(a => isPast(new Date(a.date)));
  const upcomingAppointments = filteredAppointments.filter(a => isFuture(new Date(a.date)));
  
  const renderAppointmentStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "Programada":
        return <Badge className="bg-blue-500">Programada</Badge>;
      case "Pendiente":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Pendiente</Badge>;
      case "Completada":
        return <Badge className="bg-green-500">Completada</Badge>;
      case "Cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      case "Reprogramada":
        return <Badge className="bg-purple-500">Reprogramada</Badge>;
      default:
        return null;
    }
  };
  
  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    return (
      <Card 
        className="mb-2 hover:shadow-md transition-shadow cursor-pointer bg-[#F7F7FF] dark:bg-gray-800"
        onClick={() => handleViewAppointment(appointment.id)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{appointment.patientName}</div>
              <div className="text-sm text-gray-500 flex items-center mt-1">
                <Clock size={14} className="mr-1" />
                {appointment.time} ({appointment.duration} min)
              </div>
              <div className="text-sm mt-1">{appointment.reason}</div>
            </div>
            <div>
              {renderAppointmentStatusBadge(appointment.status)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const AppointmentSection = ({ title, appointments, emptyMessage }: { 
    title: string, 
    appointments: Appointment[], 
    emptyMessage: string 
  }) => {
    if (appointments.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="space-y-2">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="mr-2 text-purple-500" size={20} />
          Citas del profesional
        </h2>
        <Button 
          onClick={handleNewAppointment}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="mr-2" size={16} />
          Nueva cita
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" onClick={() => setFilterStatus("Todas")}>Todas</TabsTrigger>
            <TabsTrigger value="scheduled" onClick={() => setFilterStatus("Programada")}>Programadas</TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setFilterStatus("Completada")}>Completadas</TabsTrigger>
            <TabsTrigger value="cancelled" onClick={() => setFilterStatus("Cancelada")}>Canceladas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            <AppointmentSection 
              title="Hoy"
              appointments={todayAppointments}
              emptyMessage="No hay citas programadas para hoy"
            />
            
            <AppointmentSection 
              title="Mañana"
              appointments={tomorrowAppointments}
              emptyMessage="No hay citas programadas para mañana"
            />
            
            <AppointmentSection 
              title="Próximas citas"
              appointments={upcomingAppointments}
              emptyMessage="No hay citas programadas próximamente"
            />
            
            <AppointmentSection 
              title="Citas pasadas"
              appointments={pastAppointments}
              emptyMessage="No hay citas pasadas"
            />
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-6">
            <AppointmentSection 
              title="Citas programadas"
              appointments={filteredAppointments}
              emptyMessage="No hay citas programadas"
            />
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-6">
            <AppointmentSection 
              title="Citas completadas"
              appointments={filteredAppointments}
              emptyMessage="No hay citas completadas"
            />
          </TabsContent>
          
          <TabsContent value="cancelled" className="space-y-6">
            <AppointmentSection 
              title="Citas canceladas"
              appointments={filteredAppointments}
              emptyMessage="No hay citas canceladas"
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {appointments.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay citas</h3>
          <p className="text-gray-500 mb-6">Este profesional aún no tiene citas programadas.</p>
          <Button 
            onClick={handleNewAppointment}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2" size={16} />
            Programar nueva cita
          </Button>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
