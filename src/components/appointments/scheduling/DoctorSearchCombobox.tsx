import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Stethoscope, Clock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  avatar: string;
  occupiedSlots?: Record<string, string[]>;
}

interface DoctorSearchComboboxProps {
  doctors: DoctorOption[];
  selectedDoctorId: string;
  onSelect: (doctorId: string) => void;
  isLocked?: boolean;
  onUnlock?: () => void;
}

export const DoctorSearchCombobox: React.FC<DoctorSearchComboboxProps> = ({
  doctors,
  selectedDoctorId,
  onSelect,
  isLocked = false,
  onUnlock,
}) => {
  const [open, setOpen] = useState(false);

  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  const availableDoctors = useMemo(() => {
    return doctors.filter((d) => d.available);
  }, [doctors]);

  if (isLocked && selectedDoctor) {
    return (
      <div className="p-3 rounded-xl bg-lime/10 border border-lime/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lime/20 flex items-center justify-center text-sm font-bold text-lime">
          {selectedDoctor.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{selectedDoctor.name}</p>
          <p className="text-xs text-muted-foreground truncate">{selectedDoctor.specialty}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
          onClick={onUnlock}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-auto min-h-[52px] justify-between rounded-xl px-3 py-2 text-left font-normal",
            !selectedDoctorId && "text-muted-foreground"
          )}
        >
          {selectedDoctor ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {selectedDoctor.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{selectedDoctor.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{selectedDoctor.specialty}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm">Buscar profesional...</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" 
        align="start"
        sideOffset={4}
      >
        <Command className="rounded-xl">
          <CommandInput placeholder="Buscar por nombre o especialidad..." className="h-10" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>
              <div className="py-6 text-center">
                <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">No se encontraron profesionales</p>
              </div>
            </CommandEmpty>
            <CommandGroup heading="Disponibles">
              {availableDoctors.map((doctor) => {
                const todayKey = new Date().toISOString().split("T")[0];
                const todayAppointments = doctor.occupiedSlots[todayKey]?.length || 0;

                return (
                  <CommandItem
                    key={doctor.id}
                    value={`${doctor.name} ${doctor.specialty}`}
                    onSelect={() => {
                      onSelect(doctor.id);
                      setOpen(false);
                    }}
                    className="py-2.5 px-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 relative">
                        {doctor.avatar}
                        {todayAppointments > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                            {todayAppointments}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doctor.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-muted-foreground truncate">{doctor.specialty}</p>
                          {todayAppointments > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {todayAppointments} hoy
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[9px] border-lime/50 text-lime">
                          Disponible
                        </Badge>
                        {selectedDoctorId === doctor.id && (
                          <Check className="w-4 h-4 text-lime" />
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {doctors.filter((d) => !d.available).length > 0 && (
              <CommandGroup heading="No disponibles">
                {doctors
                  .filter((d) => !d.available)
                  .map((doctor) => (
                    <CommandItem
                      key={doctor.id}
                      value={`${doctor.name} ${doctor.specialty}`}
                      disabled
                      className="py-2.5 px-2 opacity-50"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {doctor.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doctor.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{doctor.specialty}</p>
                        </div>
                        <Badge variant="secondary" className="text-[9px] shrink-0">
                          No disponible
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
