
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartConfig, ReportVariable } from "@/types/report-types";

interface DataTableProps {
  chart: ChartConfig;
  variables: ReportVariable[];
}

// Generar datos de ejemplo para la tabla
const generateTableData = (chart: ChartConfig) => {
  const baseData = [
    { periodo: "Enero 2024", valor: 120, categoria: "Tipo A", porcentaje: "15%" },
    { periodo: "Febrero 2024", valor: 190, categoria: "Tipo B", porcentaje: "23%" },
    { periodo: "Marzo 2024", valor: 300, categoria: "Tipo A", porcentaje: "37%" },
    { periodo: "Abril 2024", valor: 170, categoria: "Tipo C", porcentaje: "21%" },
    { periodo: "Mayo 2024", valor: 250, categoria: "Tipo B", porcentaje: "31%" },
    { periodo: "Junio 2024", valor: 180, categoria: "Tipo A", porcentaje: "22%" },
  ];

  // Personalizar datos según el tipo de gráfico
  if (chart.type === 'pie') {
    return [
      { categoria: "Masculino", cantidad: 156, porcentaje: "60%", total: 260 },
      { categoria: "Femenino", cantidad: 91, porcentaje: "35%", total: 260 },
      { categoria: "Otro", cantidad: 13, porcentaje: "5%", total: 260 },
    ];
  }

  return baseData;
};

export const DataTable = ({ chart, variables }: DataTableProps) => {
  const data = generateTableData(chart);
  
  const getVariableDisplayName = (variableId: string) => {
    const variable = variables.find(v => v.id === variableId);
    return variable?.displayName || variableId;
  };

  // Determinar las columnas basadas en el tipo de gráfico
  const getTableColumns = () => {
    if (chart.type === 'pie') {
      return ['categoria', 'cantidad', 'porcentaje', 'total'];
    }
    return ['periodo', 'valor', 'categoria', 'porcentaje'];
  };

  const columns = getTableColumns();

  const getColumnHeader = (column: string) => {
    const headers: Record<string, string> = {
      periodo: 'Período',
      valor: 'Valor',
      categoria: 'Categoría',
      porcentaje: 'Porcentaje',
      cantidad: 'Cantidad',
      total: 'Total'
    };
    return headers[column] || column;
  };

  const formatCellValue = (value: any, column: string) => {
    if (column === 'valor' || column === 'cantidad' || column === 'total') {
      return typeof value === 'number' ? value.toLocaleString() : value;
    }
    return value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Datos: {chart.title}
          <Badge variant="outline" className="text-xs">
            {data.length} registros
          </Badge>
        </CardTitle>
        <div className="flex items-center space-x-2">
          {chart.xAxis && (
            <Badge variant="secondary" className="text-xs">
              X: {getVariableDisplayName(chart.xAxis)}
            </Badge>
          )}
          {chart.yAxis && (
            <Badge variant="secondary" className="text-xs">
              Y: {getVariableDisplayName(chart.yAxis)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>
                    {getColumnHeader(column)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {formatCellValue(row[column as keyof typeof row], column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
