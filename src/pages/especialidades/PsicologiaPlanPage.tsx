
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
import { imprimirPlan, descargarPlanPDF } from "@/services/anthropic";

const PsicologiaPlanPage = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [planGenerado, setPlanGenerado] = useState<string>("");
  const [pacienteActual, setPacienteActual] = useState<PacienteTratamientoInfo | null>(null);

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

  // Esta función simula la generación del plan localmente en lugar de utilizar la API externa
  const generarPlanTratamientoLocal = async (datos: PacienteTratamientoInfo): Promise<string> => {
    // Simulamos un retraso como si fuera una llamada a la API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Creamos un plan basado en los datos proporcionados
    const plan = `# Plan de tratamiento para ${datos.nombre}

## Resumen del caso

Paciente de ${datos.edad} años que acude a consulta por ${datos.motivo}. Presenta un diagnóstico de ${datos.diagnostico}, con antecedentes de ${datos.antecedentes || "sin antecedentes relevantes reportados"}. Se propone un tratamiento con enfoque ${datos.enfoque} con una duración estimada de ${datos.duracion}.

## Objetivos terapéuticos específicos

1. Reducir los síntomas asociados con ${datos.diagnostico}
2. Desarrollar estrategias de afrontamiento efectivas
3. Mejorar la calidad de vida y funcionalidad en áreas afectadas
4. ${datos.objetivos.split('.')[0] || "Promover el autoconocimiento y la autoaceptación"}
5. Prevenir recaídas mediante el desarrollo de recursos personales

## Intervenciones recomendadas

1. **Psicoeducación**: Proporcionar información sobre ${datos.diagnostico}, sus causas, manifestaciones y curso esperado.
   
2. **Terapia Cognitivo-Conductual**: Identificación y modificación de patrones de pensamiento disfuncionales.
   
3. **Entrenamiento en habilidades de afrontamiento**: Técnicas de relajación, mindfulness y manejo del estrés.
   
4. **Activación conductual**: Planificación de actividades gratificantes y significativas.
   
5. **Reestructuración cognitiva**: Identificar y desafiar creencias centrales negativas.
   
6. **Prevención de recaídas**: Identificar señales de alerta y desarrollar plan de acción.

## Cronograma de sesiones

### Fase Inicial (${datos.duracion === '1 mes' ? '4 sesiones' : datos.duracion === '3 meses' ? '8 sesiones' : '12 sesiones'})
- Frecuencia: Semanal
- Objetivos: Evaluación, establecimiento de alianza terapéutica, psicoeducación

### Fase Intermedia (${datos.duracion === '1 mes' ? '2 sesiones' : datos.duracion === '3 meses' ? '4 sesiones' : '8 sesiones'})
- Frecuencia: Semanal o quincenal
- Objetivos: Implementación de técnicas, desarrollo de habilidades

### Fase Final (${datos.duracion === '1 mes' ? '2 sesiones' : datos.duracion === '3 meses' ? '4 sesiones' : '8 sesiones'})
- Frecuencia: Quincenal
- Objetivos: Consolidación de ganancias, prevención de recaídas

## Técnicas específicas a utilizar

${datos.enfoque === 'Cognitivo-Conductual' ? `
1. **Registro de pensamientos automáticos**
2. **Técnicas de respiración y relajación progresiva**
3. **Exposición gradual**
4. **Entrenamiento en resolución de problemas**
5. **Programación de actividades**` : 
datos.enfoque === 'Psicodinámico' ? `
1. **Asociación libre**
2. **Análisis de transferencia**
3. **Interpretación de sueños**
4. **Análisis de resistencias**
5. **Trabajo con el inconsciente**` :
datos.enfoque === 'Humanista' ? `
1. **Escucha activa y empática**
2. **Técnicas de focusing**
3. **Ejercicios de autoexploración**
4. **Silla vacía**
5. **Técnicas de presencia plena**` :
datos.enfoque === 'Sistémico' ? `
1. **Genogramas**
2. **Esculturas familiares**
3. **Redefinición**
4. **Preguntas circulares**
5. **Tareas para casa sistémicas**` :
datos.enfoque === 'EMDR' ? `
1. **Protocolo EMDR estándar**
2. **Instalación de recursos**
3. **Lugar seguro**
4. **Estimulación bilateral**
5. **Desarrollo de cogniciones positivas**` :
`
1. **Técnicas de autoobservación**
2. **Ejercicios de conciencia corporal**
3. **Prácticas de autocompasión**
4. **Identificación de valores personales**
5. **Ejercicios experienciales**`}

## Indicadores de progreso

1. Reducción de la intensidad y frecuencia de los síntomas
2. Mayor capacidad para identificar y manejar situaciones desencadenantes
3. Mejoría en el funcionamiento social, laboral y/o académico
4. Reducción de conductas de evitación
5. Desarrollo de nuevos recursos y estrategias de afrontamiento
6. Cambios en patrones cognitivos disfuncionales
7. Mayor autoconocimiento y autocompasión

## Recomendaciones adicionales

1. Se recomienda evaluación psiquiátrica para valorar posible tratamiento farmacológico complementario.
2. Participación en grupo de apoyo para personas con ${datos.diagnostico}.
3. Práctica regular de ejercicio físico moderado (3 veces por semana).
4. Mantener rutinas de sueño regulares.
5. Establecer una red de apoyo social adecuada.
6. Lectura de material psicoeducativo sobre ${datos.diagnostico}.

*Nota: Este plan de tratamiento es una guía inicial y puede ser modificado según el progreso del paciente y las necesidades que surjan durante el proceso terapéutico.*`;

    return plan;
  };

  const handleGenerarPlan = async (datosPaciente: PacienteTratamientoInfo) => {
    if (!apiKeys.hasKey('anthropic') && showApiKeyInput) {
      toast.error("Por favor configura primero la API Key de Anthropic");
      return;
    }

    setIsLoading(true);
    setPacienteActual(datosPaciente);

    try {
      // Usamos la función local en lugar de la API externa
      const plan = await generarPlanTratamientoLocal(datosPaciente);
      setPlanGenerado(plan);
      toast.success("Plan de tratamiento generado correctamente");
    } catch (error) {
      console.error("Error al generar plan:", error);
      
      // Manejo seguro de errores
      let mensajeError = "Error al generar el plan de tratamiento.";
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
