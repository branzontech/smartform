import { z } from "zod";
import { QuestionData } from '@/components/forms/question/types';
import { Form } from '@/pages/Home';

// Ejemplo de formulario para desarrollo (solo se usa si no se encuentra el formulario en localStorage)
export const mockForm = {
  id: "mock-form",
  title: "Formulario de Ejemplo",
  description: "Este es un formulario de ejemplo para mostrar la funcionalidad",
  questions: [
    {
      id: "q1",
      type: "short",
      required: true,
      title: "Nombre completo",
      placeholder: "Escribe tu nombre completo",
    },
    {
      id: "q2",
      type: "paragraph",
      required: false,
      title: "Descripción",
      placeholder: "Escribe una descripción",
    },
    {
      id: "q3",
      type: "multiple",
      required: true,
      title: "¿Cómo nos conociste?",
      options: ["Redes sociales", "Amigos", "Búsqueda web"],
    },
    {
      id: "q4",
      type: "checkbox",
      required: true,
      title: "Servicios de interés",
      options: ["Consulta médica", "Laboratorio", "Exámenes especiales"],
    }
  ],
  formType: "forms" as const
};

export const createDynamicSchema = (questions: QuestionData[]) => {
  const schemaFields: Record<string, any> = {};
  
  questions.forEach(question => {
    if (question.required) {
      if (question.type === 'short' || question.type === 'paragraph') {
        schemaFields[question.id] = z.string().min(1, { message: "Este campo es requerido" });
      } else if (question.type === 'multiple') {
        schemaFields[question.id] = z.string().min(1, { message: "Selecciona una opción" });
      } else if (question.type === 'checkbox') {
        schemaFields[question.id] = z.array(z.string()).min(1, { message: "Selecciona al menos una opción" });
      } else {
        schemaFields[question.id] = z.any();
      }
    } else {
      if (question.type === 'short' || question.type === 'paragraph') {
        schemaFields[question.id] = z.string().optional();
      } else if (question.type === 'multiple') {
        schemaFields[question.id] = z.string().optional();
      } else if (question.type === 'checkbox') {
        schemaFields[question.id] = z.array(z.string()).optional();
      } else {
        schemaFields[question.id] = z.any().optional();
      }
    }
  });
  
  // Add fields for medical context
  schemaFields._patientId = z.string().optional();
  schemaFields._consultationId = z.string().optional();
  
  return z.object(schemaFields);
};

export const fetchFormById = (formId: string) => {
  // Buscamos el formulario en localStorage
  const savedForms = localStorage.getItem("forms");
  if (savedForms) {
    try {
      const forms = JSON.parse(savedForms);
      const form = forms.find((f: Form) => f.id === formId);
      
      if (form) {
        return {
          form,
          error: null,
          source: 'localStorage'
        };
      } else {
        console.error('Form not found:', formId);
        return {
          form: mockForm,
          error: "El formulario solicitado no existe",
          source: 'mock'
        };
      }
    } catch (error) {
      console.error('Error parsing forms:', error);
      return {
        form: mockForm,
        error: "Error al cargar el formulario",
        source: 'mock'
      };
    }
  } else {
    // Si no hay formularios en localStorage, usamos los datos de ejemplo
    return {
      form: mockForm,
      error: null,
      source: 'mock'
    };
  }
};

export const saveFormResponse = (formId: string, values: any) => {
  const timestamp = new Date().toISOString();
  const formResponse = {
    timestamp,
    data: values
  };
  
  // Obtener respuestas existentes o crear array vacío
  const existingResponses = localStorage.getItem(`formResponses_${formId}`);
  let responses = [];
  
  if (existingResponses) {
    try {
      responses = JSON.parse(existingResponses);
    } catch (error) {
      console.error("Error parsing existing responses:", error);
    }
  }
  
  // Asegurarse de que las respuestas se procesan correctamente para cada tipo de pregunta
  Object.keys(values).forEach(key => {
    // Procesamiento especial para ciertos tipos de preguntas si es necesario
    if (typeof values[key] === 'object' && !(values[key] instanceof File) && !Array.isArray(values[key])) {
      // Para objetos complejos (como el caso de vitals con TA)
      formResponse.data[key] = JSON.stringify(values[key]);
    } else if (values[key] instanceof File) {
      // Para archivos, guardamos solo el nombre ya que no podemos serializar el objeto File completo
      formResponse.data[key] = {
        name: values[key].name,
        size: values[key].size,
        type: values[key].type
      };
    }
    // Los tipos simples (string, number) y arrays se pueden guardar directamente
  });
  
  // Añadir nueva respuesta
  responses.push(formResponse);
  localStorage.setItem(`formResponses_${formId}`, JSON.stringify(responses));
  
  // Actualizar contador de respuestas en el formulario
  const savedForms = localStorage.getItem("forms");
  if (savedForms) {
    try {
      const forms = JSON.parse(savedForms);
      const updatedForms = forms.map((form: Form) => {
        if (form.id === formId) {
          return {
            ...form,
            responseCount: (form.responseCount || 0) + 1
          };
        }
        return form;
      });
      
      localStorage.setItem("forms", JSON.stringify(updatedForms));
    } catch (error) {
      console.error("Error updating response count:", error);
    }
  }
  
  // Si hay un consultationId, actualizar la consulta para marcarla como completada
  if (values._consultationId) {
    const savedConsultations = localStorage.getItem("consultations");
    if (savedConsultations) {
      try {
        const consultations = JSON.parse(savedConsultations);
        const updatedConsultations = consultations.map((consultation: any) => {
          if (consultation.id === values._consultationId) {
            return {
              ...consultation,
              status: "Completada",
              formCompleted: true,
              formCompletedAt: new Date().toISOString()
            };
          }
          return consultation;
        });
        
        localStorage.setItem("consultations", JSON.stringify(updatedConsultations));
      } catch (error) {
        console.error("Error updating consultation status:", error);
      }
    }
  }
  
  return true;
};

