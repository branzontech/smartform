
import React, { useState } from "react";
import { EspecialidadLayout } from "@/components/especialidades/EspecialidadLayout";
import { PlanAlimentacionForm } from "@/components/nutricion/PlanAlimentacionForm";
import { PlanAlimentacion } from "@/components/nutricion/PlanAlimentacion";
import { Apple, ChefHat, FileText, Brain } from "lucide-react";
import { PacienteInfo, generarPlanAlimentacion, descargarPlanPDF, imprimirPlan } from "@/services/anthropic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NutricionPlanPage = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [planGenerado, setPlanGenerado] = useState<string>("");
  const [pacienteActual, setPacienteActual] = useState<PacienteInfo | null>(null);

  const handleSubmitApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Por favor ingresa una API Key válida");
      return;
    }
    setShowApiKeyInput(false);
    toast.success("API Key guardada correctamente");
  };

  const handleGenerarPlan = async (datosPaciente: PacienteInfo) => {
    if (showApiKeyInput) {
      toast.error("Por favor configura primero la API Key de Anthropic");
      return;
    }

    setIsLoading(true);
    setPacienteActual(datosPaciente);

    try {
      const plan = await generarPlanAlimentacion(apiKey, datosPaciente);
      setPlanGenerado(plan);
      toast.success("Plan de alimentación generado correctamente");
    } catch (error) {
      console.error("Error al generar plan:", error);
      toast.error("Error al generar el plan de alimentación. Verifica tu API Key e intenta nuevamente.");
      // Si hay un error de API Key, mostramos nuevamente el input
      if (error instanceof Error && error.message.includes("API")) {
        setShowApiKeyInput(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprimir = () => {
    if (planGenerado && pacienteActual) {
      imprimirPlan(planGenerado, pacienteActual.nombre);
    }
  };

  const handleDescargar = () => {
    if (planGenerado && pacienteActual) {
      descargarPlanPDF(planGenerado, pacienteActual.nombre);
    }
  };

  return (
    <EspecialidadLayout
      title="Planes de Alimentación"
      description="Crea planes de alimentación personalizados con IA"
      icon={<ChefHat className="h-6 w-6 text-purple-700" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-100 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded-full">
                <Brain className="h-8 w-8 text-purple-700 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-purple-800 dark:text-purple-300">Nutrición Asistida por IA</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Utiliza inteligencia artificial para crear planes de alimentación personalizados en segundos, 
                  adaptados a las necesidades específicas de cada paciente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showApiKeyInput ? (
        <Card className="mb-6 border-amber-200 dark:border-amber-800">
          <CardHeader className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-100 dark:border-amber-800">
            <CardTitle className="text-lg text-amber-700 dark:text-amber-400">Configuración Requerida</CardTitle>
            <CardDescription>
              Se requiere una API Key de Anthropic para generar planes de alimentación
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Para utilizar esta función, necesitas una API Key de Anthropic Claude. 
                Puedes obtener una en{" "}
                <a 
                  href="https://console.anthropic.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  console.anthropic.com
                </a>.
              </p>
              
              <div className="flex items-center gap-2">
                <Input 
                  type="password"
                  placeholder="Ingresa tu API Key de Anthropic"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-grow"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleSubmitApiKey}>Guardar</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>La API Key se guardará solo en esta sesión</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Nota: La API Key se almacena localmente solo en tu navegador durante esta sesión 
                y no se envía a ningún servidor excepto a Anthropic para procesar tu solicitud.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <PlanAlimentacionForm 
            onSubmit={handleGenerarPlan}
            isLoading={isLoading}
          />
        </div>
        
        {planGenerado && pacienteActual ? (
          <div>
            <PlanAlimentacion 
              plan={planGenerado}
              nombrePaciente={pacienteActual.nombre}
              onPrint={handleImprimir}
              onDownload={handleDescargar}
            />
          </div>
        ) : !showApiKeyInput ? (
          <div className="flex items-center justify-center h-full">
            <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center p-6">
              <div className="flex flex-col items-center space-y-4">
                <FileText className="h-12 w-12 text-gray-400" />
                <CardTitle className="text-lg text-gray-700 dark:text-gray-300">No hay planes generados</CardTitle>
                <CardDescription>
                  Completa el formulario para generar un plan de alimentación personalizado
                </CardDescription>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </EspecialidadLayout>
  );
};

export default NutricionPlanPage;
