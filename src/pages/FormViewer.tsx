
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { z } from "zod";
import { QuestionRenderer } from '@/components/forms/form-viewer/question-renderer';
import { QuestionData } from '@/components/forms/question/types';
import { FormTitle } from '@/components/ui/form-title';
import { BackButton } from '@/App';
import { Check, Link as LinkIcon, FileText, Printer } from 'lucide-react';
import { toast } from "sonner";
import { Form as FormType } from './Home';
import { FormLoading } from '@/components/forms/form-viewer/form-loading';
import { FormError } from '@/components/forms/form-viewer/form-error';
import { FormSubmissionSuccess } from '@/components/forms/form-viewer/form-submission-success';
import { createDynamicSchema, fetchFormById, saveFormResponse } from '@/utils/form-utils';
import { useToast } from '@/hooks/use-toast';
import { PatientHistoryPanel } from '@/components/patients/PatientHistoryPanel';

interface FormData {
  [key: string]: any;
}

const FormViewer = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<FormData>({});
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [formTitle, setFormTitle] = useState("Formulario");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"forms" | "formato">("forms");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast: uiToast } = useToast();

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get("patientId");
  const consultationId = queryParams.get("consultationId");

  useEffect(() => {
    const loadForm = async () => {
  console.log("FormViewer - formId:", formId);
  console.log("FormViewer - patientId:", patientId);
  console.log("FormViewer - consultationId:", consultationId);
  console.log("FormViewer - Current URL:", location.pathname + location.search);
      
      if (formId) {
        setLoading(true);
        setError("");
        
        try {
          const result = fetchFormById(formId);
          
          if (result.form) {
            setQuestions(result.form.questions as QuestionData[]);
            setFormTitle(result.form.title);
            setFormDescription(result.form.description);
            // Ensure we're handling the type correctly
            if (result.form.formType === "forms" || result.form.formType === "formato") {
              setFormType(result.form.formType);
            }
            
            if (result.error) {
              setError(result.error);
            }
          }
          
          // If this is for a patient, load patient data
          if (patientId) {
            const savedPatients = localStorage.getItem("patients");
            if (savedPatients) {
              const patients = JSON.parse(savedPatients);
              const patient = patients.find((p: any) => p.id === patientId);
              
              if (patient) {
                // Pre-fill patient information into the form
                const patientData: FormData = {};
                questions.forEach(question => {
                  if (question.type === "short" && question.title.includes("nombre")) {
                    patientData[question.id] = patient.name;
                  } else if (question.type === "short" && question.title.includes("identificación")) {
                    patientData[question.id] = patient.documentId;
                  } else if (question.type === "short" && question.title.includes("teléfono")) {
                    patientData[question.id] = patient.contactNumber;
                  } else if (question.type === "short" && question.title.includes("email")) {
                    patientData[question.id] = patient.email;
                  }
                  // Add more mappings as needed
                });
                
                setFormData(prevData => ({...prevData, ...patientData}));
              }
            }
          }
          
        } catch (error) {
          console.error('Error loading form:', error);
          setError("Error al cargar el formulario");
        } finally {
          setLoading(false);
        }
      }
    };

    loadForm();
  }, [formId, patientId, questions]);

  const dynamicSchema = createDynamicSchema(questions);
  
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: formData,
  });

  const handleInputChange = (id: string, value: any) => {
    console.log(`Updating field ${id} with value:`, value);
    setFormData(prevData => ({
      ...prevData,
      [id]: value,
    }));
  };

  const onSubmit = (values: z.infer<typeof dynamicSchema>) => {
    console.log("Formulario enviado:", values);
    
    // Process any special field types that need additional handling
    const processedValues = { ...values };
    
    // Para preguntas con tipos especiales, debemos procesarlas manualmente
    questions.forEach(question => {
      if (question.type === "vitals" && question.vitalType === "TA") {
        processedValues[question.id] = {
          sys: formData[`${question.id}_sys`],
          dia: formData[`${question.id}_dia`]
        };
      } else if (question.type === "vitals" && question.vitalType === "IMC") {
        processedValues[question.id] = {
          weight: formData[`${question.id}_weight`],
          height: formData[`${question.id}_height`],
          bmi: formData[`${question.id}_bmi`]
        };
      } else if (question.type === "clinical") {
        processedValues[question.id] = {
          title: formData[`${question.id}_title`],
          detail: formData[`${question.id}_detail`]
        };
      } else if (question.type === "multifield" && question.multifields) {
        const multifieldValues: Record<string, string> = {};
        question.multifields.forEach(field => {
          multifieldValues[field.id] = formData[`${question.id}_${field.id}`] || '';
        });
        processedValues[question.id] = multifieldValues;
      }
    });
    
    console.log("Valores procesados antes de guardar:", processedValues);
    
    // Add patient and consultation reference if applicable
    if (patientId) {
      processedValues._patientId = patientId;
    }
    
    if (consultationId) {
      processedValues._consultationId = consultationId;
    }
    
    // Guardar la respuesta en localStorage
    if (formId) {
      saveFormResponse(formId, processedValues);
    }
    
    setSubmitted(true);
    toast("Formulario enviado correctamente", {
      description: "Gracias por completar el formulario",
      duration: 5000,
    });

    // If this was part of a consultation, redirect back to patient detail
    if (patientId && consultationId) {
      uiToast({
        title: "Formulario guardado",
        description: "El formulario ha sido guardado correctamente para esta consulta.",
      });
      
      setTimeout(() => {
        navigate(`/pacientes/${patientId}`);
      }, 2000);
    }
  };

  const copyFormLinkToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast("Enlace copiado al portapapeles", {
      description: "Ahora puedes compartir el formulario",
      icon: <Check size={16} className="text-green-500" />,
    });
  };

  const printForm = () => {
    window.print();
  };

  if (loading) {
    return <FormLoading />;
  }

  if (error && !questions.length) {
    return <FormError error={error} />;
  }

  if (submitted) {
    return <FormSubmissionSuccess onResubmit={() => setSubmitted(false)} />;
  }

  // Check if this is a consultation form to use two-column layout
  const isConsultationForm = patientId && consultationId;
  // Show patient history panel if we have a patientId (even without consultationId)
  const showPatientPanel = !!patientId;
  
  console.log("FormViewer - isConsultationForm:", isConsultationForm);
  console.log("FormViewer - showPatientPanel:", showPatientPanel);
  console.log("FormViewer - patientId for panel:", patientId);

  return (
    <div className={`${showPatientPanel ? 'min-h-screen' : 'container py-12'} print:py-6 print:mx-0 print:w-full print:max-w-none`}>
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">{formTitle}</h1>
        {formDescription && <p className="text-gray-600">{formDescription}</p>}
      </div>

      {!showPatientPanel && (
        <div className="print:hidden">
          <BackButton />
        </div>
      )}
      
      {showPatientPanel ? (
        // Two-column layout for consultation forms
        <div className="flex h-screen">
          {/* Main form column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="print:hidden bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <BackButton />
                  <div>
                    <h1 className="text-xl font-semibold">{formTitle}</h1>
                    {formDescription && (
                      <p className="text-sm text-muted-foreground">{formDescription}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={printForm}
                    className="flex items-center gap-2"
                  >
                    <Printer size={16} />
                    Imprimir
                  </Button>
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
              </div>
              
              {isConsultationForm && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                    Consulta médica en curso - Complete el formulario de atención
                  </p>
                </div>
              )}
              
              {showPatientPanel && !isConsultationForm && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                    Formulario para paciente - Historial médico disponible en el panel lateral
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="p-6 bg-background">
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
                      <div className="sticky bottom-0 bg-background pt-4 border-t">
                        <Button type="submit" className="w-full print:hidden">
                          Completar atención
                        </Button>
                      </div>
                    </form>
                  </Form>
                </FormProvider>
              </div>
            </div>
          </div>
          
          {/* Patient history side panel */}
          <div className="w-80 border-l bg-muted/30 print:hidden">
            <PatientHistoryPanel patientId={patientId} className="h-full" />
          </div>
        </div>
      ) : (
        // Standard single-column layout for regular forms
        <div>
          <div className="mb-6 flex justify-between items-center print:hidden">
            <FormTitle 
              defaultTitle={formTitle}
              defaultDescription={formDescription}
              readOnly={true}
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={printForm}
                className="flex items-center gap-2"
              >
                <Printer size={16} />
                Imprimir
              </Button>
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
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 print:shadow-none print:border-none">
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
                  <Button type="submit" className="w-full sm:w-auto print:hidden">Enviar respuestas</Button>
                </form>
              </Form>
            </FormProvider>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormViewer;
