
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Edit, 
  MoreHorizontal, 
  MessageCircle, 
  Calendar, 
  Trash2,
  Eye
} from "lucide-react";
import { Customer } from "@/types/customer-types";

// Mock data - in a real app this would come from API
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Ana García Martínez",
    email: "ana.garcia@example.com",
    phone: "+34 612 345 678",
    whatsapp: "+34 612 345 678",
    status: "Activo",
    frequency: "Frecuente",
    loyalty: "Alta",
    lastContact: new Date(2023, 2, 15),
    nextContactDate: new Date(2023, 4, 1),
    createdAt: new Date(2020, 5, 10),
    appointmentCount: 24,
    totalSpent: 1850,
    lastAppointment: new Date(2023, 3, 20),
    tags: ["VIP", "Tratamiento mensual"]
  },
  {
    id: "2",
    name: "Carlos Rodríguez López",
    email: "carlos.rodriguez@example.com",
    phone: "+34 623 456 789",
    status: "Inactivo",
    frequency: "Esporádico",
    loyalty: "Baja",
    lastContact: new Date(2022, 10, 5),
    createdAt: new Date(2021, 2, 20),
    appointmentCount: 3,
    totalSpent: 250,
    lastAppointment: new Date(2022, 10, 1),
  },
  {
    id: "3",
    name: "María Fernández González",
    email: "maria.fernandez@example.com",
    phone: "+34 634 567 890",
    whatsapp: "+34 634 567 890",
    status: "Activo",
    frequency: "Regular",
    loyalty: "Media",
    lastContact: new Date(2023, 1, 20),
    nextContactDate: new Date(2023, 3, 15),
    createdAt: new Date(2021, 8, 12),
    appointmentCount: 12,
    totalSpent: 980,
    lastAppointment: new Date(2023, 1, 15),
    tags: ["Descuentos", "Preferencial"]
  },
  {
    id: "4",
    name: "David Sánchez Pérez",
    email: "david.sanchez@example.com",
    phone: "+34 645 678 901",
    status: "Potencial",
    frequency: "Nuevo",
    loyalty: "Sin historial",
    lastContact: new Date(2023, 3, 1),
    createdAt: new Date(2023, 3, 1),
    appointmentCount: 0,
    totalSpent: 0,
  },
  {
    id: "5",
    name: "Laura Gómez Martín",
    email: "laura.gomez@example.com",
    phone: "+34 656 789 012",
    whatsapp: "+34 656 789 012",
    status: "Activo",
    frequency: "Frecuente",
    loyalty: "Alta",
    lastContact: new Date(2023, 2, 28),
    nextContactDate: new Date(2023, 3, 25),
    createdAt: new Date(2020, 1, 5),
    appointmentCount: 32,
    totalSpent: 2340,
    lastAppointment: new Date(2023, 2, 20),
    tags: ["VIP", "Planes especiales"]
  }
];

export const CustomerTable = () => {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  
  const toggleSelectAll = () => {
    if (selectedCustomers.length === mockCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(mockCustomers.map(customer => customer.id));
    }
  };
  
  const toggleSelectCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(customerId => customerId !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };
  
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
  
  const getFrequencyColor = (frequency: Customer["frequency"]) => {
    switch (frequency) {
      case "Frecuente":
        return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800";
      case "Regular":
        return "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800";
      case "Esporádico":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "Nuevo":
        return "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedCustomers.length === mockCustomers.length && mockCustomers.length > 0} 
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Contacto</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead className="hidden md:table-cell">Frecuencia</TableHead>
              <TableHead className="hidden lg:table-cell">Última Visita</TableHead>
              <TableHead className="w-20 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCustomers.map((customer) => (
              <TableRow key={customer.id} className="group">
                <TableCell>
                  <Checkbox 
                    checked={selectedCustomers.includes(customer.id)} 
                    onCheckedChange={() => toggleSelectCustomer(customer.id)}
                    aria-label={`Seleccionar ${customer.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={customer.profileImage || undefined} alt={customer.name} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">Cliente desde {customer.createdAt.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="text-sm">{customer.email}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{customer.phone}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge className={`font-normal ${getStatusColor(customer.status)}`}>
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className={`font-normal ${getFrequencyColor(customer.frequency)}`}>
                    {customer.frequency}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {customer.lastAppointment 
                    ? customer.lastAppointment.toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                    : "Sin visitas"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link to={`/app/clientes/${customer.id}`} className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Ver detalles</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link to={`/app/clientes/editar/${customer.id}`} className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link to={`/app/clientes/notificaciones/nueva?id=${customer.id}`} className="flex items-center">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          <span>Enviar mensaje</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link to={`/app/citas/nueva?clienteId=${customer.id}`} className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>Agendar cita</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 dark:text-red-400 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
