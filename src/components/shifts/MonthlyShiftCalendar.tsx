
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonthlyShiftView, Shift } from "@/types/shift-types";
import { cn } from "@/lib/utils";
import { Clock, User, AlertCircle } from "lucide-react";
import { ShiftDetailModal } from "./ShiftDetailModal";

interface MonthlyShiftCalendarProps {
  monthlyView: MonthlyShiftView;
  onShiftUpdate: () => void;
}

export const MonthlyShiftCalendar = ({ monthlyView, onShiftUpdate }: MonthlyShiftCalendarProps) => {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const getShiftStatusColor = (status: string) => {
    const colors = {
      'Asignado': 'bg-green-100 text-green-800 border-green-200',
      'Disponible': 'bg-blue-100 text-blue-800 border-blue-200',
      'Incapacidad': 'bg-red-100 text-red-800 border-red-200',
      'Vacaciones': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Reasignado': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vista Mensual de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Headers de días */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50 rounded">
                {day}
              </div>
            ))}
          </div>

          {/* Semanas */}
          <div className="space-y-1">
            {monthlyView.weeks.map((week) => (
              <div key={week.weekNumber} className="grid grid-cols-7 gap-1">
                {week.days.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className={cn(
                      "min-h-[120px] p-2 border rounded-lg",
                      day.isCurrentMonth 
                        ? "bg-white border-gray-200" 
                        : "bg-gray-50 border-gray-100",
                      day.date.toDateString() === new Date().toDateString() 
                        ? "ring-2 ring-form-primary" 
                        : ""
                    )}
                  >
                    {/* Número del día */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "text-sm font-medium",
                        day.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                      )}>
                        {day.date.getDate()}
                      </span>
                      {day.shifts.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {day.shifts.length}
                        </Badge>
                      )}
                    </div>

                    {/* Turnos del día */}
                    <div className="space-y-1">
                      {day.shifts.slice(0, 3).map((shift) => (
                        <div
                          key={shift.id}
                          onClick={() => handleShiftClick(shift)}
                          className={cn(
                            "p-1 rounded text-xs cursor-pointer border transition-all hover:shadow-sm",
                            getShiftStatusColor(shift.status)
                          )}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium truncate">
                              {shift.professionalName.split(' ')[0]}
                            </span>
                          </div>
                          
                          {shift.timeSlots.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {shift.timeSlots[0].startTime} - {shift.timeSlots[shift.timeSlots.length - 1].endTime}
                              </span>
                            </div>
                          )}
                          
                          {shift.status === 'Reasignado' && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3" />
                              <span className="text-xs">Reasignado</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Mostrar indicador si hay más turnos */}
                      {day.shifts.length > 3 && (
                        <div className="text-xs text-gray-500 text-center p-1">
                          +{day.shifts.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Leyenda de Estados</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-sm">Asignado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-sm">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
                <span className="text-sm">Reasignado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-sm">Incapacidad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span className="text-sm">Vacaciones</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles del turno */}
      {selectedShift && (
        <ShiftDetailModal
          shift={selectedShift}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedShift(null);
          }}
          onUpdate={() => {
            onShiftUpdate();
            setIsModalOpen(false);
            setSelectedShift(null);
          }}
        />
      )}
    </>
  );
};
