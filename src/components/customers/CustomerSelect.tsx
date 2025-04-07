
import React, { useState } from "react";
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Customer } from "@/types/customer-types";

// Mock data for customers
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

interface CustomerSelectProps {
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export const CustomerSelect = ({ onSelect, selectedId }: CustomerSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCustomer = mockCustomers.find(customer => customer.id === selectedId);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };
  
  const getFilteredCustomers = () => {
    if (!search) return mockCustomers;
    
    const searchLower = search.toLowerCase();
    return mockCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) || 
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(search)
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white dark:bg-gray-800"
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedCustomer.profileImage || undefined} alt={selectedCustomer.name} />
                <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs">
                  {getInitials(selectedCustomer.name)}
                </AvatarFallback>
              </Avatar>
              <span>{selectedCustomer.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Selecciona un cliente</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <Command>
          <CommandInput 
            placeholder="Buscar cliente..." 
            value={search}
            onValueChange={setSearch}
            autoFocus 
          />
          <CommandList>
            <CommandEmpty>No se encontraron clientes</CommandEmpty>
            <CommandGroup heading="Clientes">
              {getFilteredCustomers().map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => {
                    onSelect(customer.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={customer.profileImage || undefined} alt={customer.name} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                      <span className="text-xs text-muted-foreground">{customer.email || customer.phone}</span>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="ml-2"
                  >
                    {customer.status}
                  </Badge>
                  <Check
                    className={`ml-auto h-4 w-4 ${
                      selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
