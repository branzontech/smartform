
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  BarChart3, 
  LineChart, 
  PieChart, 
  AreaChart, 
  ChartScatter 
} from "lucide-react";
import { ChartConfig, ChartType, ReportVariable } from "@/types/report-types";

interface ChartBuilderProps {
  chart: ChartConfig;
  availableVariables: ReportVariable[];
  onUpdate: (updates: Partial<ChartConfig>) => void;
  onDelete: () => void;
}

const chartTypeOptions = [
  { value: 'bar', label: 'Barras', icon: BarChart3 },
  { value: 'line', label: 'Líneas', icon: LineChart },
  { value: 'pie', label: 'Circular', icon: PieChart },
  { value: 'area', label: 'Área', icon: AreaChart },
  { value: 'scatter', label: 'Dispersión', icon: ChartScatter },
];

export const ChartBuilder = ({ chart, availableVariables, onUpdate, onDelete }: ChartBuilderProps) => {
  const handleTypeChange = (type: ChartType) => {
    onUpdate({ type });
  };

  const handleTitleChange = (title: string) => {
    onUpdate({ title });
  };

  const handleAxisChange = (axis: 'xAxis' | 'yAxis', value: string) => {
    onUpdate({ [axis]: value });
  };

  const getVariableDisplayName = (variableId: string) => {
    const variable = availableVariables.find(v => v.id === variableId);
    return variable?.displayName || variableId;
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <Input
            value={chart.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título del gráfico"
            className="text-lg font-semibold border-none px-0 focus:ring-0"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Tipo de Gráfico</Label>
            <Select value={chart.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Eje X</Label>
            <Select value={chart.xAxis} onValueChange={(value) => handleAxisChange('xAxis', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar variable" />
              </SelectTrigger>
              <SelectContent>
                {availableVariables.map((variable) => (
                  <SelectItem key={variable.id} value={variable.id}>
                    {variable.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Eje Y</Label>
            <Select value={chart.yAxis} onValueChange={(value) => handleAxisChange('yAxis', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar variable" />
              </SelectTrigger>
              <SelectContent>
                {availableVariables.map((variable) => (
                  <SelectItem key={variable.id} value={variable.id}>
                    {variable.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Configuración:</span>
          <Badge variant="outline">{chartTypeOptions.find(o => o.value === chart.type)?.label}</Badge>
          {chart.xAxis && (
            <Badge variant="secondary">X: {getVariableDisplayName(chart.xAxis)}</Badge>
          )}
          {chart.yAxis && (
            <Badge variant="secondary">Y: {getVariableDisplayName(chart.yAxis)}</Badge>
          )}
        </div>

        {(!chart.xAxis || !chart.yAxis) && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Selecciona las variables para los ejes X e Y para completar la configuración del gráfico.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
