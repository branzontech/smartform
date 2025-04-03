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

// Define the PacienteTratamientoInfo type for psychology treatment plans
export interface PacienteTratamientoInfo {
  nombre: string;
  edad?: string;
  motivo?: string;
  diagnostico?: string;
  antecedentes?: string;
  duracion?: string;
  enfoque?: string;
  objetivos?: string;
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
export const generarPlanTratamiento = async (apiKey: string, paciente: PacienteTratamientoInfo): Promise<string> => {
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
    return generarPlanTratamientoEjemplo(paciente);
  } catch (error) {
    console.error("Error al generar plan de tratamiento:", error);
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

// Helper function to print the nutrition plan
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

// Helper function to download the nutrition plan as PDF
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

// Helper function to generate a sample psychology treatment plan
function generarPlanTratamientoEjemplo(paciente: PacienteTratamientoInfo): string {
  const { nombre, edad, motivo, diagnostico, antecedentes, duracion, enfoque, objetivos } = paciente;
  
  // Generate a personalized sample treatment plan
  let plan = `PLAN DE TRATAMIENTO PSICOLÓGICO\n\n`;
  plan += `Paciente: ${nombre}\n`;
  if (edad) plan += `Edad: ${edad} años\n\n`;
  
  plan += `MOTIVO DE CONSULTA:\n`;
  plan += motivo ? `${motivo}\n\n` : "No especificado.\n\n";
  
  if (diagnostico) {
    plan += `DIAGNÓSTICO PRELIMINAR:\n`;
    plan += `${diagnostico}\n\n`;
  }
  
  if (antecedentes) {
    plan += `ANTECEDENTES RELEVANTES:\n`;
    plan += `${antecedentes}\n\n`;
  }
  
  plan += `PLAN DE TRATAMIENTO:\n\n`;
  
  plan += `1. OBJETIVOS TERAPÉUTICOS:\n`;
  if (objetivos) {
    plan += `${objetivos}\n\n`;
  } else {
    plan += `- Evaluar y tratar síntomas presentes\n`;
    plan += `- Desarrollar estrategias de afrontamiento\n`;
    plan += `- Mejorar calidad de vida\n\n`;
  }
  
  plan += `2. ENFOQUE TERAPÉUTICO:\n`;
  if (enfoque) {
    plan += `${enfoque}\n\n`;
  } else {
    plan += `Se utilizará un enfoque integrador, principalmente basado en Terapia Cognitivo-Conductual, adaptado a las necesidades específicas del paciente.\n\n`;
  }
  
  plan += `3. DURACIÓN ESTIMADA:\n`;
  if (duracion) {
    plan += `${duracion}\n\n`;
  } else {
    plan += `Inicialmente se programan 12 sesiones semanales con evaluación continua de progreso.\n\n`;
  }
  
  plan += `4. INTERVENCIONES PRINCIPALES:\n`;
  plan += `- Psicoeducación sobre la condición y proceso terapéutico\n`;
  plan += `- Reestructuración cognitiva de pensamientos disfuncionales\n`;
  plan += `- Técnicas de manejo de estrés y regulación emocional\n`;
  plan += `- Entrenamiento en habilidades sociales y comunicación asertiva\n\n`;
  
  plan += `5. TAREAS ENTRE SESIONES:\n`;
  plan += `- Registro de pensamientos y emociones\n`;
  plan += `- Práctica de técnicas aprendidas en sesión\n`;
  plan += `- Lectura de material complementario\n\n`;
  
  plan += `6. EVALUACIÓN DE PROGRESO:\n`;
  plan += `- Revisión regular de objetivos terapéuticos\n`;
  plan += `- Aplicación de instrumentos de evaluación estandarizados\n`;
  plan += `- Retroalimentación continua del paciente\n\n`;
  
  plan += `NOTAS ADICIONALES:\n`;
  plan += `Este plan es flexible y será ajustado según las necesidades emergentes durante el proceso terapéutico. Se recomienda asistencia constante para obtener mejores resultados.\n\n`;
  
  plan += `Fecha de elaboración: ${new Date().toLocaleDateString('es-ES')}\n\n`;
  
  plan += `Este plan fue elaborado por Smart Doctor - Sistema de Planes de Tratamiento Psicológico`;
  
  return plan;
}
