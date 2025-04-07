import React, { useState } from 'react';
import { Office } from '@/types/location-types';
import { updateOfficeStatus } from '@/utils/location-utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, MinusCircle, Users, Clipboard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OfficeCardProps {
  office: Office;
  onClick: (office: Office) => void;
}

const getStatusColor = (status: Office['status']) => {
  switch (status) {
    case 'Disponible': return 'bg-green-500';
    case 'Ocupado': return 'bg-red-500';
    case 'Mantenimiento': return 'bg-amber-500';
    case 'Reservado': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const getStatusVariant = (status: Office['status']) => {
  switch (status) {
    case 'Disponible': return 'success';
    case 'Ocupado': return 'destructive';
    case 'Mantenimiento': return 'warning';
    case 'Reservado': return 'default';
    default: return 'secondary';
  }
};

const OfficeCard = ({ office, onClick }: OfficeCardProps) => {
  const occupancyPercentage = (office.currentPatients / office.maxPatients) * 100;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 shadow-md rounded-lg`}
            style={{ 
              left: `${office.location?.x || 0}%`, 
              top: `${office.location?.y || 0}%`,
              width: '120px',
              height: '100px'
            }}
            onClick={() => onClick(office)}
          >
            <Card className="w-full h-full overflow-hidden border-2" style={{ borderColor: getStatusColor(office.status) }}>
              <CardContent className="p-2 h-full flex flex-col justify-between">
                <div>
                  <p className="font-bold text-xs truncate">{office.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">#{office.number}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="flex items-center"><Users size={12} className="mr-1" /> {office.currentPatients}/{office.maxPatients}</span>
                    <Badge variant={getStatusVariant(office.status) as any} className="text-[10px] h-4 px-1">
                      {office.status}
                    </Badge>
                  </div>
                  <Progress value={occupancyPercentage} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="text-sm">
            <p className="font-bold">{office.name} (#{office.number})</p>
            <p>Piso: {office.floor}</p>
            <p>Capacidad: {office.capacity} personas</p>
            <p>Estado: {office.status}</p>
            <p>Pacientes: {office.currentPatients}/{office.maxPatients}</p>
            {office.assignedDoctor && <p>Doctor: {office.assignedDoctor}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface OfficeFloorPlanProps {
  offices: Office[];
  onOfficeUpdate?: () => void;
}

export const OfficeFloorPlan = ({ offices, onOfficeUpdate }: OfficeFloorPlanProps) => {
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  
  const floorOffices = offices.filter(office => office.floor === selectedFloor);
  
  const floors = [...new Set(offices.map(office => office.floor))].sort((a, b) => a - b);
  
  const handleOfficeClick = (office: Office) => {
    setSelectedOffice(office);
  };
  
  const handleStatusChange = (status: Office['status']) => {
    if (selectedOffice) {
      updateOfficeStatus(selectedOffice.id, status);
      setSelectedOffice({...selectedOffice, status});
      toast({
        title: "Estado actualizado",
        description: `El consultorio ahora está: ${status}`,
      });
      if (onOfficeUpdate) onOfficeUpdate();
    }
  };
  
  const handlePatientChange = (increment: boolean) => {
    if (selectedOffice) {
      const newCount = increment 
        ? Math.min(selectedOffice.currentPatients + 1, selectedOffice.maxPatients)
        : Math.max(selectedOffice.currentPatients - 1, 0);
      
      updateOfficeStatus(selectedOffice.id, selectedOffice.status, newCount);
      setSelectedOffice({...selectedOffice, currentPatients: newCount});
      
      if (onOfficeUpdate) onOfficeUpdate();
    }
  };
  
  const closeDialog = () => {
    setSelectedOffice(null);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-4">
        {floors.map(floor => (
          <Button
            key={floor}
            variant={selectedFloor === floor ? "default" : "outline"}
            onClick={() => setSelectedFloor(floor)}
            className="text-sm"
          >
            Piso {floor}
          </Button>
        ))}
      </div>
      
      <div className="relative w-full h-[70vh] overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-10">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border border-gray-400 dark:border-gray-700"></div>
          ))}
        </div>
        
        {floorOffices.map(office => (
          <OfficeCard 
            key={office.id} 
            office={office} 
            onClick={handleOfficeClick} 
          />
        ))}
        
        <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 flex flex-col gap-1 text-xs">
          <div className="text-xs font-semibold mb-1">Estados:</div>
          <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-green-500 inline-block mr-1"></span> Disponible</div>
          <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-red-500 inline-block mr-1"></span> Ocupado</div>
          <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-amber-500 inline-block mr-1"></span> Mantenimiento</div>
          <div className="flex items-center"><span className="h-3 w-3 rounded-full bg-blue-500 inline-block mr-1"></span> Reservado</div>
        </div>
      </div>
      
      <Dialog open={!!selectedOffice} onOpenChange={() => closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Consultorio {selectedOffice?.number}</DialogTitle>
            <DialogDescription>
              {selectedOffice?.name} - Piso {selectedOffice?.floor}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Estado actual:</h4>
                  <Badge variant={getStatusVariant(selectedOffice.status) as any} className="text-xs">
                    {selectedOffice.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Ocupación:</h4>
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => handlePatientChange(false)}
                      disabled={selectedOffice.currentPatients <= 0}
                    >
                      <MinusCircle size={14} />
                    </Button>
                    <span className="mx-2">{selectedOffice.currentPatients} / {selectedOffice.maxPatients}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => handlePatientChange(true)}
                      disabled={selectedOffice.currentPatients >= selectedOffice.maxPatients}
                    >
                      <PlusCircle size={14} />
                    </Button>
                  </div>
                  <Progress 
                    value={(selectedOffice.currentPatients / selectedOffice.maxPatients) * 100} 
                    className="h-2 mt-2" 
                  />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Cambiar estado:</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={() => handleStatusChange('Disponible')}
                  >
                    Disponible
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleStatusChange('Ocupado')}
                  >
                    Ocupado
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950"
                    onClick={() => handleStatusChange('Mantenimiento')}
                  >
                    Mantenimiento
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => handleStatusChange('Reservado')}
                  >
                    Reservado
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Detalles:</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Área:</span> {selectedOffice.area} m²
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Capacidad:</span> {selectedOffice.capacity} personas
                  </div>
                  {selectedOffice.assignedDoctor && (
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Doctor asignado:</span> {selectedOffice.assignedDoctor}
                    </div>
                  )}
                  {selectedOffice.specialties && selectedOffice.specialties.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Especialidades:</span> {selectedOffice.specialties.join(', ')}
                    </div>
                  )}
                  {selectedOffice.equipment && selectedOffice.equipment.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Equipamiento:</span> {selectedOffice.equipment.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
