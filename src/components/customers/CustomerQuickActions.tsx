
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Calendar, 
  Users, 
  Gift, 
  ArrowUpRight, 
  Bell
} from "lucide-react";
import { Link } from "react-router-dom";

export const CustomerQuickActions = () => {
  const quickActions = [
    {
      title: "Notificaciones",
      description: "Envía mensajes a tus clientes",
      icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
      actions: [
        {
          label: "Recordatorio general",
          path: "/app/clientes/notificaciones/nueva?type=Recordatorio"
        },
        {
          label: "Promoción",
          path: "/app/clientes/notificaciones/nueva?type=Promoción"
        },
        {
          label: "Mensaje personalizado",
          path: "/app/clientes/notificaciones/nueva"
        }
      ],
      stats: {
        value: 24,
        label: "enviadas este mes"
      }
    },
    {
      title: "Citas",
      description: "Gestiona las reservas",
      icon: <Calendar className="h-5 w-5 text-green-500" />,
      actions: [
        {
          label: "Nueva cita",
          path: "/app/citas/nueva"
        },
        {
          label: "Ver calendario",
          path: "/app/citas"
        }
      ],
      stats: {
        value: 8,
        label: "citas esta semana"
      }
    },
    {
      title: "Clientes",
      description: "Añade y gestiona clientes",
      icon: <Users className="h-5 w-5 text-purple-500" />,
      actions: [
        {
          label: "Nuevo cliente",
          path: "/app/clientes/nuevo"
        },
        {
          label: "Importar clientes",
          path: "/app/clientes/importar"
        }
      ],
      stats: {
        value: 156,
        label: "clientes activos"
      }
    },
    {
      title: "Fidelización",
      description: "Programas de fidelidad",
      icon: <Gift className="h-5 w-5 text-red-500" />,
      actions: [
        {
          label: "Enviar ofertas",
          path: "/app/clientes/notificaciones/nueva?type=Promoción"
        },
        {
          label: "Descuentos",
          path: "/app/clientes/descuentos"
        }
      ],
      stats: {
        value: 12,
        label: "clientes recompensados"
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {quickActions.map((action, index) => (
        <Card key={index} className="overflow-hidden backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                {action.icon}
              </div>
              <Badge variant="outline" className="font-normal text-xs">
                {action.stats.value} {action.stats.label}
              </Badge>
            </div>
            <CardTitle className="text-base mt-2">{action.title}</CardTitle>
            <CardDescription className="text-xs">{action.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex flex-col space-y-1">
              {action.actions.map((subAction, idx) => (
                <Link 
                  key={idx} 
                  to={subAction.path} 
                  className="text-sm font-medium text-primary hover:underline flex items-center"
                >
                  <span>{subAction.label}</span>
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
