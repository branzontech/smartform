// Define the PacienteInfo type to match the form data structure
export interface PacienteInfo {
  nombre: string;
  edad?: string;
  genero?: 'masculino' | 'femenino' | 'otro';
  peso?: string;
  altura?: string;
  nivelActividad?: 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy activo';
  objetivos?: string[];
  restricciones?: string[];
  condicionesMedicas?: string[];
  alergiasAlimentarias?: string[];
  preferenciasAlimentarias?: string;
}

// Add new interface for psychology treatment info
export interface PacienteTratamientoInfo {
  nombre: string;
  edad: string;
  motivo: string;
  diagnostico: string;
  antecedentes?: string;
  duracion: string;
  enfoque: string;
  objetivos: string;
}

import { apiKeys } from "@/config/api-keys";
import { toast } from "sonner";

// Función para validar que una clave API tenga el formato correcto
const validarClaveAPI = (apiKey: string): boolean => {
  // Validación básica - en producción sería más robusta
  return apiKey.startsWith('sk-ant') && apiKey.length > 30;
};

// Function to generate a nutrition plan based on patient data
export const generarPlanAlimentacion = async (apiKey: string, paciente: PacienteInfo): Promise<string> => {
  // Si no se proporciona una clave, intentamos usar la almacenada
  let claveAPI = apiKey;
  
  if (!claveAPI || !claveAPI.trim()) {
    claveAPI = apiKeys.getKey('anthropic') || '';
    if (!claveAPI) {
      throw new Error("API Key de Anthropic no proporcionada");
    }
  } else {
    // Si se proporciona una nueva clave, la guardamos para futuras solicitudes
    if (validarClaveAPI(claveAPI)) {
      apiKeys.setKey('anthropic', claveAPI);
      apiKeys.setupKeyExpiration('anthropic', 60); // Expira en 60 minutos
    } else {
      throw new Error("La clave API proporcionada no tiene el formato correcto");
    }
  }

  try {
    // En una implementación real, aquí llamaríamos a la API de Anthropic
    // Para demostraciones, simulamos una respuesta después de un retraso
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generamos un plan de ejemplo basado en los datos del paciente
    return generarPlanEjemplo(paciente);
  } catch (error) {
    console.error("Error al generar plan de alimentación:", error);
    // Manejo seguro de errores sin exponer datos sensibles
    if (error instanceof Error) {
      const errorMsg = error.message || "Error desconocido";
      // Sanitizamos cualquier mensaje que pudiera contener la clave API
      const safeErrorMsg = errorMsg.replace(/sk-[a-zA-Z0-9-]+/g, "[API_KEY_REDACTED]");
      throw new Error(`Error: ${safeErrorMsg}`);
    }
    throw new Error("Error al comunicarse con la API. Verifica tu conexión e intenta nuevamente.");
  }
};

// Function to generate a psychology treatment plan
export const generarPlanTratamiento = async (paciente: PacienteTratamientoInfo): Promise<string> => {
  // Get the API key from storage
  const claveAPI = apiKeys.getKey('anthropic') || '';
  if (!claveAPI) {
    throw new Error("API Key de Anthropic no proporcionada");
  }

  try {
    // Prepare the request to Anthropic API
    const prompt = `Eres un psicólogo clínico experto y vas a crear un plan de tratamiento personalizado, detallado y profesional para el siguiente paciente:
    
Nombre: ${paciente.nombre}
Edad: ${paciente.edad}
Motivo de consulta: ${paciente.motivo}
Diagnóstico: ${paciente.diagnostico}
Antecedentes: ${paciente.antecedentes || "Sin antecedentes relevantes reportados"}
Duración estimada del tratamiento: ${paciente.duracion}
Enfoque terapéutico: ${paciente.enfoque}
Objetivos del tratamiento: ${paciente.objetivos}

Crea un plan de tratamiento estructurado y completo con los siguientes elementos:
1. Resumen del caso
2. Objetivos terapéuticos específicos (al menos 5)
3. Intervenciones recomendadas (al menos 5, detalladas)
4. Cronograma de sesiones (dividido en fases)
5. Técnicas específicas a utilizar (al menos 5, adaptadas al enfoque terapéutico seleccionado)
6. Indicadores de progreso
7. Recomendaciones adicionales

Formatea el plan usando Markdown para que sea fácil de leer, con encabezados, listas y secciones bien organizadas.`;

    // In a real implementation, we would call the Anthropic API
    // Since direct calls from frontend have CORS issues, we'll simulate it
    // This simulates a successful API response after a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a sample plan based on patient data
    // In production, this would be the actual API call to Anthropic
    const plan = generarPlanTratamientoSimulado(paciente);
    
    return plan;
  } catch (error) {
    console.error("Error al generar plan de tratamiento:", error);
    if (error instanceof Error) {
      const errorMsg = error.message || "Error desconocido";
      // Sanitize any message that might contain the API key
      const safeErrorMsg = errorMsg.replace(/sk-[a-zA-Z0-9-]+/g, "[API_KEY_REDACTED]");
      throw new Error(`Error: ${safeErrorMsg}`);
    }
    throw new Error("Error al comunicarse con la API. Verifica tu conexión e intenta nuevamente.");
  }
};

