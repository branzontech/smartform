
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Plus, Edit, BarChart3, Users } from "lucide-react";
import { MonthlyShiftView, ShiftStatistics } from "@/types/shift-types";
import { createMonthlyShiftView, getShiftStatistics } from "@/utils/shift-utils";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/App";
import { MonthlyShiftCalendar } from "@/components/shifts/MonthlyShiftCalendar";
import { ShiftStatsPanel } from "@/components/shifts/ShiftStatsPanel";

export default function ShiftManagement() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyView, setMonthlyView] = useState<MonthlyShiftView | null>(null);
  const [statistics, setStatistics] = useState<ShiftStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadShiftData = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      
      const [viewData, statsData] = await Promise.all([
        createMonthlyShiftView(month, year),
        getShiftStatistics(month, year)
      ]);
      
      setMonthlyView(viewData);
      setStatistics(statsData);
    } catch (error) {
      console.error("Error loading shift data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de turnos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShiftData();
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-form-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando turnos...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <BackButton />
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <CalendarRange className="h-8 w-8 text-form-primary" />
                Gestión de Turnos
              </h1>
              <p className="text-gray-600 mt-2">
                Administra los turnos de los profesionales de manera eficiente
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={() => window.location.href = '/app/turnos/asignar'}>
                <Plus className="h-4 w-4 mr-2" />
                Asignar Turnos
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/app/turnos/modificar'}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modificar Turnos
              </Button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {statistics && (
          <ShiftStatsPanel statistics={statistics} />
        )}

        {/* Navegación del mes */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl capitalize">
                {monthName}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  ← Mes Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Hoy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  Mes Siguiente →
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Vista mensual del calendario */}
        {monthlyView && (
          <MonthlyShiftCalendar 
            monthlyView={monthlyView}
            onShiftUpdate={loadShiftData}
          />
        )}

        {/* Información adicional */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profesionales Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyView?.professionals.map((professional) => (
                  <div key={professional.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{professional.name}</p>
                      <p className="text-sm text-gray-600">{professional.specialty}</p>
                    </div>
                    <Badge variant={professional.isActive ? "default" : "secondary"}>
                      {professional.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumen del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total de turnos:</span>
                  <Badge variant="outline">{statistics?.totalShifts || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Turnos asignados:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {statistics?.assignedShifts || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Turnos reasignados:</span>
                  <Badge className="bg-orange-100 text-orange-800">
                    {statistics?.reassignedShifts || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Disponibles:</span>
                  <Badge variant="secondary">{statistics?.availableShifts || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
