
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShiftStatistics } from "@/types/shift-types";
import { BarChart3, Users, Calendar, TrendingUp } from "lucide-react";

interface ShiftStatsPanelProps {
  statistics: ShiftStatistics;
}

export const ShiftStatsPanel = ({ statistics }: ShiftStatsPanelProps) => {
  const utilizationAverage = statistics.professionalUtilization.length > 0
    ? Math.round(
        statistics.professionalUtilization.reduce((acc, prof) => acc + prof.utilizationPercentage, 0) / 
        statistics.professionalUtilization.length
      )
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total de turnos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Turnos</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalShifts}</div>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-green-100 text-green-800 text-xs">
              {statistics.assignedShifts} asignados
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {statistics.availableShifts} disponibles
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Turnos reasignados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reasignaciones</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{statistics.reassignedShifts}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {statistics.totalShifts > 0 
              ? `${Math.round((statistics.reassignedShifts / statistics.totalShifts) * 100)}% del total`
              : "0% del total"
            }
          </p>
        </CardContent>
      </Card>

      {/* Profesionales activos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.professionalUtilization.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Utilización promedio: {utilizationAverage}%
          </p>
        </CardContent>
      </Card>

      {/* Turnos no disponibles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">No Disponibles</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{statistics.unavailableShifts}</div>
          <div className="flex gap-1 mt-2">
            <Badge className="bg-red-100 text-red-800 text-xs">Incapacidades</Badge>
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Vacaciones</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Utilización por profesional */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg">Utilización por Profesional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.professionalUtilization.map((prof) => (
              <div key={prof.professionalId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{prof.professionalName}</p>
                    <p className="text-sm text-gray-600">
                      {prof.assignedShifts} de {prof.totalShifts} turnos asignados
                    </p>
                  </div>
                  <Badge 
                    variant={prof.utilizationPercentage >= 80 ? "default" : 
                             prof.utilizationPercentage >= 50 ? "secondary" : "outline"}
                  >
                    {prof.utilizationPercentage}%
                  </Badge>
                </div>
                <Progress 
                  value={prof.utilizationPercentage} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
