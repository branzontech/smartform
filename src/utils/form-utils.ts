
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
  
  return true;
};
