
import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  Save,
  Eye,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  AreaChart,
  Scatter
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ReportVariable, ChartType, ChartConfig } from "@/types/report-types";
import { ReportPreview } from "@/components/reports/ReportPreview";
import { ChartBuilder } from "@/components/reports/ChartBuilder";

// Variables disponibles para los informes
const availableVariables: ReportVariable[] = [
  {
    id: "patients_total",
    name: "patients_total",
    displayName: "Total de Pacientes",
    dataSource: "patients",
    type: "numeric",
    description: "Número total de pacientes registrados"
  },
  {
    id: "patients_by_gender",
    name: "patients_by_gender",
    displayName: "Pacientes por Género",
    dataSource: "patients",
    type: "categorical",
    description: "Distribución de pacientes por género"
  },
  {
    id: "new_patients_monthly",
    name: "new_patients_monthly",
    displayName: "Nuevos Pacientes por Mes",
    dataSource: "patients",
    type: "numeric",
    description: "Cantidad de nuevos pacientes por mes"
  },
  {
    id: "appointments_status",
    name: "appointments_status",
    displayName: "Estado de Citas",
    dataSource: "appointments",
    type: "categorical",
    description: "Distribución de citas por estado"
  },
  {
    id: "appointments_monthly",
    name: "appointments_monthly",
    displayName: "Citas por Mes",
    dataSource: "appointments",
    type: "numeric",
    description: "Número de citas programadas por mes"
  },
  {
    id: "revenue_monthly",
    name: "revenue_monthly",
    displayName: "Ingresos Mensuales",
    dataSource: "billing",
    type: "numeric",
    description: "Ingresos generados por mes"
  },
  {
    id: "top_diagnoses",
    name: "top_diagnoses",
    displayName: "Diagnósticos Principales",
    dataSource: "consultations",
    type: "categorical",
    description: "Diagnósticos más frecuentes"
  }
];

const chartTypeIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  area: AreaChart,
  scatter: Scatter
};

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleVariableToggle = (variableId: string) => {
    setSelectedVariables(prev =>
      prev.includes(variableId)
        ? prev.filter(id => id !== variableId)
        : [...prev, variableId]
    );
  };

  const handleAddChart = () => {
    const newChart: ChartConfig = {
      id: `chart_${Date.now()}`,
      type: 'bar',
      title: `Gráfico ${charts.length + 1}`,
      xAxis: selectedVariables[0] || '',
      yAxis: selectedVariables[1] || selectedVariables[0] || '',
      data: [],
      colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']
    };
    setCharts([...charts, newChart]);
  };

  const handleUpdateChart = (chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(prev =>
      prev.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    );
  };

  const handleDeleteChart = (chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const handleSaveReport = () => {
    // Aquí implementarías la lógica para guardar el informe
    console.log("Guardando informe:", {
      title: reportTitle,
      description: reportDescription,
      variables: selectedVariables,
      charts
    });
    navigate("/app/informes");
  };

  const canProceedToStep2 = reportTitle.trim() !== "" && selectedVariables.length > 0;
  const canProceedToStep3 = charts.length > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/app/informes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Crear Informe</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Configura tu informe personalizado paso a paso
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Tabs value={`step${currentStep}`} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="step1">1. Configuración</TabsTrigger>
                <TabsTrigger value="step2" disabled={!canProceedToStep2}>2. Gráficos</TabsTrigger>
                <TabsTrigger value="step3" disabled={!canProceedToStep3}>3. Vista Previa</TabsTrigger>
              </TabsList>

              <TabsContent value="step1" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Informe</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título del Informe</Label>
                      <Input
                        id="title"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="Ej: Análisis Mensual de Pacientes"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción (Opcional)</Label>
                      <Textarea
                        id="description"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Describe el propósito de este informe..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seleccionar Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableVariables.map((variable) => (
                        <div
                          key={variable.id}
                          className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => handleVariableToggle(variable.id)}
                        >
                          <Checkbox
                            checked={selectedVariables.includes(variable.id)}
                            onChange={() => handleVariableToggle(variable.id)}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{variable.displayName}</h4>
                            <p className="text-sm text-gray-500">{variable.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {variable.dataSource}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {variable.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedVariables.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium">Variables Seleccionadas:</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedVariables.map((varId) => {
                            const variable = availableVariables.find(v => v.id === varId);
                            return (
                              <Badge key={varId} className="text-xs">
                                {variable?.displayName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                  >
                    Siguiente: Configurar Gráficos
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="step2" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Configuración de Gráficos</CardTitle>
                    <Button onClick={handleAddChart}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Gráfico
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {charts.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          No hay gráficos configurados. Agrega tu primer gráfico.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {charts.map((chart) => (
                          <ChartBuilder
                            key={chart.id}
                            chart={chart}
                            availableVariables={availableVariables.filter(v => 
                              selectedVariables.includes(v.id)
                            )}
                            onUpdate={(updates) => handleUpdateChart(chart.id, updates)}
                            onDelete={() => handleDeleteChart(chart.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Anterior
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3}
                  >
                    Siguiente: Vista Previa
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="step3" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Previa del Informe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReportPreview
                      title={reportTitle}
                      description={reportDescription}
                      charts={charts}
                      variables={availableVariables.filter(v => selectedVariables.includes(v.id))}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Anterior
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Excel
                    </Button>
                    <Button onClick={handleSaveReport}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Informe
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateReportPage;
