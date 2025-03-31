
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PatientsByGenderChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#3B82F6', '#EC4899', '#8B5CF6'];
const RADIAN = Math.PI / 180;

export const PatientsByGenderChart = ({ data }: PatientsByGenderChartProps) => {
  const isMobile = useIsMobile();
  
  // Configuración personalizada para el gráfico
  const config = {
    masculino: { label: 'Masculino', color: '#3B82F6' },
    femenino: { label: 'Femenino', color: '#EC4899' },
    otro: { label: 'Otro', color: '#8B5CF6' },
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;
    
    // En dispositivos móviles, mostrar etiquetas más pequeñas o solo el porcentaje
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={isMobile ? 10 : 12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Pacientes por Género</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] md:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={isMobile ? 60 : 80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} pacientes`, '']} />
              <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