// Función para recuperar respuestas de formulario con procesamiento adecuado
export const getFormResponses = (formId: string) => {
  const storedResponses = localStorage.getItem(`formResponses_${formId}`);
  if (!storedResponses) return [];
  
  try {
    const responses = JSON.parse(storedResponses);
    
    // Procesamos las respuestas para asegurarnos de que están en el formato correcto
    return responses.map((response: any) => {
      const processedData = { ...response.data };
      
      // Convertir de nuevo los objetos serializados a su formato original
      Object.keys(processedData).forEach(key => {
        if (typeof processedData[key] === 'string' && processedData[key].startsWith('{') && processedData[key].endsWith('}')) {
          try {
            processedData[key] = JSON.parse(processedData[key]);
          } catch (e) {
            // Si no se puede parsear, lo dejamos como está
          }
        }
      });
      
      return {
        timestamp: response.timestamp,
        data: processedData
      };
    });
  } catch (error) {
    console.error("Error loading form responses:", error);
    return [];
  }
};

// Obtener respuestas de formulario por paciente
export const getFormResponsesByPatient = (formId: string, patientId: string) => {
  const allResponses = getFormResponses(formId);
  return allResponses.filter(response => response.data._patientId === patientId);
};

// Obtener respuestas de formulario por consulta
export const getFormResponsesByConsultation = (formId: string, consultationId: string) => {
  const allResponses = getFormResponses(formId);
  return allResponses.filter(response => response.data._consultationId === consultationId);
};

// Function to get recent and frequently used forms
export const getRecentAndFrequentForms = (patientId?: string) => {
  // Get all consultations
  const savedConsultations = localStorage.getItem("consultations");
  const consultations = savedConsultations ? JSON.parse(savedConsultations) : [];
  
  // Get all forms
  const savedForms = localStorage.getItem("forms");
  const allForms = savedForms ? JSON.parse(savedForms) : [];
  
  // Track form usage
  const formUsage: Record<string, { count: number, lastUsed: Date, formData?: any }> = {};
  
  // First, populate the formUsage object with all available forms
  allForms.forEach((form: any) => {
    formUsage[form.id] = { 
      count: 0, 
      lastUsed: new Date(0), 
      formData: form 
    };
  });
  
  // Then count usage from consultations
  consultations.forEach((consultation: any) => {
    if (consultation.formId && (!patientId || consultation.patientId === patientId)) {
      if (formUsage[consultation.formId]) {
        formUsage[consultation.formId].count += 1;
        const consultationDate = new Date(consultation.consultationDate);
        if (consultationDate > formUsage[consultation.formId].lastUsed) {
          formUsage[consultation.formId].lastUsed = consultationDate;
        }
      }
    }
  });
  
  // Convert to array and filter only forms that have actually been used
  const usedForms = Object.entries(formUsage)
    .filter(([_, data]) => data.count > 0)
    .map(([formId, data]) => ({
      id: formId,
      usageCount: data.count,
      lastUsed: data.lastUsed,
      ...data.formData
    }));
  
  // Sort by recency (most recent first)
  const recentForms = [...usedForms].sort((a, b) => 
    new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
  ).slice(0, 5); // Top 5 most recent
  
  // Sort by frequency (most used first)
  const frequentForms = [...usedForms].sort((a, b) => 
    b.usageCount - a.usageCount
  ).slice(0, 5); // Top 5 most frequent
  
  return { recentForms, frequentForms };
};