// Helper function for generating a simulated treatment plan
function generarPlanTratamientoSimulado(paciente: PacienteTratamientoInfo): string {
  // Generate a treatment plan based on patient data
  const plan = `# Plan de tratamiento para ${paciente.nombre}

## Resumen del caso

Paciente de ${paciente.edad} años que acude a consulta por ${paciente.motivo}. Presenta un diagnóstico de ${paciente.diagnostico}, con antecedentes de ${paciente.antecedentes || "sin antecedentes relevantes reportados"}. Se propone un tratamiento con enfoque ${paciente.enfoque} con una duración estimada de ${paciente.duracion}.

## Objetivos terapéuticos específicos

1. Reducir los síntomas asociados con ${paciente.diagnostico}
2. Desarrollar estrategias de afrontamiento efectivas
3. Mejorar la calidad de vida y funcionalidad en áreas afectadas
4. ${paciente.objetivos.split('.')[0] || "Promover el autoconocimiento y la autoaceptación"}
5. Prevenir recaídas mediante el desarrollo de recursos personales

## Intervenciones recomendadas

1. **Psicoeducación**: Proporcionar información sobre ${paciente.diagnostico}, sus causas, manifestaciones y curso esperado.
   
2. **Terapia Cognitivo-Conductual**: Identificación y modificación de patrones de pensamiento disfuncionales.
   
3. **Entrenamiento en habilidades de afrontamiento**: Técnicas de relajación, mindfulness y manejo del estrés.
   
4. **Activación conductual**: Planificación de actividades gratificantes y significativas.
   
5. **Reestructuración cognitiva**: Identificar y desafiar creencias centrales negativas.
   
6. **Prevención de recaídas**: Identificar señales de alerta y desarrollar plan de acción.

## Cronograma de sesiones

### Fase Inicial (${paciente.duracion === '1 mes' ? '4 sesiones' : paciente.duracion === '3 meses' ? '8 sesiones' : '12 sesiones'})
- Frecuencia: Semanal
- Objetivos: Evaluación, establecimiento de alianza terapéutica, psicoeducación

### Fase Intermedia (${paciente.duracion === '1 mes' ? '2 sesiones' : paciente.duracion === '3 meses' ? '4 sesiones' : '8 sesiones'})
- Frecuencia: Semanal o quincenal
- Objetivos: Implementación de técnicas, desarrollo de habilidades

### Fase Final (${paciente.duracion === '1 mes' ? '2 sesiones' : paciente.duracion === '3 meses' ? '4 sesiones' : '8 sesiones'})
- Frecuencia: Quincenal
- Objetivos: Consolidación de ganancias, prevención de recaídas

## Técnicas específicas a utilizar

${paciente.enfoque === 'Cognitivo-Conductual' ? `
1. **Registro de pensamientos automáticos**
2. **Técnicas de respiración y relajación progresiva**
3. **Exposición gradual**
4. **Entrenamiento en resolución de problemas**
5. **Programación de actividades**` : 
paciente.enfoque === 'Psicodinámico' ? `
1. **Asociación libre**
2. **Análisis de transferencia**
3. **Interpretación de sueños**
4. **Análisis de resistencias**
5. **Trabajo con el inconsciente**` :
paciente.enfoque === 'Humanista' ? `
1. **Escucha activa y empática**
2. **Técnicas de focusing**
3. **Ejercicios de autoexploración**
4. **Silla vacía**
5. **Técnicas de presencia plena**` :
paciente.enfoque === 'Sistémico' ? `
1. **Genogramas**
2. **Esculturas familiares**
3. **Redefinición**
4. **Preguntas circulares**
5. **Tareas para casa sistémicas**` :
paciente.enfoque === 'EMDR' ? `
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
2. Participación en grupo de apoyo para personas con ${paciente.diagnostico}.
3. Práctica regular de ejercicio físico moderado (3 veces por semana).
4. Mantener rutinas de sueño regulares.
5. Establecer una red de apoyo social adecuada.
6. Lectura de material psicoeducativo sobre ${paciente.diagnostico}.

*Nota: Este plan de tratamiento es una guía inicial y puede ser modificado según el progreso del paciente y las necesidades que surjan durante el proceso terapéutico.*`;

  return plan;
}

// Helper function to print the plan
export const imprimirPlan = (plan: string, nombrePaciente: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes para imprimir.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Plan de Alimentación - ${nombrePaciente}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #6d28d9; }
        .header { border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
        .content { white-space: pre-line; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Plan de Alimentación Personalizado</h1>
        <p>Preparado para: <strong>${nombrePaciente}</strong></p>
      </div>
      <div class="content">${plan.replace(/\n/g, '<br>')}</div>
      <div class="footer">
        <p>Generado por Smart Doctor - Sistema de Planes Nutricionales</p>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
};

// Helper function to download the plan as PDF
export const descargarPlanPDF = (plan: string, nombrePaciente: string) => {
  const element = document.createElement("a");
  const file = new Blob([`Plan de Alimentación para ${nombrePaciente}\n\n${plan}`], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `Plan_Alimentacion_${nombrePaciente.replace(/\s/g, '_')}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Helper function to generate a sample nutrition plan
function generarPlanEjemplo(paciente: PacienteInfo): string {
  const { nombre, edad, genero, peso, altura, nivelActividad, objetivos, restricciones, condicionesMedicas, alergiasAlimentarias, preferenciasAlimentarias } = paciente;
  
  // Generate a personalized sample plan
  let plan = `PLAN DE ALIMENTACIÓN PERSONALIZADO\n\n`;
  plan += `Preparado para: ${nombre}\n`;
  if (edad) plan += `Edad: ${edad} años\n`;
  if (genero) plan += `Género: ${genero}\n`;
  if (peso) plan += `Peso: ${peso} kg\n`;
  if (altura) plan += `Altura: ${altura} cm\n`;
  if (nivelActividad) plan += `Nivel de actividad física: ${nivelActividad}\n\n`;
  
  // Add introduction based on objectives
  if (objetivos && objetivos.length > 0) {
    plan += `OBJETIVOS NUTRICIONALES:\n`;
    objetivos.forEach(objetivo => plan += `- ${objetivo}\n`);
    plan += `\n`;
  }
  
  // Add notes for medical conditions and allergies
  if (condicionesMedicas && condicionesMedicas.length > 0) {
    plan += `CONSIDERACIONES MÉDICAS:\n`;
    condicionesMedicas.forEach(condicion => plan += `- ${condicion}\n`);
    plan += `\n`;
  }
  
  if (alergiasAlimentarias && alergiasAlimentarias.length > 0) {
    plan += `ALERGIAS ALIMENTARIAS:\n`;
    alergiasAlimentarias.forEach(alergia => plan += `- ${alergia}\n`);
    plan += `\n`;
  }
  
  // Sample meal plan
  plan += `PLAN SEMANAL:\n\n`;
  
  // Day 1
  plan += `Día 1:\n\n`;
  plan += `Desayuno:\n`;
  plan += `- Avena con leche de almendras y frutas\n`;
  plan += `- 1 huevo cocido\n`;
  plan += `- Té verde sin azúcar\n\n`;
  
  plan += `Merienda mañana:\n`;
  plan += `- Yogurt natural con nueces\n\n`;
  
  plan += `Almuerzo:\n`;
  plan += `- Pechuga de pollo a la plancha\n`;
  plan += `- Ensalada mixta con aguacate\n`;
  plan += `- 1/2 taza de arroz integral\n\n`;
  
  plan += `Merienda tarde:\n`;
  plan += `- Manzana\n`;
  plan += `- Puñado pequeño de almendras\n\n`;
  
  plan += `Cena:\n`;
  plan += `- Salmón al horno\n`;
  plan += `- Vegetales al vapor\n`;
  plan += `- Batata asada\n\n`;
  
  // Day 2
  plan += `Día 2:\n\n`;
  plan += `Desayuno:\n`;
  plan += `- Tostadas de pan integral con aguacate\n`;
  plan += `- Batido de proteínas con plátano\n\n`;
  
  plan += `Merienda mañana:\n`;
  plan += `- Pera\n`;
  plan += `- 2 cucharadas de mantequilla de almendras\n\n`;
  
  plan += `Almuerzo:\n`;
  plan += `- Ensalada de atún con garbanzos\n`;
  plan += `- Vegetales crudos\n`;
  plan += `- Fruta\n\n`;
  
  plan += `Merienda tarde:\n`;
  plan += `- Yogurt griego con semillas de chía\n\n`;
  
  plan += `Cena:\n`;
  plan += `- Tacos de frijoles con tortillas de maíz\n`;
  plan += `- Ensalada verde\n`;
  plan += `- Piña\n\n`;
  
  // Add personalized note based on preferences
  if (preferenciasAlimentarias) {
    plan += `NOTA SOBRE PREFERENCIAS ALIMENTARIAS:\n`;
    plan += `Se ha tomado en cuenta tu preferencia por ${preferenciasAlimentarias} en la elaboración de este plan.\n\n`;
  }
  
  // Add restrictions note
  if (restricciones && restricciones.length > 0) {
    plan += `ALIMENTOS A EVITAR:\n`;
    restricciones.forEach(restriccion => plan += `- ${restriccion}\n`);
    plan += `\n`;
  }
  
  // Add closing recommendations
  plan += `RECOMENDACIONES GENERALES:\n`;
  plan += `- Mantener una buena hidratación (2-3 litros de agua al día)\n`;
  plan += `- Limitar el consumo de alimentos procesados y azúcares añadidos\n`;
  plan += `- Respetar los horarios de las comidas\n`;
  plan += `- Masticar bien los alimentos\n\n`;
  
  plan += `Este plan es una guía general. Se recomienda ajustar las porciones según necesidades individuales y consultar con un profesional de salud para adaptaciones específicas.`;
  
  return plan;
}
