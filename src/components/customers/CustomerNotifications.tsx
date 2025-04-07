
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Calendar, 
  Mail, 
  Image, 
  Clock,
  CheckCircle, 
  XCircle,
  Send,
  Filter,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { CustomerNotification } from "@/types/customer-types";

interface CustomerNotificationsProps {
  customerId: string;
}

// Mock data for customer notifications
const mockNotifications: CustomerNotification[] = [
  {
    id: "1",
    customerId: "1",
    customerName: "Ana García Martínez",
    type: "Recordatorio",
    channel: "WhatsApp",
    subject: "Recordatorio de cita",
    message: "Hola Ana, te recordamos que tienes una cita programada para mañana a las 10:30h con el Dr. Martínez. ¡Te esperamos!",
    status: "Enviado",
    sentAt: new Date(2023, 3, 18, 12, 0),
    createdAt: new Date(2023, 3, 18, 10, 0),
  },
  {
    id: "2",
    customerId: "1",
    customerName: "Ana García Martínez",
    type: "General",
    channel: "Email",
    subject: "Información sobre nuevos servicios",
    message: "Estimada Ana,\n\nQueremos informarte sobre nuestros nuevos servicios disponibles a partir de este mes...",
    status: "Enviado",
    sentAt: new Date(2023, 3, 10, 9, 30),
    createdAt: new Date(2023, 3, 9, 16, 45),
  },
  {
    id: "3",
    customerId: "1",
    customerName: "Ana García Martínez",
    type: "Felicitación",
    channel: "Ambos",
    subject: "¡Feliz cumpleaños!",
    message: "Querida Ana,\n\nTe deseamos un feliz cumpleaños y queremos agradecerte tu confianza durante todos estos años. Como regalo especial, te ofrecemos un 15% de descuento en tu próximo tratamiento.",
    imageUrl: "https://placehold.co/400x200?text=Feliz+Cumpleaños",
    status: "Enviado",
    sentAt: new Date(2022, 8, 15, 10, 0),
    createdAt: new Date(2022, 8, 15, 8, 0),
  },
  {
    id: "4",
    customerId: "1",
    customerName: "Ana García Martínez",
    type: "Promoción",
    channel: "Email",
    subject: "Oferta especial de primavera",
    message: "Aprovecha nuestra promoción especial de primavera con descuentos de hasta el 30% en todos nuestros servicios. ¡Válido solo este mes!",
    imageUrl: "https://placehold.co/600x300?text=Promoción+Primavera",
    status: "Enviado",
    sentAt: new Date(2023, 2, 21, 11, 0),
    createdAt: new Date(2023, 2, 20, 16, 30),
  },
  {
    id: "5",
    customerId: "1",
    customerName: "Ana García Martínez",
    type: "Recordatorio",
    channel: "WhatsApp",
    subject: "Recordatorio de seguimiento",
    message: "Hola Ana, han pasado 3 meses desde tu última visita. Te recomendamos programar una cita de seguimiento. ¿Te gustaría que te ayudáramos a agendar una fecha?",
    status: "Pendiente",
    scheduledFor: new Date(2023, 6, 20, 10, 0),
    createdAt: new Date(2023, 6, 15, 14, 0),
  },
];

export const CustomerNotifications = ({ customerId }: CustomerNotificationsProps) => {
  const [activeTab, setActiveTab] = useState<"all" | "sent" | "scheduled">("all");
  
  const filteredNotifications = mockNotifications.filter(notification => {
    if (activeTab === "sent") return notification.status === "Enviado";
    if (activeTab === "scheduled") return notification.status === "Pendiente";
    return true;
  });
  
  const getChannelIcon = (channel: CustomerNotification["channel"]) => {
    switch (channel) {
      case "WhatsApp":
        return <MessageCircle className="h-4 w-4 text-emerald-500" />;
      case "Email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "Ambos":
        return (
          <div className="flex -space-x-1">
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            <Mail className="h-4 w-4 text-blue-500" />
          </div>
        );
      default:
        return null;
    }
  };
  
  const getStatusIcon = (status: CustomerNotification["status"]) => {
    switch (status) {
      case "Enviado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Pendiente":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "Fallido":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: CustomerNotification["status"], date?: Date) => {
    switch (status) {
      case "Enviado":
        return `Enviado el ${date?.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        })}`;
      case "Pendiente":
        return `Programado para ${date?.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        })}`;
      case "Fallido":
        return "Envío fallido";
      default:
        return "";
    }
  };
  
  const getTypeBadge = (type: CustomerNotification["type"]) => {
    switch (type) {
      case "Recordatorio":
        return <Badge className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800">{type}</Badge>;
      case "Felicitación":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">{type}</Badge>;
      case "Promoción":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">{type}</Badge>;
      case "General":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-800">{type}</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Historial de comunicaciones con el cliente</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtrar</span>
            </Button>
            
            <Link to={`/app/clientes/notificaciones/nueva?id=${customerId}`}>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="mb-4" onValueChange={(value) => setActiveTab(value as "all" | "sent" | "scheduled")}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="sent">Enviadas</TabsTrigger>
            <TabsTrigger value="scheduled">Programadas</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(notification.type)}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      {getChannelIcon(notification.channel)}
                      {notification.channel}
                    </span>
                  </div>
                  
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {getStatusIcon(notification.status)}
                    {getStatusText(
                      notification.status, 
                      notification.status === "Enviado" 
                        ? notification.sentAt 
                        : notification.scheduledFor
                    )}
                  </span>
                </div>
                
                <h3 className="font-medium">{notification.subject}</h3>
                <p className="mt-1 text-sm whitespace-pre-line line-clamp-3">{notification.message}</p>
                
                {notification.imageUrl && (
                  <div className="mt-3 relative overflow-hidden rounded-md" style={{ maxWidth: '200px' }}>
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <Image className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <img 
                      src={notification.imageUrl}
                      alt={notification.subject} 
                      className="w-full h-auto relative z-10"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="mt-3 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Send className="h-3 w-3" />
                    {notification.status === "Pendiente" ? "Enviar ahora" : "Reenviar"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium text-lg">No hay notificaciones</h3>
              <p className="text-muted-foreground">No se han enviado notificaciones a este cliente</p>
              <Link to={`/app/clientes/notificaciones/nueva?id=${customerId}`}>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva notificación
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
