
import React from "react";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  MessageCircle, 
  Edit, 
  MoreHorizontal,
  ClipboardList
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Customer } from "@/types/customer-types";

interface CustomerHeaderProps {
  customer: Customer;
}

export const CustomerHeader = ({ customer }: CustomerHeaderProps) => {
  const getStatusColor = (status: Customer["status"]) => {
    switch (status) {
      case "Activo":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "Inactivo":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "Potencial":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "Lead":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
      default:
        return "";
    }
  };
  
  const getLoyaltyColor = (loyalty: Customer["loyalty"]) => {
    switch (loyalty) {
      case "Alta":
        return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800";
      case "Media":
        return "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800";
      case "Baja":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "Sin historial":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <Avatar className="h-20 w-20 border-2 border-white shadow-md">
          <AvatarImage src={customer.profileImage || undefined} alt={customer.name} />
          <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xl">
            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className={`font-normal ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </Badge>
                <Badge className={`font-normal ${getLoyaltyColor(customer.loyalty)}`}>
                  Fidelidad: {customer.loyalty}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Cliente desde {customer.createdAt.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
            
            <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
              <Link to={`/app/clientes/notificaciones/nueva?id=${customer.id}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  Mensaje
                </Button>
              </Link>
              
              <Link to={`/app/citas/nueva?clienteId=${customer.id}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Cita
                </Button>
              </Link>
              
              <Link to={`/app/clientes/editar/${customer.id}`}>
                <Button size="sm" className="flex items-center gap-1">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <DropdownMenuLabel>Más acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link to={`/app/crear?clienteId=${customer.id}`} className="flex items-center">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>Crear formulario</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <span className="text-red-600 dark:text-red-400 flex items-center">
                      <span>Desactivar cliente</span>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="text-lg font-semibold">{customer.appointmentCount}</div>
              <div className="text-xs text-muted-foreground">Citas</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="text-lg font-semibold">{customer.totalSpent ? `${customer.totalSpent}€` : '0€'}</div>
              <div className="text-xs text-muted-foreground">Gastado</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="text-lg font-semibold">{customer.lastAppointment ? customer.lastAppointment.toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short'
              }) : 'Nunca'}</div>
              <div className="text-xs text-muted-foreground">Última visita</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
