
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

interface RecurringPatientsChartProps {
  data: { name: string; visits: number }[];
}

export const RecurringPatientsChart = ({ data }: RecurringPatientsChartProps) => {
  // Configuración personalizada para el gráfico
  const config = {
    visits: { label: 'Visitas', color: '#F59E0B' },
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={150} />
        <Tooltip formatter={(value) => [`${value} visitas`, '']} />
        <Bar 
          dataKey="visits" 
          fill="#F59E0B" 
          name="Visitas"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
