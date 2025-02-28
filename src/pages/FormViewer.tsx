
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form } from "./Home";
import { Header } from "@/components/layout/header";
import { FormTitle } from "@/components/ui/form-title";
import { Question, QuestionData } from "@/components/ui/question";
import { Button } from "@/components/ui/button";
import { BackButton } from "../App";
import { useToast } from "@/hooks/use-toast";

interface FormResponse {
  [key: string]: string | string[];
}

interface SubmitOptions {
  method: "GET" | "POST";
  action?: string;
  custom?: boolean;
}

const FormViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Cargar formulario
    const savedForms = localStorage.getItem("forms");
    if (savedForms && id) {
      try {
        const forms = JSON.parse(savedForms);
        const form = forms.find((f: Form) => f.id === id);
        
        if (form) {
          setFormData({
            ...form,
            createdAt: new Date(form.createdAt),
            updatedAt: new Date(form.updatedAt)
          });
        } else {
          toast({
            title: "Error",
            description: "El formulario no existe",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Error loading form:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el formulario",
          variant: "destructive",
        });
        navigate("/");
      }
    } else {
      toast({
        title: "Error",
        description: "El formulario no existe",
        variant: "destructive",
      });
      navigate("/");
    }
    
    setLoading(false);
  }, [id, navigate, toast]);

  const handleInputChange = (questionId: string, value: string | string[]) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData) return false;
    
    formData.questions.forEach(question => {
      if (question.required) {
        const response = responses[question.id];
        if (!response || 
            (Array.isArray(response) && response.length === 0) || 
            (typeof response === 'string' && response.trim() === '')) {
          errors.push(question.id);
        }
      }
    });
    
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Simular envío de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar contador de respuestas
      if (formData && id) {
        const savedForms = localStorage.getItem("forms");
        if (savedForms) {
          const forms = JSON.parse(savedForms);
          const updatedForms = forms.map((form: Form) => {
            if (form.id === id) {
              return {
                ...form,
                responseCount: form.responseCount + 1
              };
            }
            return form;
          });
          
          localStorage.setItem("forms", JSON.stringify(updatedForms));
        }
      }
      
      // Guardar respuesta
      const formResponses = localStorage.getItem(`formResponses_${id}`) || "[]";
      const existingResponses = JSON.parse(formResponses);
      existingResponses.push({
        timestamp: new Date(),
        data: responses
      });
      localStorage.setItem(`formResponses_${id}`, JSON.stringify(existingResponses));
      
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el formulario",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: QuestionData) => {
    const isError = formErrors.includes(question.id);
    
    switch (question.type) {
      case 'short':
        return (
          <input
            type="text"
            id={`q-${question.id}`}
            value={(responses[question.id] as string) || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={`w-full border-b ${isError ? 'border-red-500' : 'border-gray-300'} py-1 px-0 bg-transparent focus:outline-none focus:border-form-primary`}
            placeholder="Tu respuesta"
          />
        );
      
      case 'paragraph':
        return (
          <textarea
            id={`q-${question.id}`}
            value={(responses[question.id] as string) || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={`w-full border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-transparent focus:outline-none focus:border-form-primary`}
            rows={3}
            placeholder="Tu respuesta"
          />
        );
      
      case 'multiple':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  id={`q-${question.id}-${index}`}
                  value={option}
                  checked={(responses[question.id] as string) === option}
                  onChange={() => handleInputChange(question.id, option)}
                  className={`text-form-primary focus:ring-form-primary ${isError ? 'border-red-500' : ''}`}
                />
                <label htmlFor={`q-${question.id}-${index}`}>{option}</label>
              </div>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => {
              const selected = (responses[question.id] as string[]) || [];
              const isChecked = selected.includes(option);
              
              const handleCheckboxChange = () => {
                const currentSelections = [...(responses[question.id] as string[] || [])];
                
                if (isChecked) {
                  const filtered = currentSelections.filter(item => item !== option);
                  handleInputChange(question.id, filtered);
                } else {
                  handleInputChange(question.id, [...currentSelections, option]);
                }
              };
              
              return (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q-${question.id}-${index}`}
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    className={`text-form-primary focus:ring-form-primary ${isError ? 'border-red-500' : ''}`}
                  />
                  <label htmlFor={`q-${question.id}-${index}`}>{option}</label>
                </div>
              );
            })}
          </div>
        );
      
      case 'dropdown':
        return (
          <select
            id={`q-${question.id}`}
            value={(responses[question.id] as string) || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={`w-full border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-transparent focus:outline-none focus:border-form-primary`}
          >
            <option value="" disabled>Seleccionar</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showCreate={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-6 w-full max-w-3xl px-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showCreate={false} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center animate-scale-in">
            <div className="mb-6 text-form-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Respuesta enviada</h1>
            <p className="text-gray-600 mb-8">
              Gracias por completar este formulario. Tu respuesta ha sido registrada.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => navigate("/")}
                variant="outline"
              >
                Volver al inicio
              </Button>
              <Button 
                onClick={() => {
                  setSubmitted(false);
                  setResponses({});
                }}
                className="bg-form-primary hover:bg-form-primary/90"
              >
                Enviar otra respuesta
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showCreate={false} />
      <main className="flex-1 container mx-auto py-6">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <form onSubmit={handleSubmit}>
            {formData && (
              <>
                <div className="mb-6 form-card overflow-visible">
                  <FormTitle
                    defaultTitle={formData.title}
                    defaultDescription={formData.description}
                    readOnly
                  />
                </div>
                
                <div className="space-y-4 mb-8">
                  {formData.questions.map((question) => (
                    <div key={question.id} className="question-card">
                      <h3 className="text-lg font-medium mb-4">{question.title}</h3>
                      {renderQuestionInput(question)}
                      {question.required && (
                        <div className="mt-2 text-sm text-red-500">* Requerido</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="sticky bottom-6 flex justify-end">
                  <div className="glassmorphism px-6 py-4 rounded-full shadow-lg animate-slide-up">
                    <Button
                      type="submit"
                      className="bg-form-primary hover:bg-form-primary/90"
                      disabled={submitting}
                    >
                      {submitting ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default FormViewer;
