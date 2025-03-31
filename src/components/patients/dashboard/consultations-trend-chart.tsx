
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  
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
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data}
              margin={{ 
                top: 5, 
                right: 20, 
                left: isMobile ? 0 : 10, 
                bottom: 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
              <Line 
                type="monotone" 
                dataKey="scheduled" 
                stroke="#3B82F6" 
                activeDot={{ r: isMobile ? 6 : 8 }} 
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
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
