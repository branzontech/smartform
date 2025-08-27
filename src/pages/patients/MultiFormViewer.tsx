import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Check, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchFormById, createDynamicSchema, saveFormResponse } from '@/utils/form-utils';
import { Form as FormType } from '../Home';
import { QuestionRenderer } from '@/components/forms/form-viewer/question-renderer';
import { QuestionData } from '@/components/forms/question/types';
import { Form } from "@/components/ui/form";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface FormWithStatus {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  formData: FormType | null;
  questions: QuestionData[];
  responses: { [key: string]: any };
}

const MultiFormViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get("patientId");
  const consultationId = queryParams.get("consultationId");
  const formIds = queryParams.get("forms")?.split(',') || [];

  const [forms, setForms] = useState<FormWithStatus[]>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentFormData, setCurrentFormData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      const formsWithStatus: FormWithStatus[] = [];
      
      for (const formId of formIds) {
        const result = fetchFormById(formId);
        if (result.form) {
          formsWithStatus.push({
            id: formId,
            title: result.form.title,
            description: result.form.description,
            completed: false,
            formData: result.form,
            questions: result.form.questions as QuestionData[],
            responses: {}
          });
        }
      }
      
      setForms(formsWithStatus);
      setLoading(false);
    };

    if (formIds.length > 0) {
      loadForms();
    } else {
      navigate('/app/pacientes/nueva-consulta');
    }
  }, [formIds, navigate]);

  const handleFormComplete = (formId: string, responses: any) => {
    // Save the form response
    saveFormResponse(formId, {
      ...responses,
      _patientId: patientId,
      _consultationId: consultationId
    });

    setForms(prev => prev.map(form => 
      form.id === formId ? { ...form, completed: true, responses } : form
    ));
    
    toast({
      title: "Formulario completado",
      description: "El formulario se ha guardado correctamente",
    });

    // Automatically move to next form if available
    const currentIndex = forms.findIndex(f => f.id === formId);
    
    if (currentIndex < forms.length - 1) {
      setCurrentFormIndex(currentIndex + 1);
      setCurrentFormData({});
    }
  };

  const handleInputChange = (id: string, value: any) => {
    setCurrentFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleFinishConsultation = () => {
    const completedFormsCount = forms.filter(f => f.completed).length;
    
    if (completedFormsCount === 0) {
      toast({
        title: "Sin formularios completados",
        description: "Debe completar al menos un formulario antes de finalizar",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Consulta completada",
      description: `Se completaron ${completedFormsCount} de ${forms.length} formularios`,
    });

    navigate(`/app/pacientes/${patientId}`);
  };

  const completedCount = forms.filter(f => f.completed).length;
  const progressPercentage = forms.length > 0 ? (completedCount / forms.length) * 100 : 0;

  // Create dynamic form schema for current form
  const currentForm = forms[currentFormIndex];
  const dynamicSchema = currentForm ? createDynamicSchema(currentForm.questions) : z.object({});
  
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: currentFormData,
  });

  // Update form when switching forms
  useEffect(() => {
    if (currentForm) {
      // Load patient data if available
      if (patientId) {
        const savedPatients = localStorage.getItem("patients");
        if (savedPatients) {
          const patients = JSON.parse(savedPatients);
          const patient = patients.find((p: any) => p.id === patientId);
          
          if (patient) {
            const patientData: { [key: string]: any } = {};
            currentForm.questions.forEach(question => {
              if (question.type === "short" && question.title.includes("nombre")) {
                patientData[question.id] = patient.name;
              } else if (question.type === "short" && question.title.includes("identificación")) {
                patientData[question.id] = patient.documentId;
              } else if (question.type === "short" && question.title.includes("teléfono")) {
                patientData[question.id] = patient.contactNumber;
              } else if (question.type === "short" && question.title.includes("email")) {
                patientData[question.id] = patient.email;
              }
            });
            
            setCurrentFormData(patientData);
            form.reset(patientData);
          }
        }
      } else {
        setCurrentFormData({});
        form.reset({});
      }
    }
  }, [currentFormIndex, patientId, currentForm, form]);

  const onSubmit = (values: z.infer<typeof dynamicSchema>) => {
    if (!currentForm) return;

    // Process special field types
    const processedValues = { ...values };
    
    currentForm.questions.forEach(question => {
      if (question.type === "vitals" && question.vitalType === "TA") {
        processedValues[question.id] = {
          sys: currentFormData[`${question.id}_sys`],
          dia: currentFormData[`${question.id}_dia`]
        };
      } else if (question.type === "vitals" && question.vitalType === "IMC") {
        processedValues[question.id] = {
          weight: currentFormData[`${question.id}_weight`],
          height: currentFormData[`${question.id}_height`],
          bmi: currentFormData[`${question.id}_bmi`]
        };
      } else if (question.type === "clinical") {
        processedValues[question.id] = {
          title: currentFormData[`${question.id}_title`],
          detail: currentFormData[`${question.id}_detail`]
        };
      } else if (question.type === "multifield" && question.multifields) {
        const multifieldValues: Record<string, string> = {};
        question.multifields.forEach(field => {
          multifieldValues[field.id] = currentFormData[`${question.id}_${field.id}`] || '';
        });
        processedValues[question.id] = multifieldValues;
      }
    });

    handleFormComplete(currentForm.id, processedValues);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Cargando formularios...</p>
          </div>
        </main>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <BackButton />
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No se encontraron formularios</h2>
            <p className="text-gray-600 mb-4">No hay formularios válidos para esta consulta</p>
            <Button onClick={() => navigate('/app/pacientes/nueva-consulta')}>
              Volver a nueva consulta
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Compact header with progress */}
        <div className="bg-background border-b p-3">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <BackButton />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold truncate">Consulta - Formularios Múltiples</h1>
                <p className="text-xs text-muted-foreground">
                  {completedCount}/{forms.length} completados
                </p>
              </div>
            </div>
            <Progress value={progressPercentage} className="w-full h-1.5" />
          </div>
        </div>

        {/* Forms navigation and content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Compact forms sidebar */}
            <div className="w-64 border-r bg-muted/30 p-3 space-y-3">
              <div className="space-y-2">
                {forms.map((formItem, index) => (
                  <div
                    key={formItem.id}
                    className={`p-2 rounded cursor-pointer transition-all text-sm ${
                      currentFormIndex === index 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setCurrentFormIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                        formItem.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : currentFormIndex === index
                            ? 'border-primary-foreground'
                            : 'border-muted-foreground'
                      }`}>
                        {formItem.completed ? <Check size={10} /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{formItem.title}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compact navigation */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCurrentFormIndex(Math.max(0, currentFormIndex - 1))}
                  disabled={currentFormIndex === 0}
                >
                  <ChevronLeft size={14} className="mr-1" />
                  Anterior
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCurrentFormIndex(Math.min(forms.length - 1, currentFormIndex + 1))}
                  disabled={currentFormIndex === forms.length - 1}
                >
                  Siguiente
                  <ChevronRight size={14} className="ml-1" />
                </Button>

                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleFinishConsultation}
                  disabled={completedCount === 0}
                >
                  <Check size={14} className="mr-1" />
                  Finalizar
                </Button>
              </div>
            </div>

            {/* Current form content - Direct rendering */}
            <div className="flex-1 overflow-auto">
              {currentForm && (
                <div className="p-4">
                  <div className="mb-4 pb-3 border-b">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      {currentForm.title}
                      {currentForm.completed && (
                        <Check size={16} className="text-green-500" />
                      )}
                    </h2>
                    {currentForm.description && (
                      <p className="text-sm text-muted-foreground mt-1">{currentForm.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Formulario {currentFormIndex + 1} de {forms.length}
                    </div>
                  </div>
                  
                  <FormProvider {...form}>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {currentForm.questions.map(question => (
                          <QuestionRenderer
                            key={question.id}
                            question={question}
                            formData={currentFormData}
                            onChange={handleInputChange}
                            errors={form.formState.errors}
                          />
                        ))}
                        <div className="sticky bottom-0 bg-background pt-4 border-t">
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={currentForm.completed}
                          >
                            {currentForm.completed ? 'Formulario completado' : 'Completar formulario'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </FormProvider>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MultiFormViewer;