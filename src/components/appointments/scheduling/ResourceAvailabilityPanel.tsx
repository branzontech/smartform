import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Monitor,
  Building2,
  Box,
  Check,
  X,
  AlertTriangle,
  Clock,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SharedResource, ResourceType } from "@/types/appointment-types";

// Mock shared resources
const mockResources: SharedResource[] = [
  {
    id: "equip1",
    name: "Ecógrafo 4D",
    type: "equipment",
    description: "Ecógrafo de última generación",
    location: "Consultorio 201",
    isAvailable: true,
    maintenanceSchedule: [
      { dayOfWeek: 3, startTime: "14:00", endTime: "16:00" }
    ],
    bookings: [
      {
        id: "b1",
        resourceId: "equip1",
        appointmentId: "apt1",
        date: new Date(),
        startTime: "10:00",
        endTime: "11:00",
        bookedBy: "Dr. Carlos Jiménez",
        bookedAt: new Date()
      }
    ]
  },
  {
    id: "equip2",
    name: "Electrocardiógrafo",
    type: "equipment",
    description: "ECG de 12 derivaciones",
    location: "Consultorio 102",
    isAvailable: true,
    bookings: []
  },
  {
    id: "room1",
    name: "Sala de Procedimientos A",
    type: "room",
    description: "Sala equipada para procedimientos menores",
    isAvailable: false, // In use
    bookings: [
      {
        id: "b2",
        resourceId: "room1",
        appointmentId: "apt2",
        date: new Date(),
        startTime: "09:00",
        endTime: "12:00",
        bookedBy: "Dra. María González",
        bookedAt: new Date()
      }
    ]
  },
  {
    id: "office1",
    name: "Consultorio 305",
    type: "office",
    description: "Consultorio con equipamiento básico",
    location: "Piso 3",
    isAvailable: true,
    bookings: []
  }
];

const resourceTypeConfig: Record<ResourceType, { icon: React.ReactNode; label: string; color: string }> = {
  equipment: { 
    icon: <Monitor className="w-4 h-4" />, 
    label: "Equipo",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  },
  office: { 
    icon: <Building2 className="w-4 h-4" />, 
    label: "Consultorio",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20"
  },
  room: { 
    icon: <Box className="w-4 h-4" />, 
    label: "Sala",
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20"
  }
};

interface ResourceAvailabilityPanelProps {
  selectedDate: Date;
  selectedTime: string;
  duration: number;
  selectedResources: string[];
  onResourceToggle: (resourceId: string) => void;
}

