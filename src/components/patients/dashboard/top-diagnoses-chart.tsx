
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface TopDiagnosesChartProps {
  data: { name: string; value: number }[];
}

export const TopDiagnosesChart = ({ data }: TopDiagnosesChartProps) => {
  const isMobile = useIsMobile();
  
  // Configuración personalizada para el gráfico
  const config = {
    value: { label: 'Diagnósticos', color: '#8B5CF6' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Principales Diagnósticos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`h-[${isMobile ? '300px' : '400px'}]`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical"
              margin={{ 
                top: 5, 
                right: 30, 
                left: isMobile ? 100 : 150, 
                bottom: 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={isMobile ? 90 : 150}
                tick={{ fontSize: isMobile ? 12 : 14 }}
              />
              <Tooltip formatter={(value) => [`${value} casos`, '']} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#8B5CF6" 
                name="Casos"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
