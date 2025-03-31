
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

interface RecurringPatientsChartProps {
  data: { name: string; visits: number }[];
}

export const RecurringPatientsChart = ({ data }: RecurringPatientsChartProps) => {
  const isMobile = useIsMobile();
  
  // Configuración personalizada para el gráfico
  const config = {
    visits: { label: 'Visitas', color: '#F59E0B' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Pacientes Recurrentes</CardTitle>
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
              <Tooltip formatter={(value) => [`${value} visitas`, '']} />
              <Bar 
                dataKey="visits" 
                fill="#F59E0B" 
                name="Visitas"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
