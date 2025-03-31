import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, FileText, Edit, Trash, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Appointment, AppointmentStatus } from "@/types/patient-types";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarSyncButton } from "@/components/google-calendar/CalendarSyncButton";
import { isUserSignedIn } from "@/utils/google-calendar";

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

const AppointmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    const fetchAppointment = () => {
      setLoading(true);
      // Simulamos una llamada a API
      setTimeout(() => {
        const savedAppointments = localStorage.getItem("appointments");
        let appointmentsList = mockAppointments;
        
        if (savedAppointments) {
          try {
            // Parsear las fechas de cadenas a objetos Date
            const parsedAppointments = JSON.parse(savedAppointments).map((app: any) => ({
              ...app,
              date: new Date(app.date),
              createdAt: new Date(app.createdAt),
              updatedAt: app.updatedAt ? new Date(app.updatedAt) : undefined,
            }));
            appointmentsList = parsedAppointments;
          } catch (error) {
            console.error("Error parsing appointments:", error);
          }
        }
        
        const foundAppointment = appointmentsList.find(a => a.id === id);
        setAppointment(foundAppointment || null);
        setLoading(false);
      }, 800);
    };

    const checkGoogleConnection = async () => {
      try {
        setGoogleConnected(isUserSignedIn());
      } catch (error) {
        console.error("Error checking Google connection:", error);
      }
    };

    if (id) {
      fetchAppointment();
      checkGoogleConnection();
    }
  }, [id]);

  const handleEditAppointment = () => {
    navigate(`/citas/editar/${id}`);
  };

  const handleDeleteAppointment = () => {
    // Simulamos la eliminación
    if (!appointment) return;
    
    const savedAppointments = localStorage.getItem("appointments");
    if (savedAppointments) {
      try {
        const appointmentsList = JSON.parse(savedAppointments);
        const filteredAppointments = appointmentsList.filter((a: any) => a.id !== id);
        localStorage.setItem("appointments", JSON.stringify(filteredAppointments));
      } catch (error) {
        console.error("Error removing appointment:", error);
      }
    }
    
    toast.success("Cita eliminada correctamente");
    navigate("/citas");
  };

  const handleChangeStatus = (newStatus: AppointmentStatus) => {
    if (!appointment) return;
    
    // Actualizar en localStorage
    const savedAppointments = localStorage.getItem("appointments");
    if (savedAppointments) {
      try {
        const appointmentsList = JSON.parse(savedAppointments);
        const updatedAppointments = appointmentsList.map((a: any) => {
          if (a.id === id) {
            return {
              ...a,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        });
        
        localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
        
        // Actualizar el estado local
        setAppointment({
          ...appointment,
          status: newStatus,
          updatedAt: new Date(),
        });
        
        toast.success(`Estado de la cita actualizado a: ${newStatus}`);
      } catch (error) {
        console.error("Error updating appointment:", error);
        toast.error("Error al actualizar el estado de la cita");
      }
    }
  };

  const handleGoogleSync = (eventId: string) => {
    if (!appointment) return;
    
    // Actualizar en localStorage
    const savedAppointments = localStorage.getItem("appointments");
    if (savedAppointments) {
      try {
        const appointmentsList = JSON.parse(savedAppointments);
        const updatedAppointments = appointmentsList.map((a: any) => {
          if (a.id === id) {
            return {
              ...a,
              googleEventId: eventId,
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        });
        
        localStorage.setItem("appointments", JSON.stringify(updatedAppointments));
        
        // Actualizar el estado local
        setAppointment({
          ...appointment,
          googleEventId: eventId,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error("Error updating appointment:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6 mx-auto"></div>
            <div className="max-w-md mx-auto">
              <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <BackButton />
          <div className="text-center mt-8">
            <CalendarIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Cita no encontrada</h2>
            <p className="text-gray-500 mb-4">La cita que estás buscando no existe o ha sido eliminada.</p>
            <Button onClick={() => navigate("/citas")}>Ver todas las citas</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <BackButton />
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <Calendar className="mr-2 text-purple-500" />
              Detalle de la Cita
            </h1>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Información de la Cita</span>
                {googleConnected && (
                  <div>
                    <CalendarSyncButton 
                      appointment={appointment}
                      eventId={appointment.googleEventId}
                      onSync={handleGoogleSync}
                      action={appointment.googleEventId ? "update" : "create"}
                    />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">{appointment.patientName}</div>
                  <div className="text-sm text-gray-500">Paciente</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">
                    {format(appointment.date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                  </div>
                  <div className="text-sm text-gray-500">Fecha</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">
                    {appointment.time} ({appointment.duration} minutos)
                  </div>
                  <div className="text-sm text-gray-500">Hora y duración</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">{appointment.reason}</div>
                  <div className="text-sm text-gray-500">Motivo de la cita</div>
                </div>
              </div>
              
              {appointment.notes && (
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <div className="font-medium mb-1">Notas</div>
                  <div className="text-sm">{appointment.notes}</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={handleEditAppointment}>
                <Edit size={16} className="mr-2" />
                Editar
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash size={16} className="mr-2" />
                    Eliminar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>¿Eliminar esta cita?</DialogTitle>
                    <DialogDescription>
                      Esta acción no se puede deshacer. La cita será eliminada permanentemente.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDeleteAppointment}>
                      Eliminar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {appointment.status !== "Completada" && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={() => handleChangeStatus("Completada")}
                  >
                    Marcar como completada
                  </Button>
                )}
                
                {appointment.status !== "Cancelada" && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleChangeStatus("Cancelada")}
                  >
                    Cancelar cita
                  </Button>
                )}
                
                {appointment.status !== "Reprogramada" && (
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700" 
                    onClick={() => handleChangeStatus("Reprogramada")}
                  >
                    Reprogramar
                  </Button>
                )}
                
                {appointment.status !== "Pendiente" && (
                  <Button 
                    className="bg-yellow-600 hover:bg-yellow-700" 
                    onClick={() => handleChangeStatus("Pendiente")}
                  >
                    Marcar como pendiente
                  </Button>
                )}
                
                {appointment.status !== "Programada" && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700" 
                    onClick={() => handleChangeStatus("Programada")}
                  >
                    Marcar como programada
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {appointment.googleEventId && googleConnected && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Google Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Badge className="bg-green-100 text-green-800 mr-2">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Sincronizado
                  </Badge>
                  <CalendarSyncButton 
                    appointment={appointment}
                    eventId={appointment.googleEventId}
                    onSync={handleGoogleSync}
                    action="delete"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentDetail;
