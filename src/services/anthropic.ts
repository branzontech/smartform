
import { toast } from "sonner";

// Constantes para prompt engineering (optimizando tokens)
const SYSTEM_PROMPT = `Eres un nutricionista experto creando planes de alimentación. 
Genera planes de alimentación precisos, específicos y personalizados a la información del paciente.
Formato: Conciso, organizado por días y comidas, con valores nutricionales estimados. 
Optimiza para eficiencia, siendo específico y útil. No incluyas introducciones largas.`;

// Tipos para los parámetros del paciente
export interface PacienteInfo {
  nombre: string;
  edad: string;
  genero: string;
  peso: string;
  altura: string;
  nivelActividad: string;
  objetivos: string;
  condicionesMedicas?: string;
  restriccionesDieteticas?: string;
  alergias?: string;
  preferenciasAlimentarias?: string;
}

export async function generarPlanAlimentacion(
  apiKey: string,
  pacienteInfo: PacienteInfo
): Promise<string> {
  // Calcular el IMC para proporcionar información adicional al modelo
  const pesoKg = parseFloat(pacienteInfo.peso);
  const alturaCm = parseInt(pacienteInfo.altura);
  const alturaM = alturaCm / 100;
  const imc = pesoKg / (alturaM * alturaM);
  const imcRedondeado = Math.round(imc * 10) / 10;
  
  // Usar información más condensada para ahorrar tokens
  const userPrompt = `
Información del paciente:
- Nombre: ${pacienteInfo.nombre}
- Edad: ${pacienteInfo.edad} años
- Género: ${pacienteInfo.genero}
- Peso: ${pacienteInfo.peso} kg
- Altura: ${pacienteInfo.altura} cm
- IMC: ${imcRedondeado}
- Actividad física: ${pacienteInfo.nivelActividad}
- Objetivos: ${pacienteInfo.objetivos}
${pacienteInfo.condicionesMedicas ? `- Condiciones médicas: ${pacienteInfo.condicionesMedicas}` : ''}
${pacienteInfo.restriccionesDieteticas ? `- Restricciones dietéticas: ${pacienteInfo.restriccionesDieteticas}` : ''}
${pacienteInfo.alergias ? `- Alergias alimentarias: ${pacienteInfo.alergias}` : ''}
${pacienteInfo.preferenciasAlimentarias ? `- Preferencias alimentarias: ${pacienteInfo.preferenciasAlimentarias}` : ''}

Crea un plan alimenticio para 7 días que incluya desayuno, almuerzo, cena y 2 meriendas. 
Incluye porciones exactas (en gramos o medidas caseras) y valor nutricional aproximado por comida: calorías, proteínas, carbohidratos y grasas.
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
        model: "claude-3-haiku-20240307",  // Modelo más económico en tokens
        max_tokens: 4000,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error API Anthropic: ${errorData.error?.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Error al generar plan de alimentación:", error);
    throw error;
  }
}

// Funciones de utilidad para el plan
export function descargarPlanPDF(plan: string, nombrePaciente: string) {
  // Esta función sería reemplazada por una implementación real de PDF
  // Como ejemplo, simplemente descargamos el texto como un archivo .txt
  const blob = new Blob([plan], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Plan_Alimentacion_${nombrePaciente.replace(/\s+/g, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success("Plan de alimentación descargado correctamente");
}

export function imprimirPlan(plan: string, nombrePaciente: string) {
  const ventanaImpresion = window.open("", "_blank");
  if (ventanaImpresion) {
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Plan de Alimentación - ${nombrePaciente}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1 { color: #6b46c1; text-align: center; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <h1>Plan de Alimentación Personalizado</h1>
          <h2>Paciente: ${nombrePaciente}</h2>
          <pre>${plan}</pre>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
    
    toast.success("Enviando a impresión...");
  } else {
    toast.error("No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por tu navegador.");
  }
}
