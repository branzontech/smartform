
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MessageCircle, 
  CreditCard, 
  FilePlus, 
  Clock, 
  CheckCircle2,
  XCircle,
  Stethoscope,
  Receipt
} from "lucide-react";

interface CustomerHistoryProps {
  customerId: string;
}

type HistoryEvent = {
  id: string;
  type: "appointment" | "message" | "payment" | "form" | "note" | "status";
  title: string;
  description?: string;
  date: Date;
  status?: "success" | "pending" | "cancelled";
  amount?: number;
  form?: string;
  icon?: JSX.Element;
};

// Mock data for customer history
const mockHistoryEvents: HistoryEvent[] = [
  {
    id: "1",
    type: "appointment",
    title: "Consulta general",
    description: "Consulta de seguimiento con Dr. Martínez",
    date: new Date(2023, 3, 20, 10, 30),
    status: "success",
    icon: <Stethoscope className="h-4 w-4" />
  },
  {
    id: "2",
    type: "message",
    title: "Recordatorio de cita",
    description: "Enviado por WhatsApp",
    date: new Date(2023, 3, 18, 12, 0),
    status: "success",
    icon: <MessageCircle className="h-4 w-4" />
  },
  {
    id: "3",
    type: "payment",
    title: "Pago de consulta",
    description: "Tarjeta de crédito",
    date: new Date(2023, 3, 20, 11, 15),
    status: "success",
    amount: 120,
    icon: <CreditCard className="h-4 w-4" />
  },
  {
    id: "4",
    type: "form",
    title: "Formulario completado",
    description: "Historial médico actualizado",
    date: new Date(2023, 3, 20, 10, 0),
    form: "Historial médico",
    icon: <FilePlus className="h-4 w-4" />
  },
  {
    id: "5",
    type: "appointment",
    title: "Próxima cita",
    description: "Revisión trimestral",
    date: new Date(2023, 6, 15, 9, 0),
    status: "pending",
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: "6",
    type: "status",
    title: "Cambio de estado",
    description: "Cliente marcado como Activo",
    date: new Date(2023, 2, 10, 14, 30),
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  {
    id: "7",
    type: "payment",
    title: "Factura emitida",
    description: "Servicios de marzo",
    date: new Date(2023, 3, 5, 16, 45),
    status: "pending",
    amount: 250,
    icon: <Receipt className="h-4 w-4" />
  },
  {
    id: "8",
    type: "appointment",
    title: "Cita cancelada",
    description: "Cancelada por el cliente",
    date: new Date(2023, 2, 25, 11, 0),
    status: "cancelled",
    icon: <XCircle className="h-4 w-4" />
  },
];

// Group events by date for display
const groupEventsByDate = (events: HistoryEvent[]) => {
  const groups: {[key: string]: HistoryEvent[]} = {};
  
  events.forEach(event => {
    const dateKey = event.date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(event);
  });
  
  // Sort dates from newest to oldest
  return Object.entries(groups)
    .sort((a, b) => {
      const dateA = new Date(a[1][0].date);
      const dateB = new Date(b[1][0].date);
      return dateB.getTime() - dateA.getTime();
    });
};

export const CustomerHistory = ({ customerId }: CustomerHistoryProps) => {
  const groupedEvents = groupEventsByDate(mockHistoryEvents);
  
  const getStatusBadge = (status?: HistoryEvent["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">Completado</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Pendiente</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Cancelado</Badge>;
      default:
        return null;
    }
  };
  
  const getEventIcon = (event: HistoryEvent) => {
    if (event.icon) return event.icon;
    
    switch (event.type) {
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      case "message":
        return <MessageCircle className="h-4 w-4" />;
      case "payment":
        return <CreditCard className="h-4 w-4" />;
      case "form":
        return <FilePlus className="h-4 w-4" />;
      case "note":
      case "status":
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };
  
  const getEventTypeColor = (type: HistoryEvent["type"]) => {
    switch (type) {
      case "appointment":
        return "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300";
      case "message":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300";
      case "payment":
        return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300";
      case "form":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300";
      case "note":
      case "status":
      default:
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Historial de Actividad</CardTitle>
            <CardDescription>Todas las interacciones con el cliente</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Añadir nota
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {groupedEvents.map(([date, events]) => (
            <div key={date}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 py-2">
                <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
                <Separator className="mt-2" />
              </div>
              
              <div className="mt-4 space-y-6">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${getEventTypeColor(event.type)}`}>
                      {getEventIcon(event)}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground mt-1">{event.description}</div>
                          )}
                        </div>
                        
                        {getStatusBadge(event.status)}
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-muted-foreground">
                          {event.date.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        
                        {event.amount !== undefined && (
                          <div className="text-sm font-medium">
                            {event.amount.toLocaleString('es-ES', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
