
import React from "react";
import { PatientStatistics } from "@/types/patient-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ConsultationsStatusChartProps {
  stats: PatientStatistics;
  expanded?: boolean;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
const RADIAN = Math.PI / 180;

export const ConsultationsStatusChart = ({ stats, expanded = false }: ConsultationsStatusChartProps) => {
  const data = [
    { name: 'Completadas', value: stats.consultationsCompleted },
    { name: 'Programadas', value: stats.consultationsScheduled },
    { name: 'En curso', value: stats.consultationsInProgress },
    { name: 'Canceladas', value: stats.consultationsCancelled },
  ];

  // Configuración personalizada para el gráfico
  const config = {
    completed: { label: 'Completadas', color: '#10B981' },
    scheduled: { label: 'Programadas', color: '#3B82F6' },
    inProgress: { label: 'En curso', color: '#F59E0B' },
    cancelled: { label: 'Canceladas', color: '#EF4444' },
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (expanded) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="80%"
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} consultas`, data[0].name]} />
          <ChartLegend 
            payload={data.map((item, index) => ({
              value: item.name,
              type: 'circle',
              color: COLORS[index % COLORS.length],
            }))}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Estado de Consultas</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[200px]" config={config}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <ChartLegend>
              <ChartLegendContent 
                payload={data.map((item, index) => ({
                  value: item.name,
                  type: 'circle',
                  color: COLORS[index % COLORS.length],
                }))}
              />
            </ChartLegend>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
