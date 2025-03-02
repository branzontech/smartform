
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { QuestionRenderer } from '@/components/forms/form-viewer/question-renderer';
import { QuestionData } from '@/components/forms/question/types';
import { FormTitle } from '@/components/ui/form-title';
import { BackButton } from '@/App';
import { ArrowLeft, Link as LinkIcon, Check } from 'lucide-react';
import { toast } from "sonner";
import { Form as FormType } from './Home';

// Ejemplo de formulario para desarrollo (solo se usa si no se encuentra el formulario en localStorage)
const mockForm = {
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
  formType: "forms"
};

interface FormData {
  [key: string]: any;
}

const FormViewer = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({});
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [formTitle, setFormTitle] = useState("Formulario");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"forms" | "formato">("forms");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      if (formId) {
        setLoading(true);
        setError("");
        
        try {
          // Buscamos el formulario en localStorage
          const savedForms = localStorage.getItem("forms");
          if (savedForms) {
            const forms = JSON.parse(savedForms);
            const form = forms.find((f: FormType) => f.id === formId);
            
            if (form) {
              setQuestions(form.questions as QuestionData[]);
              setFormTitle(form.title);
              setFormDescription(form.description);
              setFormType(form.formType || "forms");
            } else {
              console.error('Form not found:', formId);
              setError("El formulario solicitado no existe");
              
              // Usamos los datos de ejemplo como fallback
              setQuestions(mockForm.questions as QuestionData[]);
              setFormTitle(mockForm.title);
              setFormDescription(mockForm.description);
              setFormType(mockForm.formType);
            }
          } else {
            // Si no hay formularios en localStorage, usamos los datos de ejemplo
            setQuestions(mockForm.questions as QuestionData[]);
            setFormTitle(mockForm.title);
            setFormDescription(mockForm.description);
            setFormType(mockForm.formType);
          }
          
        } catch (error) {
          console.error('Error fetching form:', error);
          setError("Error al cargar el formulario");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchForm();
  }, [formId]);

  const createDynamicSchema = () => {
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

  const dynamicSchema = createDynamicSchema();
  
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: formData,
  });

  const handleInputChange = (id: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [id]: value,
    }));
  };

  const onSubmit = (values: z.infer<typeof dynamicSchema>) => {
    console.log("Formulario enviado:", values);
    
    // Guardar la respuesta en localStorage
    if (formId) {
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
          const updatedForms = forms.map((form: FormType) => {
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
    }
    
    setSubmitted(true);
    toast("Formulario enviado correctamente", {
      description: "Gracias por completar el formulario",
      duration: 5000,
    });
  };

  const copyFormLinkToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast("Enlace copiado al portapapeles", {
      description: "Ahora puedes compartir el formulario",
      icon: <Check size={16} className="text-green-500" />,
    });
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-pulse flex flex-col w-full max-w-2xl">
            <div className="h-8 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-1/2"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-6">
                <div className="h-6 bg-gray-200 rounded mb-2 w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <BackButton />
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="text-red-500 text-xl">{error}</div>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container py-12">
        <BackButton />
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-green-600 mb-2">¡Formulario enviado correctamente!</h2>
            <p className="text-gray-600">Gracias por completar el formulario</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Enviar otro formulario
            </Button>
            <Button onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <BackButton />
      
      <div className="mb-6 flex justify-between items-center">
        <FormTitle 
          defaultTitle={formTitle}
          defaultDescription={formDescription}
          readOnly={true}
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyFormLinkToClipboard}
          className="flex items-center gap-2"
        >
          <LinkIcon size={16} />
          Compartir
        </Button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {questions.map(question => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  formData={formData}
                  onChange={handleInputChange}
                  errors={form.formState.errors}
                />
              ))}
              <Button type="submit" className="w-full sm:w-auto">Enviar respuestas</Button>
            </form>
          </Form>
        </FormProvider>
      </div>
    </div>
  );
};

export default FormViewer;
