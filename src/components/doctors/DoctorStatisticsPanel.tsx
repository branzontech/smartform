
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, BarChartHorizontal, CalendarClock, Users } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DoctorStatistics } from "@/types/patient-types";
import { getDoctorStatistics } from "@/utils/doctor-utils";

interface DoctorStatisticsPanelProps {
  doctorId: string;
}

const DoctorStatisticsPanel = ({ doctorId }: DoctorStatisticsPanelProps) => {
  const [statistics, setStatistics] = useState<DoctorStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const data = await getDoctorStatistics(doctorId);
        setStatistics(data);
      } catch (error) {
        console.error("Error fetching doctor statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, [doctorId]);
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
        <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    );
  }
  
  if (!statistics) {
    return (
      <div className="text-center py-12">
        <BarChart size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay estadísticas disponibles</h3>
        <p className="text-gray-500">No se pudieron cargar las estadísticas para este profesional.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPatients}</div>
            <p className="text-xs text-gray-500">
              {statistics.activePatients} activos actualmente
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Completadas</CardTitle>
            <CalendarClock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.appointmentsCompleted}</div>
            <p className="text-xs text-gray-500">
              {statistics.appointmentsScheduled} programadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sat. de Pacientes</CardTitle>
            <BarChartHorizontal className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.satisfactionRate !== undefined 
                ? `${statistics.satisfactionRate}%` 
                : 'N/A'}
            </div>
            <p className="text-xs text-gray-500">
              Basado en evaluaciones de pacientes
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Consultas por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={statistics.consultationsByMonth}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorStatisticsPanel;
