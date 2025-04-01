import React, { useState, useEffect } from "react";
import { EspecialidadLayout } from "@/components/especialidades/EspecialidadLayout";
import { PlanTratamientoForm, PacienteTratamientoInfo } from "@/components/psicologia/PlanTratamientoForm";
import { PlanTratamiento } from "@/components/psicologia/PlanTratamiento";
import { Brain, FileText, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiKeys } from "@/config/api-keys";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generarPlanTratamiento, imprimirPlan, descargarPlanPDF } from "@/services/anthropic";

const PsicologiaPlanPage = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [planGenerado, setPlanGenerado] = useState<string>("");
  const [pacienteActual, setPacienteActual] = useState<PacienteTratamientoInfo | null>(null);

  useEffect(() => {
    if (apiKeys.hasKey('anthropic')) {
      setShowApiKeyInput(false);
      toast.success("API Key de Anthropic ya configurada");
    }
  }, []);

  const handleSubmitApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Por favor ingresa una API Key válida");
      return;
    }
    
    if (!apiKey.startsWith('sk-ant')) {
      toast.error("La API Key de Anthropic debe comenzar con 'sk-ant'");
      return;
    }
    
    if (apiKeys.setKey('anthropic', apiKey)) {
      setShowApiKeyInput(false);
      apiKeys.setupKeyExpiration('anthropic', 60);
      toast.success("API Key guardada correctamente");
      setApiKey("");
    }
  };

  const handleGenerarPlan = async (datosPaciente: PacienteTratamientoInfo) => {
    if (!apiKeys.hasKey('anthropic') && showApiKeyInput) {
      toast.error("Por favor configura primero la API Key de Anthropic");
      return;
    }

    setIsLoading(true);
    setPacienteActual(datosPaciente);

    try {
      const plan = await generarPlanTratamiento(datosPaciente);
      setPlanGenerado(plan);
      toast.success("Plan de tratamiento generado correctamente");
    } catch (error) {
      console.error("Error al generar plan:", error);
      
      let mensajeError = "Error al generar el plan de tratamiento.";
      if (error instanceof Error) {
        mensajeError = error.message.includes("API") 
          ? "Error con la API Key. Verifica que sea válida e intenta nuevamente." 
          : error.message;
      }
      
      toast.error(mensajeError);
      
      if (error instanceof Error && error.message.includes("API")) {
        apiKeys.removeKey('anthropic');
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
      title="Planes de Tratamiento Psicológico"
      description="Crea planes de tratamiento personalizados con IA"
      icon={<ClipboardList className="h-6 w-6 text-purple-700" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-100 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded-full">
                <Brain className="h-8 w-8 text-purple-700 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-purple-800 dark:text-purple-300">Psicología Asistida por IA</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Utiliza inteligencia artificial para crear planes de tratamiento psicológico personalizados, 
                  adaptados a las necesidades específicas de cada paciente y al enfoque terapéutico seleccionado.
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
              Se requiere una API Key de Anthropic para generar planes de tratamiento
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
                  autoComplete="off"
                  aria-autocomplete="none"
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
                Por seguridad, la clave expirará después de 60 minutos de inactividad.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sticky top-24">
          <PlanTratamientoForm 
            onSubmit={handleGenerarPlan}
            isLoading={isLoading}
          />
        </div>
        
        {planGenerado && pacienteActual ? (
          <div className="max-h-[calc(100vh-150px)]">
            <ScrollArea className="h-[calc(100vh-150px)]">
              <PlanTratamiento 
                plan={planGenerado}
                nombrePaciente={pacienteActual.nombre}
                onPrint={handleImprimir}
                onDownload={handleDescargar}
              />
            </ScrollArea>
          </div>
        ) : !showApiKeyInput ? (
          <div className="flex items-center justify-center h-full">
            <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center p-6">
              <div className="flex flex-col items-center space-y-4">
                <FileText className="h-12 w-12 text-gray-400" />
                <CardTitle className="text-lg text-gray-700 dark:text-gray-300">No hay planes generados</CardTitle>
                <CardDescription>
                  Completa el formulario para generar un plan de tratamiento personalizado
                </CardDescription>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </EspecialidadLayout>
  );
};

export default PsicologiaPlanPage;
