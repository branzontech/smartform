
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
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
        <ChartContainer className="h-[400px]" config={config}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip formatter={(value) => [`${value} casos`, '']} />
            <Legend />
            <Bar 
              dataKey="value" 
              fill="#8B5CF6" 
              name="Casos"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
