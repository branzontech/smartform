import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, isToday, isPast, isFuture, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CalendarClock, 
  Users, 
  MessageSquare, 
  Mail,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCheck,
  Calendar
} from "lucide-react";
import { CustomerReminder, NotificationChannel } from "@/types/customer-types";

interface MedicalNotification extends CustomerReminder {
  priority: 'Alta' | 'Media' | 'Baja';
  patientType: 'Paciente' | 'Cliente';
  lastAction?: string;
}

// Mock data para notificaciones médicas
const mockMedicalNotifications: MedicalNotification[] = [
  {
    id: "1",
    customerId: "1",
    customerName: "Ana García Martínez",
    title: "Seguimiento post-operatorio",
    message: "Verificar cicatrización y estado general después de cirugía estética. Revisar si hay inflamación o complicaciones.",
    reminderDate: new Date(), // Hoy
    status: "Pendiente",
    frequency: "Una vez",
    channel: "WhatsApp",
    createdAt: new Date(2023, 6, 10),
    priority: 'Alta',
    patientType: 'Paciente',
    lastAction: 'Cirugía realizada hace 3 días'
  },
  {
    id: "2",
    customerId: "2",
    customerName: "Carlos Rodríguez",
    title: "Control de tratamiento nutricional",
    message: "Revisar progreso del plan nutricional. Evaluar pérdida de peso y adherencia a la dieta.",
    reminderDate: addDays(new Date(), -2), // Vencido
    status: "Pendiente",
    frequency: "Semanal",
    channel: "Email",
    createdAt: new Date(2023, 5, 15),
    priority: 'Media',
    patientType: 'Cliente',
    lastAction: 'Última consulta hace 15 días'
  },
  {
    id: "3",
    customerId: "3",
    customerName: "María Fernández",
    title: "Sesión de terapia psicológica",
    message: "Agendar próxima sesión de terapia. Paciente mostró mejorías en la última consulta.",
    reminderDate: addDays(new Date(), 1), // Mañana
    status: "Pendiente",
    frequency: "Mensual",
    channel: "Ambos",
    createdAt: new Date(2023, 5, 20),
    priority: 'Media',
    patientType: 'Paciente',
    lastAction: 'Sesión completada hace 1 semana'
  },
  {
    id: "4",
    customerId: "4",
    customerName: "Roberto Silva",
    title: "Revisión de resultados de laboratorio",
    message: "Analizar resultados de exámenes de sangre y definir ajustes en medicación si es necesario.",
    reminderDate: addDays(new Date(), 3), // En 3 días
    status: "Pendiente",
    frequency: "Una vez",
    channel: "WhatsApp",
    createdAt: new Date(2023, 6, 15),
    priority: 'Alta',
    patientType: 'Paciente',
    lastAction: 'Exámenes tomados hace 2 días'
  }
];

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<MedicalNotification[]>(mockMedicalNotifications);
  const [activeTab, setActiveTab] = useState<"overdue" | "today" | "upcoming">("overdue");

  const overdueNotifications = notifications.filter(n => 
    n.status === "Pendiente" && isPast(n.reminderDate) && !isToday(n.reminderDate)
  );
  
  const todayNotifications = notifications.filter(n => 
    n.status === "Pendiente" && isToday(n.reminderDate)
  );
  
  const upcomingNotifications = notifications.filter(n => 
    n.status === "Pendiente" && isFuture(n.reminderDate) && !isToday(n.reminderDate)
  );

  const handleMarkAsCompleted = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, status: "Enviado", completedAt: new Date() } : n
    ));
  };

  const handleViewDetails = (id: string) => {
    // Navegar a detalles del paciente/cliente
    console.log(`Ver detalles de notificación: ${id}`);
  };

  const getPriorityColor = (priority: 'Alta' | 'Media' | 'Baja') => {
    switch (priority) {
      case 'Alta':
        return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'Media':
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800';
      case 'Baja':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
    }
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case "WhatsApp":
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case "Email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "Ambos":
        return (
          <div className="flex -space-x-1">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <Mail className="h-4 w-4 text-blue-500" />
          </div>
        );
    }
  };

  const NotificationCard = ({ notification }: { notification: MedicalNotification }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {notification.priority === 'Alta' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {notification.priority === 'Media' && <Clock className="h-5 w-5 text-amber-500" />}
              {notification.priority === 'Baja' && <Bell className="h-5 w-5 text-blue-500" />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </Badge>
              </div>
              
              <p className="text-sm font-medium text-primary mb-1">{notification.customerName}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {notification.message}
              </p>
              
              {notification.lastAction && (
                <p className="text-xs text-muted-foreground italic mb-2">
                  • {notification.lastAction}
                </p>
              )}
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  {format(notification.reminderDate, "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
                <div className="flex items-center gap-1">
                  {getChannelIcon(notification.channel)}
                  {notification.channel}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {notification.patientType}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={() => handleViewDetails(notification.id)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver detalles
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8"
            onClick={() => handleMarkAsCompleted(notification.id)}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Completar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Resumen de notificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${overdueNotifications.length > 0 ? 'border-red-200 dark:border-red-800' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {overdueNotifications.length}
                </p>
                <p className="text-sm text-muted-foreground">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${todayNotifications.length > 0 ? 'border-amber-200 dark:border-amber-800' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {todayNotifications.length}
                </p>
                <p className="text-sm text-muted-foreground">Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {upcomingNotifications.length}
                </p>
                <p className="text-sm text-muted-foreground">Próximas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Centro de Notificaciones de Seguimiento</CardTitle>
          <CardDescription>
            Gestiona los recordatorios de seguimiento médico para tus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="overdue" className="text-red-600 dark:text-red-400">
                Vencidas ({overdueNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="today" className="text-amber-600 dark:text-amber-400">
                Hoy ({todayNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-blue-600 dark:text-blue-400">
                Próximas ({upcomingNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overdue">
              {overdueNotifications.length > 0 ? (
                <div className="space-y-3">
                  <Alert className="border-red-200 dark:border-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-600 dark:text-red-400">
                      Tienes {overdueNotifications.length} notificación(es) vencida(s) que requieren atención inmediata.
                    </AlertDescription>
                  </Alert>
                  {overdueNotifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>¡Excelente! No tienes notificaciones vencidas.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="today">
              {todayNotifications.length > 0 ? (
                <div className="space-y-3">
                  <Alert className="border-amber-200 dark:border-amber-800">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-amber-600 dark:text-amber-400">
                      Tienes {todayNotifications.length} seguimiento(s) programado(s) para hoy.
                    </AlertDescription>
                  </Alert>
                  {todayNotifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarClock className="h-12 w-12 mx-auto mb-3" />
                  <p>No tienes seguimientos programados para hoy.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              {upcomingNotifications.length > 0 ? (
                <div className="space-y-3">
                  {upcomingNotifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3" />
                  <p>No tienes seguimientos próximos programados.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};