export const ResourceAvailabilityPanel: React.FC<ResourceAvailabilityPanelProps> = ({
  selectedDate,
  selectedTime,
  duration,
  selectedResources,
  onResourceToggle
}) => {
  const [resources] = useState<SharedResource[]>(mockResources);

  // Check if resource is available at selected time
  const getResourceAvailability = (resource: SharedResource) => {
    if (!resource.isAvailable) return { available: false, reason: "En uso actualmente" };
    
    // Check maintenance schedule
    const dayOfWeek = selectedDate.getDay();
    const maintenance = resource.maintenanceSchedule?.find(m => m.dayOfWeek === dayOfWeek);
    if (maintenance) {
      const [selHour, selMin] = selectedTime.split(":").map(Number);
      const [maintStartHour, maintStartMin] = maintenance.startTime.split(":").map(Number);
      const [maintEndHour, maintEndMin] = maintenance.endTime.split(":").map(Number);
      
      const selMinutes = selHour * 60 + selMin;
      const maintStartMinutes = maintStartHour * 60 + maintStartMin;
      const maintEndMinutes = maintEndHour * 60 + maintEndMin;
      const selEndMinutes = selMinutes + duration;
      
      if (selMinutes < maintEndMinutes && selEndMinutes > maintStartMinutes) {
        return { 
          available: false, 
          reason: `Mantenimiento: ${maintenance.startTime} - ${maintenance.endTime}` 
        };
      }
    }
    
    // Check existing bookings
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const conflictingBooking = resource.bookings.find(booking => {
      if (format(booking.date, "yyyy-MM-dd") !== dateKey) return false;
      
      const [selHour, selMin] = selectedTime.split(":").map(Number);
      const [bookStartHour, bookStartMin] = booking.startTime.split(":").map(Number);
      const [bookEndHour, bookEndMin] = booking.endTime.split(":").map(Number);
      
      const selMinutes = selHour * 60 + selMin;
      const bookStartMinutes = bookStartHour * 60 + bookStartMin;
      const bookEndMinutes = bookEndHour * 60 + bookEndMin;
      const selEndMinutes = selMinutes + duration;
      
      return selMinutes < bookEndMinutes && selEndMinutes > bookStartMinutes;
    });
    
    if (conflictingBooking) {
      return { 
        available: false, 
        reason: `Reservado: ${conflictingBooking.startTime} - ${conflictingBooking.endTime}` 
      };
    }
    
    return { available: true, reason: null };
  };

  // Group resources by type
  const groupedResources = useMemo(() => {
    const grouped: Record<ResourceType, SharedResource[]> = {
      equipment: [],
      office: [],
      room: []
    };
    
    resources.forEach(r => {
      grouped[r.type].push(r);
    });
    
    return grouped;
  }, [resources]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Box className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Recursos Compartidos</span>
      </div>

      {selectedTime ? (
        <ScrollArea className="h-[200px]">
          <div className="space-y-4 pr-2">
            {(Object.keys(groupedResources) as ResourceType[]).map((type) => {
              const typeConfig = resourceTypeConfig[type];
              const typeResources = groupedResources[type];
              
              if (typeResources.length === 0) return null;
              
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    {typeConfig.icon}
                    <span className="text-xs font-medium text-muted-foreground">
                      {typeConfig.label}s
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {typeResources.map((resource) => {
                      const { available, reason } = getResourceAvailability(resource);
                      const isSelected = selectedResources.includes(resource.id);
                      
                      return (
                        <motion.button
                          key={resource.id}
                          whileHover={available ? { scale: 1.01 } : {}}
                          whileTap={available ? { scale: 0.99 } : {}}
                          onClick={() => available && onResourceToggle(resource.id)}
                          disabled={!available}
                          className={cn(
                            "w-full p-2.5 rounded-xl text-left transition-all border",
                            !available
                              ? "opacity-50 cursor-not-allowed bg-muted/10 border-border/20"
                              : isSelected
                              ? "bg-lime text-lime-foreground border-lime/50 shadow-md"
                              : "bg-muted/20 border-border/20 hover:border-border/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center",
                                isSelected 
                                  ? "bg-lime-foreground/20" 
                                  : "bg-background/50"
                              )}>
                                {typeConfig.icon}
                              </div>
                              <div>
                                <p className="text-xs font-medium">{resource.name}</p>
                                {resource.location && (
                                  <p className="text-[10px] opacity-70">
                                    {resource.location}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {available ? (
                                isSelected ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Badge 
                                    variant="outline" 
                                    className="text-[9px] rounded-md border-green-500/30 text-green-600"
                                  >
                                    Disponible
                                  </Badge>
                                )
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  className="text-[9px] rounded-md border-red-500/30 text-red-600"
                                >
                                  {reason?.includes("Mantenimiento") ? (
                                    <Wrench className="w-2.5 h-2.5 mr-1" />
                                  ) : (
                                    <X className="w-2.5 h-2.5 mr-1" />
                                  )}
                                  No disponible
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!available && reason && (
                            <p className="text-[9px] text-red-500/80 mt-1 ml-8">
                              {reason}
                            </p>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Selecciona una hora para ver disponibilidad</p>
        </div>
      )}

      {/* Selected Resources Summary */}
      {selectedResources.length > 0 && (
        <div className="p-2 rounded-xl bg-lime/10 border border-lime/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              Recursos seleccionados:
            </span>
            <Badge className="bg-lime text-lime-foreground text-[10px]">
              {selectedResources.length}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selectedResources.map(id => {
              const resource = resources.find(r => r.id === id);
              if (!resource) return null;
              return (
                <span 
                  key={id}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-background/50"
                >
                  {resource.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {selectedResources.length > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <p className="text-[10px] text-amber-700">
            Se validará disponibilidad simultánea del médico, consultorio y equipos
          </p>
        </div>
      )}
    </div>
  );
};
