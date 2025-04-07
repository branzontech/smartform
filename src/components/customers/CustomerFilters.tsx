
import React, { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  X,
  Calendar,
} from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { CustomerStatus, CustomerFrequency } from "@/types/customer-types";

export const CustomerFilters = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "">("");
  const [frequencyFilter, setFrequencyFilter] = useState<CustomerFrequency | "">("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<{
    status?: CustomerStatus;
    frequency?: CustomerFrequency;
    date?: Date;
  }>({});
  
  const applyFilters = () => {
    const filters: {
      status?: CustomerStatus;
      frequency?: CustomerFrequency;
      date?: Date;
    } = {};
    
    if (statusFilter) filters.status = statusFilter;
    if (frequencyFilter) filters.frequency = frequencyFilter;
    if (dateFilter) filters.date = dateFilter;
    
    setActiveFilters(filters);
  };
  
  const clearFilters = () => {
    setStatusFilter("");
    setFrequencyFilter("");
    setDateFilter(undefined);
    setActiveFilters({});
  };
  
  const removeFilter = (key: keyof typeof activeFilters) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    
    // Reset the corresponding state
    if (key === "status") setStatusFilter("");
    if (key === "frequency") setFrequencyFilter("");
    if (key === "date") setDateFilter(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-12"
          />
          {search && (
            <button 
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {Object.keys(activeFilters).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Object.keys(activeFilters).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <h4 className="font-medium">Filtrar Clientes</h4>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">Estado</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CustomerStatus | "")}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Cualquier estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Activo">Activos</SelectItem>
                    <SelectItem value="Inactivo">Inactivos</SelectItem>
                    <SelectItem value="Potencial">Potenciales</SelectItem>
                    <SelectItem value="Lead">Leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency-filter">Frecuencia</Label>
                <Select value={frequencyFilter} onValueChange={(value) => setFrequencyFilter(value as CustomerFrequency | "")}>
                  <SelectTrigger id="frequency-filter">
                    <SelectValue placeholder="Cualquier frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="Frecuente">Frecuentes</SelectItem>
                    <SelectItem value="Regular">Regulares</SelectItem>
                    <SelectItem value="Esporádico">Esporádicos</SelectItem>
                    <SelectItem value="Nuevo">Nuevos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Última visita desde</Label>
                <DatePicker 
                  value={dateFilter} 
                  onChange={setDateFilter} 
                  placeholder="Seleccionar fecha"
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Active filters */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.status && (
            <Badge variant="outline" className="flex items-center gap-1 pl-2">
              Estado: {activeFilters.status}
              <button onClick={() => removeFilter("status")} className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {activeFilters.frequency && (
            <Badge variant="outline" className="flex items-center gap-1 pl-2">
              Frecuencia: {activeFilters.frequency}
              <button onClick={() => removeFilter("frequency")} className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {activeFilters.date && (
            <Badge variant="outline" className="flex items-center gap-1 pl-2">
              Desde: {activeFilters.date.toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
              <button onClick={() => removeFilter("date")} className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
            Limpiar todos
          </Button>
        </div>
      )}
    </div>
  );
};
