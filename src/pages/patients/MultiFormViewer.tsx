import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Check, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchFormById } from '@/utils/form-utils';
import { Form as FormType } from '../Home';

interface FormWithStatus {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  formData: FormType | null;
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
            formData: result.form
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

  const handleFormComplete = (formId: string) => {
    setForms(prev => prev.map(form => 
      form.id === formId ? { ...form, completed: true } : form
    ));
    
    toast({
      title: "Formulario completado",
      description: "El formulario se ha guardado correctamente",
    });

    // Automatically move to next form if available
    const currentForm = forms.find(f => f.id === formId);
    const currentIndex = forms.findIndex(f => f.id === formId);
    
    if (currentIndex < forms.length - 1) {
      setCurrentFormIndex(currentIndex + 1);
    }
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

    navigate(`/pacientes/${patientId}`);
  };

  const completedCount = forms.filter(f => f.completed).length;
  const progressPercentage = forms.length > 0 ? (completedCount / forms.length) * 100 : 0;

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
        {/* Header with progress */}
        <div className="bg-white border-b p-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <BackButton />
              <div className="flex-1">
                <h1 className="text-xl font-bold">Consulta Médica - Formularios Múltiples</h1>
                <p className="text-sm text-muted-foreground">
                  Completando {forms.length} formularios para la consulta
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso general</span>
                <span>{completedCount} de {forms.length} completados</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
          </div>
        </div>

        {/* Forms navigation and content */}
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Forms list sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Formularios de la consulta</CardTitle>
                  <CardDescription>
                    Haga clic en un formulario para acceder
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {forms.map((form, index) => (
                    <div
                      key={form.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        currentFormIndex === index 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentFormIndex(index)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                          form.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : currentFormIndex === index
                              ? 'border-purple-500 text-purple-500'
                              : 'border-gray-300 text-gray-500'
                        }`}>
                          {form.completed ? <Check size={14} /> : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{form.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {form.completed ? 'Completado' : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentFormIndex(Math.max(0, currentFormIndex - 1))}
                  disabled={currentFormIndex === 0}
                >
                  <ChevronLeft size={16} className="mr-2" />
                  Formulario anterior
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentFormIndex(Math.min(forms.length - 1, currentFormIndex + 1))}
                  disabled={currentFormIndex === forms.length - 1}
                >
                  Siguiente formulario
                  <ChevronRight size={16} className="ml-2" />
                </Button>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleFinishConsultation}
                  disabled={completedCount === 0}
                >
                  Finalizar consulta
                  <Check size={16} className="ml-2" />
                </Button>
              </div>
            </div>

            {/* Current form content */}
            <div className="lg:col-span-3">
              {forms[currentFormIndex] && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {forms[currentFormIndex].title}
                          {forms[currentFormIndex].completed && (
                            <Check size={16} className="text-green-500" />
                          )}
                        </CardTitle>
                        <CardDescription>{forms[currentFormIndex].description}</CardDescription>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        Formulario {currentFormIndex + 1} de {forms.length}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Embed the form viewer component */}
                    <div className="min-h-96">
                      <iframe
                        src={`/app/ver/${forms[currentFormIndex].id}?patientId=${patientId}&consultationId=${consultationId}&embedded=true`}
                        className="w-full h-96 border rounded-lg"
                        title={forms[currentFormIndex].title}
                        onLoad={() => {
                          // Listen for form completion messages from iframe
                          window.addEventListener('message', (event) => {
                            if (event.data.type === 'formCompleted' && event.data.formId === forms[currentFormIndex].id) {
                              handleFormComplete(forms[currentFormIndex].id);
                            }
                          });
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MultiFormViewer;