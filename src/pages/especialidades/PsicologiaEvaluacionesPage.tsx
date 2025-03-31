
import React, { useState, useEffect } from "react";
import { EspecialidadLayout } from "@/components/especialidades/EspecialidadLayout";
import { EvaluacionesForm, PacienteEvaluacionInfo } from "@/components/psicologia/EvaluacionesForm";
import { ProtocoloEvaluacion } from "@/components/psicologia/ProtocoloEvaluacion";
import { FileCheck, FileText, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiKeys } from "@/config/api-keys";
import { ScrollArea } from "@/components/ui/scroll-area";
import { imprimirPlan, descargarPlanPDF } from "@/services/anthropic";

const PsicologiaEvaluacionesPage = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [protocoloGenerado, setProtocoloGenerado] = useState<string>("");
  const [pacienteActual, setPacienteActual] = useState<PacienteEvaluacionInfo | null>(null);

  // Verificar si ya tenemos una clave API almacenada
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
    
    // Guardar la clave API en nuestro gestor
    if (apiKeys.setKey('anthropic', apiKey)) {
      setShowApiKeyInput(false);
      apiKeys.setupKeyExpiration('anthropic', 60); // Expira en 60 minutos
      toast.success("API Key guardada correctamente");
      // Limpiar el estado para no mantener la clave en memoria
      setApiKey("");
    }
  };

  const generarProtocoloEvaluacion = async (apiKey: string, datos: PacienteEvaluacionInfo): Promise<string> => {
    // Obtener los nombres completos de las pruebas seleccionadas
    const nombresPruebas: Record<string, string> = {
      "beck": "Inventario de Depresión de Beck (BDI-II)",
      "stai": "Inventario de Ansiedad Estado-Rasgo (STAI)",
      "wais": "Escala Wechsler de Inteligencia para Adultos (WAIS-IV)",
      "wisc": "Escala Wechsler de Inteligencia para Niños (WISC-V)",
      "mmpi": "Inventario Multifásico de Personalidad de Minnesota (MMPI-2)",
      "scl90r": "Listado de Síntomas SCL-90-R",
      "16pf": "Cuestionario 16PF",
      "bai": "Inventario de Ansiedad de Beck (BAI)",
      "scid": "Entrevista Clínica Estructurada para el DSM-5 (SCID-5)",
      "mcmi": "Inventario Clínico Multiaxial de Millon (MCMI-IV)",
      "rorschach": "Test de Rorschach",
    };
    
    const pruebasNombres = datos.pruebasSeleccionadas.map(id => nombresPruebas[id] || id).join(", ");
    
    const prompt = `
    Eres un psicólogo clínico especializado en evaluación psicológica. Necesito que elabores un protocolo detallado para la evaluación de un paciente basado en la siguiente información:
    
    - Nombre: ${datos.nombre}
    - Edad: ${datos.edad}
    - Motivo de evaluación: ${datos.motivo}
    - Tipo de evaluación: ${datos.tipoEvaluacion}
    - Pruebas seleccionadas: ${pruebasNombres}
    - Observaciones adicionales: ${datos.observaciones || "No hay observaciones adicionales"}
    
    El protocolo debe incluir:
    
    1. Resumen del caso y objetivos de la evaluación
    2. Descripción detallada de cada prueba a aplicar (propósito, qué evalúa, interpretación básica)
    3. Secuencia recomendada de aplicación
    4. Consideraciones específicas para este caso
    5. Recomendaciones para la interpretación integrada
    6. Estructura para el informe final
    
    Usa markdown para dar formato al documento. Sé específico y detallado en cada sección.
    `;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 4000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error en la API de Anthropic: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error("Error al generar protocolo:", error);
      throw error;
    }
  };

  const handleGenerarProtocolo = async (datosPaciente: PacienteEvaluacionInfo) => {
    if (!apiKeys.hasKey('anthropic') && showApiKeyInput) {
      toast.error("Por favor configura primero la API Key de Anthropic");
      return;
    }

    setIsLoading(true);
    setPacienteActual(datosPaciente);

    try {
      // Usar la clave API almacenada en nuestro gestor
      const apiKeyToUse = apiKeys.getKey('anthropic') || "";
      const protocolo = await generarProtocoloEvaluacion(apiKeyToUse, datosPaciente);
      setProtocoloGenerado(protocolo);
      toast.success("Protocolo de evaluación generado correctamente");
    } catch (error) {
      console.error("Error al generar protocolo:", error);
      
      // Manejo seguro de errores
      let mensajeError = "Error al generar el protocolo de evaluación.";
      if (error instanceof Error) {
        mensajeError = error.message.includes("API") 
          ? "Error con la API Key. Verifica que sea válida e intenta nuevamente." 
          : error.message;
      }
      
      toast.error(mensajeError);
      
      // Si hay un error de API Key, mostramos nuevamente el input
      if (error instanceof Error && error.message.includes("API")) {
        apiKeys.removeKey('anthropic');
        setShowApiKeyInput(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprimir = () => {
    if (protocoloGenerado && pacienteActual) {
      imprimirPlan(protocoloGenerado, `Evaluación - ${pacienteActual.nombre}`);
    }
  };

  const handleDescargar = () => {
    if (protocoloGenerado && pacienteActual) {
      descargarPlanPDF(protocoloGenerado, `Evaluación - ${pacienteActual.nombre}`);
    }
  };

  const handleAplicarPrueba = (pruebaId: string) => {
    // Mapeo de los nombres de las pruebas
    const nombresPruebas: Record<string, string> = {
      "beck": "Inventario de Depresión de Beck (BDI-II)",
      "stai": "Inventario de Ansiedad Estado-Rasgo (STAI)",
      "wais": "Escala Wechsler de Inteligencia para Adultos (WAIS-IV)",
      "wisc": "Escala Wechsler de Inteligencia para Niños (WISC-V)",
      "mmpi": "Inventario Multifásico de Personalidad de Minnesota (MMPI-2)",
      "scl90r": "Listado de Síntomas SCL-90-R",
      "16pf": "Cuestionario 16PF",
      "bai": "Inventario de Ansiedad de Beck (BAI)",
      "scid": "Entrevista Clínica Estructurada para el DSM-5 (SCID-5)",
      "mcmi": "Inventario Clínico Multiaxial de Millon (MCMI-IV)",
      "rorschach": "Test de Rorschach",
    };
    
    toast.success(`Aplicando: ${nombresPruebas[pruebaId] || pruebaId}`);
    // Aquí se implementaría la lógica para abrir o iniciar la prueba específica
  };

  return (
    <EspecialidadLayout
      title="Evaluaciones Psicológicas"
      description="Gestión de pruebas y evaluaciones psicológicas"
      icon={<FileCheck className="h-6 w-6 text-purple-700" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-100 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded-full">
                <ClipboardCheck className="h-8 w-8 text-purple-700 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-purple-800 dark:text-purple-300">Evaluaciones Psicológicas</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestiona la aplicación de pruebas psicológicas estandarizadas y genera protocolos de evaluación 
                  detallados para cada paciente con asistencia de IA.
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
              Se requiere una API Key de Anthropic para generar protocolos de evaluación
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
          <EvaluacionesForm 
            onSubmit={handleGenerarProtocolo}
            isLoading={isLoading}
          />
        </div>
        
        {protocoloGenerado && pacienteActual ? (
          <div className="max-h-[calc(100vh-150px)]">
            <ScrollArea className="h-[calc(100vh-150px)]">
              <ProtocoloEvaluacion 
                protocolo={protocoloGenerado}
                nombrePaciente={pacienteActual.nombre}
                pruebasSeleccionadas={pacienteActual.pruebasSeleccionadas}
                onPrint={handleImprimir}
                onDownload={handleDescargar}
                onAplicarPrueba={handleAplicarPrueba}
              />
            </ScrollArea>
          </div>
        ) : !showApiKeyInput ? (
          <div className="flex items-center justify-center h-full">
            <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center p-6">
              <div className="flex flex-col items-center space-y-4">
                <FileText className="h-12 w-12 text-gray-400" />
                <CardTitle className="text-lg text-gray-700 dark:text-gray-300">No hay protocolos generados</CardTitle>
                <CardDescription>
                  Completa el formulario para generar un protocolo de evaluación psicológica
                </CardDescription>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </EspecialidadLayout>
  );
};

export default PsicologiaEvaluacionesPage;
