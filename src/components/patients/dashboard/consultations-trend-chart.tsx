
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface ConsultationsTrendChartProps {
  data: { name: string; scheduled: number; completed: number }[];
}

export const ConsultationsTrendChart = ({ data }: ConsultationsTrendChartProps) => {
  // Configuración personalizada para el gráfico
  const config = {
    scheduled: { label: 'Programadas', color: '#3B82F6' },
    completed: { label: 'Completadas', color: '#10B981' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Tendencia de Consultas</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px]" config={config}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="scheduled" 
              stroke="#3B82F6" 
              activeDot={{ r: 8 }} 
              name="Programadas"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#10B981" 
              name="Completadas"
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
