
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, Area, AreaChart, Scatter, ScatterChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartConfig, ReportVariable } from "@/types/report-types";
import { Calendar, FileText } from "lucide-react";

interface ReportPreviewProps {
  title: string;
  description?: string;
  charts: ChartConfig[];
  variables: ReportVariable[];
}

// Datos de ejemplo para la vista previa
const generateMockData = (chart: ChartConfig) => {
  const baseData = [
    { name: "Enero", value: 120, category: "A" },
    { name: "Febrero", value: 190, category: "B" },
    { name: "Marzo", value: 300, category: "A" },
    { name: "Abril", value: 170, category: "C" },
    { name: "Mayo", value: 250, category: "B" },
    { name: "Junio", value: 180, category: "A" },
  ];

  // Personalizar datos según el tipo de gráfico
  if (chart.type === 'pie') {
    return [
      { name: "Masculino", value: 60, fill: "#8884d8" },
      { name: "Femenino", value: 35, fill: "#82ca9d" },
      { name: "Otro", value: 5, fill: "#ffc658" },
    ];
  }

  return baseData;
};

const renderChart = (chart: ChartConfig) => {
  const data = generateMockData(chart);
  const colors = chart.colors || ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  const chartConfig = {
    value: {
      label: "Valor",
      color: colors[0],
    },
  };

  switch (chart.type) {
    case 'bar':
      return (
        <ChartContainer config={chartConfig}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill={colors[0]} />
          </BarChart>
        </ChartContainer>
      );

    case 'line':
      return (
        <ChartContainer config={chartConfig}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      );

    case 'pie':
      return (
        <ChartContainer config={chartConfig}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      );

    case 'area':
      return (
        <ChartContainer config={chartConfig}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
          </AreaChart>
        </ChartContainer>
      );

    case 'scatter':
      return (
        <ChartContainer config={chartConfig}>
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Scatter dataKey="value" fill={colors[0]} />
          </ScatterChart>
        </ChartContainer>
      );

    default:
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Vista previa no disponible para este tipo de gráfico</p>
        </div>
      );
  }
};

export const ReportPreview = ({ title, description, charts, variables }: ReportPreviewProps) => {
  return (
    <div className="space-y-6">
      {/* Encabezado del informe */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">{title || "Informe Sin Título"}</h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-300 mb-3">{description}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Generado: {new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" />
            <span>{charts.length} gráfico{charts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Variables seleccionadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variables Incluidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              <Badge key={variable.id} variant="secondary" className="text-sm">
                {variable.displayName}
                <span className="ml-1 text-xs opacity-75">({variable.dataSource})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="space-y-6">
        {charts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay gráficos configurados para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          charts.map((chart) => (
            <Card key={chart.id}>
              <CardHeader>
                <CardTitle>{chart.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {chart.type}
                  </Badge>
                  {chart.xAxis && (
                    <Badge variant="secondary" className="text-xs">
                      X: {variables.find(v => v.id === chart.xAxis)?.displayName || chart.xAxis}
                    </Badge>
                  )}
                  {chart.yAxis && (
                    <Badge variant="secondary" className="text-xs">
                      Y: {variables.find(v => v.id === chart.yAxis)?.displayName || chart.yAxis}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {chart.xAxis && chart.yAxis ? (
                    renderChart(chart)
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Configura los ejes X e Y para mostrar el gráfico</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Informe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">245</p>
              <p className="text-sm text-gray-500">Total Registros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{variables.length}</p>
              <p className="text-sm text-gray-500">Variables</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{charts.length}</p>
              <p className="text-sm text-gray-500">Gráficos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">30d</p>
              <p className="text-sm text-gray-500">Período</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
