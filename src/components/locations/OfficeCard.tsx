
import React from 'react';
import { Office } from '@/types/location-types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, SquareFeet, Edit, Trash, Clipboard } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OfficeCardProps {
  office: Office;
  onEdit?: (office: Office) => void;
  onDelete?: (officeId: string) => void;
}

export const OfficeCard = ({ office, onEdit, onDelete }: OfficeCardProps) => {
  const getStatusVariant = (status: Office['status']) => {
    switch (status) {
      case 'Disponible': return 'success';
      case 'Ocupado': return 'destructive';
      case 'Mantenimiento': return 'warning';
      case 'Reservado': return 'default';
      default: return 'secondary';
    }
  };

  const occupancyPercentage = (office.currentPatients / office.maxPatients) * 100;

  return (
    <Card className="transition-all duration-200 hover:shadow-lg border border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{office.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Clipboard size={14} className="mr-1 text-gray-500" />
              Consultorio #{office.number} - Piso {office.floor}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(office.status) as any}>
            {office.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="text-sm space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <SquareFeet size={14} className="mr-2 flex-shrink-0" />
            <span>Área: {office.area} m²</span>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Building2 size={14} className="mr-2 flex-shrink-0" />
            <span>Capacidad: {office.capacity}</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Ocupación actual</span>
            <span className="text-sm font-medium">{office.currentPatients}/{office.maxPatients}</span>
          </div>
          <Progress value={occupancyPercentage} className="h-2" />
        </div>
        
        {office.specialties && office.specialties.length > 0 && (
          <div>
            <span className="block text-gray-700 dark:text-gray-300 mb-1">Especialidades:</span>
            <div className="flex flex-wrap gap-1">
              {office.specialties.map((specialty, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {office.assignedDoctor && (
          <div className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Doctor asignado:</span> {office.assignedDoctor}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Users size={16} className="mr-2" />
          <span>{office.currentPatients} pacientes actuales</span>
        </div>
        
        <div className="flex space-x-2">
          {onEdit && (
            <Button variant="outline" size="icon" onClick={() => onEdit(office)}>
              <Edit size={16} />
            </Button>
          )}
          
          {onDelete && (
            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => onDelete(office.id)}>
              <Trash size={16} />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
