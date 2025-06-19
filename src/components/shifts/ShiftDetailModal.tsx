
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shift } from "@/types/shift-types";
import { Clock, User, Calendar, AlertCircle, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShiftDetailModalProps {
  shift: Shift;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const ShiftDetailModal = ({ shift, isOpen, onClose, onUpdate }: ShiftDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getShiftStatusColor = (status: string) => {
    const colors = {
      'Asignado': 'bg-green-100 text-green-800',
      'Disponible': 'bg-blue-100 text-blue-800',
      'Incapacidad': 'bg-red-100 text-red-800',
      'Vacaciones': 'bg-yellow-100 text-yellow-800',
      'Reasignado': 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleReassign = () => {
    // Redirigir a la página de modificación de turnos con el ID del turno
    window.location.href = `/app/turnos/modificar?shiftId=${shift.id}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalDuration = () => {
    return shift.timeSlots.reduce((total, slot) => total + slot.duration, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Detalles del Turno</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado del turno */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Estado</h3>
            <Badge className={getShiftStatusColor(shift.status)}>
              {shift.status}
            </Badge>
          </div>

          {/* Información del profesional */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Profesional
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{shift.professionalName}</p>
              <p className="text-sm text-gray-600">ID: {shift.professionalId}</p>
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="capitalize">{formatDate(shift.date)}</p>
            </div>
          </div>

          {/* Horarios */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horarios ({shift.timeSlots.length} turnos)
            </h3>
            <div className="space-y-2">
              {shift.timeSlots.map((slot, index) => (
                <div key={slot.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Turno {index + 1}</span>
                    <Badge variant="outline">{slot.duration} min</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Duración total: {getTotalDuration()} minutos
            </div>
          </div>

          {/* Información de reasignación */}
          {shift.status === 'Reasignado' && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Información de Reasignación
              </h3>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                {shift.reassignedFrom && (
                  <p className="text-sm">
                    <span className="font-medium">Reasignado desde:</span> {shift.reassignedFrom}
                  </p>
                )}
                {shift.reassignedTo && (
                  <p className="text-sm">
                    <span className="font-medium">Reasignado a:</span> {shift.reassignedTo}
                  </p>
                )}
                {shift.isPartialReassignment && (
                  <p className="text-sm text-orange-700 font-medium">
                    Reasignación parcial
                  </p>
                )}
                {shift.originalShiftId && (
                  <p className="text-sm">
                    <span className="font-medium">Turno original:</span> {shift.originalShiftId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          {shift.notes && (
            <div className="space-y-3">
              <h3 className="font-medium">Notas</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">{shift.notes}</p>
              </div>
            </div>
          )}

          {/* Fechas de auditoría */}
          <div className="space-y-3">
            <h3 className="font-medium">Información de Auditoría</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Creado:</span> {' '}
                {new Date(shift.createdAt).toLocaleString('es-ES')}
              </p>
              {shift.updatedAt && (
                <p>
                  <span className="font-medium">Modificado:</span> {' '}
                  {new Date(shift.updatedAt).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleReassign} className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Modificar Turno
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
