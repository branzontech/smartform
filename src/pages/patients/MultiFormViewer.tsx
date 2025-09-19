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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdditionalFormsModal } from '@/components/forms/AdditionalFormsModal';
import { QuickLinksManager } from '@/components/forms/QuickLinksManager';
import { PatientHistoryPanel } from '@/components/patients/PatientHistoryPanel';

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
      const skippedForms: string[] = [];
      
      for (const formId of formIds) {
        const result = fetchFormById(formId);
        if (result.form) {
          // Only add forms that have questions
          const questions = result.form.questions as QuestionData[] || [];
          if (questions.length > 0) {
            formsWithStatus.push({
              id: formId,
              title: result.form.title,
              description: result.form.description,
              completed: false,
              formData: result.form,
              questions: questions,
              responses: {}
            });
          } else {
            console.warn(`Form ${formId} has no questions, skipping...`);
            skippedForms.push(result.form.title);
          }
        }
      }
      
      // Show toast only once for all skipped forms
      if (skippedForms.length > 0) {
        toast({
          title: skippedForms.length === 1 ? "Formulario vacío" : "Formularios vacíos",
          description: skippedForms.length === 1 
            ? `El formulario "${skippedForms[0]}" no tiene preguntas configuradas`
            : `Los formularios: ${skippedForms.join(', ')} no tienen preguntas configuradas`,
          variant: "destructive"
        });
      }
      
      setForms(formsWithStatus);
      if (formsWithStatus.length === 0) {
        // Auto-redirect to form selection if none are valid to avoid empty state loop
        navigate('/app/pacientes/nueva-consulta?warn=emptyForms');
        return;
      }
      setLoading(false);
    };

    if (formIds.length > 0) {
      loadForms();
    } else {
      navigate('/app/pacientes/nueva-consulta');
    }
  }, [formIds.join(','), navigate]); // Use join to avoid dependency array issues

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

  const handleAddForm = (formId: string) => {
    const result = fetchFormById(formId);
    if (result.form) {
      const questions = result.form.questions as QuestionData[] || [];
      if (questions.length > 0) {
        const newForm: FormWithStatus = {
          id: formId,
          title: result.form.title,
          description: result.form.description,
          completed: false,
          formData: result.form,
          questions: questions,
          responses: {}
        };
        
        setForms(prev => [...prev, newForm]);
        
        // Update URL to include the new form
        const currentFormIds = queryParams.get("forms")?.split(',') || [];
        const updatedFormIds = [...currentFormIds, formId];
        const newUrl = `${location.pathname}?${queryParams.toString().replace(
          /forms=[^&]*/,
          `forms=${updatedFormIds.join(',')}`
        )}`;
        window.history.replaceState({}, '', newUrl);
        
        toast({
          title: "Formulario agregado",
          description: `Se agregó "${result.form.title}" a la consulta`,
        });
      }
    }
  };

  const handleQuickLinkNavigate = (url: string) => {
    // Save current progress before navigating
    const completedFormsCount = forms.filter(f => f.completed).length;
    if (completedFormsCount > 0) {
      localStorage.setItem(`consultation_progress_${consultationId}`, JSON.stringify({
        patientId,
        consultationId,
        completedForms: forms.filter(f => f.completed).map(f => ({ id: f.id, title: f.title })),
        timestamp: new Date().toISOString()
      }));
    }
    
    navigate(url);
  };

  const handleFinishConsultation = () => {
    const completedFormsCount = forms.filter(f => f.completed).length;
    const formsWithQuestions = forms.filter(f => f.questions.length > 0);
    
    // If there are no forms with questions, allow finishing
    if (formsWithQuestions.length === 0) {
      toast({
        title: "Consulta finalizada",
        description: "No había formularios válidos que completar",
      });
      navigate(`/app/pacientes/${patientId}`);
      return;
    }
    
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

  if (forms.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <BackButton />
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No se encontraron formularios válidos</h2>
            <p className="text-gray-600 mb-4">
              Los formularios seleccionados no tienen preguntas configuradas o no existen
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/app/pacientes/nueva-consulta')}>
                Volver a nueva consulta
              </Button>
              <p className="text-sm text-muted-foreground">
                Puedes agregar formularios usando el botón "Agregar formulario" en el panel lateral
              </p>
            </div>
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

        {/* Forms navigation and content with patient history */}
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Compact forms sidebar */}
            <div className="w-80 border-r bg-muted/30 p-3 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Formularios de la consulta</h3>
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

              {/* Add more forms */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Agregar formularios</h3>
                <AdditionalFormsModal 
                  onAddForm={handleAddForm}
                  excludeFormIds={forms.map(f => f.id)}
                />
              </div>

              {/* Quick Links */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Vínculos rápidos</h3>
                <QuickLinksManager onNavigate={handleQuickLinkNavigate} />
              </div>

              {/* Compact navigation */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Navegación</h3>
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
                  disabled={forms.length > 0 && completedCount === 0}
                >
                  <Check size={14} className="mr-1" />
                  Finalizar
                </Button>
              </div>
            </div>

            {/* Current form content - Center column */}
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
                </div>
              )}
            </div>

            {/* Patient history panel - Right column */}
            {patientId && (
              <div className="w-80 border-l bg-muted/30">
                <PatientHistoryPanel patientId={patientId} className="h-full p-3" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MultiFormViewer;