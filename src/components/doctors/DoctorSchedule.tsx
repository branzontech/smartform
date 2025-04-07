
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, AlarmClock } from "lucide-react";
import { Doctor, DaySchedule } from "@/types/patient-types";

interface DoctorScheduleProps {
  doctor: Doctor;
}

const DoctorSchedule = ({ doctor }: DoctorScheduleProps) => {
  const weekDays = [
    { key: 'monday', name: 'Lunes' },
    { key: 'tuesday', name: 'Martes' },
    { key: 'wednesday', name: 'Miércoles' },
    { key: 'thursday', name: 'Jueves' },
    { key: 'friday', name: 'Viernes' },
    { key: 'saturday', name: 'Sábado' },
    { key: 'sunday', name: 'Domingo' }
  ];
  
  const renderScheduleTime = (day?: DaySchedule) => {
    if (!day || !day.isWorking) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">No disponible</Badge>;
    }
    
    return (
      <div className="flex items-center">
        <Clock size={14} className="mr-1 text-gray-500" />
        <span>{day.startTime} - {day.endTime}</span>
      </div>
    );
  };
  
  const renderBreaks = (day?: DaySchedule) => {
    if (!day || !day.isWorking || !day.breaks || day.breaks.length === 0) {
      return '-';
    }
    
    return (
      <div className="space-y-1">
        {day.breaks.map((breakTime, index) => (
          <div key={index} className="flex items-center text-sm">
            <AlarmClock size={12} className="mr-1 text-gray-500" />
            <span>{breakTime.startTime} - {breakTime.endTime}</span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 text-purple-500" size={20} />
          Horario semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!doctor.schedule ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay horario definido para este profesional.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Descansos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekDays.map((day) => (
                <TableRow key={day.key}>
                  <TableCell className="font-medium">{day.name}</TableCell>
                  <TableCell>
                    {renderScheduleTime(doctor.schedule?.[day.key as keyof typeof doctor.schedule])}
                  </TableCell>
                  <TableCell>
                    {renderBreaks(doctor.schedule?.[day.key as keyof typeof doctor.schedule])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorSchedule;
