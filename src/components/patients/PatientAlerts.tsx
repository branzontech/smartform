
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Calendar, 
  Check, 
  Clock, 
  AlertTriangle, 
  X, 
  Info,
  ArrowUpRight
} from "lucide-react";
import { PatientAlert } from "@/types/patient-types";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PatientAlertsProps {
  patientId?: string; // Si se proporciona, sólo se muestran las alertas de ese paciente
  limit?: number; // Limitar número de alertas mostradas
  showAll?: boolean; // Mostrar todas las alertas o sólo pendientes
  className?: string;
}

export function PatientAlerts({ 
  patientId, 
  limit = 5, 
  showAll = false,
  className 
}: PatientAlertsProps) {
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Cargar alertas desde localStorage
      const savedAlerts = localStorage.getItem('patientAlerts');
      if (savedAlerts) {
        try {
          let parsedAlerts = JSON.parse(savedAlerts);
          
          // Convertir fechas
          parsedAlerts = parsedAlerts.map((alert: any) => ({
            ...alert,
            dueDate: new Date(alert.dueDate),
            createdAt: new Date(alert.createdAt),
            dismissedAt: alert.dismissedAt ? new Date(alert.dismissedAt) : undefined
          }));
          
          // Filtrar por paciente si se proporciona un ID
          if (patientId) {
            parsedAlerts = parsedAlerts.filter((alert: PatientAlert) => alert.patientId === patientId);
          }
          
          // Filtrar por estado si no se muestran todas
          if (!showAll) {
            parsedAlerts = parsedAlerts.filter((alert: PatientAlert) => alert.status === 'Pendiente');
          }
          
          // Ordenar por fecha de vencimiento y prioridad
          parsedAlerts.sort((a: PatientAlert, b: PatientAlert) => {
            // Priorizar alertas vencidas
            const aIsPast = isPast(a.dueDate) && !isToday(a.dueDate);
            const bIsPast = isPast(b.dueDate) && !isToday(b.dueDate);
            
            if (aIsPast && !bIsPast) return -1;
            if (!aIsPast && bIsPast) return 1;
            
            // Luego por prioridad
            const priorityOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            // Finalmente por fecha
            return a.dueDate.getTime() - b.dueDate.getTime();
          });
          
          // Limitar número de alertas si es necesario
          if (limit && !isNaN(limit)) {
            parsedAlerts = parsedAlerts.slice(0, limit);
          }
          
          setAlerts(parsedAlerts);
        } catch (error) {
          console.error('Error parsing alerts:', error);
          setAlerts([]);
        }
      } else {
        setAlerts([]);
      }
      
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [patientId, limit, showAll]);

  const handleMarkAsComplete = (alertId: string) => {
    // Actualizar el estado de la alerta en localStorage
    const savedAlerts = localStorage.getItem('patientAlerts');
    if (savedAlerts) {
      const parsedAlerts = JSON.parse(savedAlerts);
      const updatedAlerts = parsedAlerts.map((alert: any) => {
        if (alert.id === alertId) {
          return {
            ...alert,
            status: 'Completada',
            dismissedAt: new Date().toISOString()
          };
        }
        return alert;
      });
      
      localStorage.setItem('patientAlerts', JSON.stringify(updatedAlerts));
      
      // Actualizar el estado local
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alerta completada",
        description: "La alerta ha sido marcada como completada",
      });
    }
  };

  const handleDismiss = (alertId: string) => {
    // Actualizar el estado de la alerta en localStorage
    const savedAlerts = localStorage.getItem('patientAlerts');
    if (savedAlerts) {
      const parsedAlerts = JSON.parse(savedAlerts);
      const updatedAlerts = parsedAlerts.map((alert: any) => {
        if (alert.id === alertId) {
          return {
            ...alert,
            status: 'Cancelada',
            dismissedAt: new Date().toISOString()
          };
        }
        return alert;
      });
      
      localStorage.setItem('patientAlerts', JSON.stringify(updatedAlerts));
      
      // Actualizar el estado local
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alerta descartada",
        description: "La alerta ha sido cancelada",
      });
    }
  };

  const navigateToPatient = (patientId: string) => {
    navigate(`/pacientes/${patientId}`);
  };

  const getAlertStatusBadge = (alert: PatientAlert) => {
    // Determinar el estado visual de la alerta
    const isPastDue = isPast(alert.dueDate) && !isToday(alert.dueDate);
    const isToday_ = isToday(alert.dueDate);
    const isTomorrow_ = isTomorrow(alert.dueDate);
    const daysUntilDue = differenceInDays(alert.dueDate, new Date());
    
    if (isPastDue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Vencida</span>
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
          <Calendar className="h-3 w-3" />
          <span>Mañana</span>
        </Badge>
      );
    } else if (daysUntilDue <= 3) {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Próxima</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Programada</span>
        </Badge>
      );
    }
  };

  const getAlertPriorityBadge = (priority: 'Alta' | 'Media' | 'Baja') => {
    if (priority === 'Alta') {
      return <Badge className="bg-red-500">Alta</Badge>;
    } else if (priority === 'Media') {
      return <Badge className="bg-yellow-500">Media</Badge>;
    } else {
      return <Badge className="bg-green-500">Baja</Badge>;
    }
  };

  // Renderizar estado de carga
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2" />
            Alertas y seguimientos
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

  // Filtrar alertas según la pestaña activa
  const pendingAlerts = alerts.filter(alert => alert.status === 'Pendiente');
  const completedAlerts = alerts.filter(alert => alert.status === 'Completada');
  const dismissedAlerts = alerts.filter(alert => alert.status === 'Cancelada');
  
  const currentAlerts = activeTab === 'pending' 
    ? pendingAlerts 
    : activeTab === 'completed' 
      ? completedAlerts 
      : dismissedAlerts;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Bell className="mr-2 text-purple-500" />
          Alertas y seguimientos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showAll && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 grid grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                Pendientes
                {pendingAlerts.length > 0 && (
                  <Badge className="ml-1 bg-purple-500">{pendingAlerts.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                <Check className="mr-1 h-4 w-4" />
                Completadas
              </TabsTrigger>
              <TabsTrigger value="dismissed">
                <X className="mr-1 h-4 w-4" />
                Canceladas
              </TabsTrigger>
            </TabsList>
            
            {(activeTab === 'pending' && pendingAlerts.length === 0) ||
             (activeTab === 'completed' && completedAlerts.length === 0) ||
             (activeTab === 'dismissed' && dismissedAlerts.length === 0) ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay alertas {
                  activeTab === 'pending' ? 'pendientes' : 
                  activeTab === 'completed' ? 'completadas' : 'canceladas'
                }</p>
              </div>
            ) : null}
          </Tabs>
        )}
        
        {currentAlerts.length === 0 && !showAll ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No hay alertas pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  isPast(alert.dueDate) && !isToday(alert.dueDate) 
                    ? 'bg-red-50 border-red-200' 
                    : isToday(alert.dueDate)
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getAlertStatusBadge(alert)}
                      {getAlertPriorityBadge(alert.priority)}
                      <Badge variant="outline" className="flex items-center gap-1">
                        {alert.type === 'Seguimiento' && <Calendar className="h-3 w-3" />}
                        {alert.type}
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium truncate">
                      {alert.patientName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Fecha: {format(alert.dueDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0" 
                      onClick={() => navigateToPatient(alert.patientId)}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {activeTab === 'pending' && (
                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <X className="h-3 w-3 mr-1" /> Descartar
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="h-7 bg-green-600 hover:bg-green-700 text-xs"
                      onClick={() => handleMarkAsComplete(alert.id)}
                    >
                      <Check className="h-3 w-3 mr-1" /> Completar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
