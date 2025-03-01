import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form } from "./Home";
import { Header } from "@/components/layout/header";
import { FormTitle } from "@/components/ui/form-title";
import { Question, QuestionData } from "@/components/ui/question";
import { Button } from "@/components/ui/button";
import { BackButton } from "../App";
import { useToast } from "@/hooks/use-toast";
import { Diagnosis } from "@/components/ui/question-types";
import { Search } from "lucide-react";
import { SignaturePad } from "@/components/ui/signature-pad";

interface FormResponse {
  [key: string]: string | string[] | Diagnosis[] | { sys: string; dia: string } | { peso: string; altura: string; imc: string };
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
  const [searchTerms, setSearchTerms] = useState<{[key: string]: string}>({});

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

  const handleInputChange = (questionId: string, value: string | string[] | Diagnosis[] | { sys: string; dia: string } | { peso: string; altura: string; imc: string }) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };

  const handleSearchChange = (questionId: string, term: string) => {
    setSearchTerms({
      ...searchTerms,
      [questionId]: term
    });
  };

  // Función para calcular IMC
  const calculateBMI = (weight: number, height: number): string => {
    if (weight <= 0 || height <= 0) return "";
    // Convertir altura de cm a metros
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(2);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData) return false;
    
    formData.questions.forEach(question => {
      if (question.required) {
        const response = responses[question.id];
        if (!response || 
            (Array.isArray(response) && response.length === 0) || 
            (typeof response === 'string' && response.trim() === '') ||
            (typeof response === 'object' && !Array.isArray(response) && 
              ((('sys' in response) && (response.sys === '' || ('dia' in response) && response.dia === '')) ||
               (('peso' in response) && (response.peso === '' || ('altura' in response) && response.altura === ''))))) {
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
      
      case 'calculation':
        return (
          <div>
            <p className="text-sm text-gray-500 mb-2">Campo calculable: {question.formula}</p>
            <input 
              type="number" 
              disabled 
              className="w-full border border-gray-300 rounded-md p-2 bg-gray-50"
              placeholder="Valor calculado"
            />
          </div>
        );
      
      case 'vitals':
        if (question.vitalType === "TA") {
          const bpValues = (responses[question.id] as { sys: string; dia: string }) || { sys: "", dia: "" };
          
          return (
            <div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Tensión Arterial (T/A): {question.sysMin || 90}-{question.sysMax || 140}/{question.diaMin || 60}-{question.diaMax || 90} {question.units || "mmHg"}</span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={bpValues.sys}
                  onChange={(e) => handleInputChange(question.id, { ...bpValues, sys: e.target.value })}
                  placeholder="Sistólica"
                  className={`w-1/2 border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-transparent focus:outline-none focus:border-form-primary`}
                />
                <span className="text-lg">/</span>
                <input
                  type="number"
                  value={bpValues.dia}
                  onChange={(e) => handleInputChange(question.id, { ...bpValues, dia: e.target.value })}
                  placeholder="Diastólica"
                  className={`w-1/2 border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-transparent focus:outline-none focus:border-form-primary`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Formato: sistólica/diastólica (ej: 120/80)</p>
            </div>
          );
        } else if (question.vitalType === "IMC") {
          const imcValues = (responses[question.id] as { peso: string; altura: string; imc: string }) || { 
            peso: "", 
            altura: "", 
            imc: "" 
          };
          
          // Calcular IMC automáticamente si peso y altura están presentes
          const altura = parseFloat(imcValues.altura);
          const peso = parseFloat(imcValues.peso);
          
          if (!isNaN(altura) && !isNaN(peso) && altura > 0 && peso > 0) {
            imcValues.imc = calculateBMI(peso, altura);
          } else {
            imcValues.imc = "";
          }
          
          return (
            <div>
              <p className="text-sm text-gray-500 mb-2">Índice de Masa Corporal (IMC)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Peso (kg)</label>
                  <input
                    type="number"
                    value={imcValues.peso}
                    onChange={(e) => handleInputChange(question.id, { ...imcValues, peso: e.target.value })}
                    className={`w-full border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-transparent focus:outline-none focus:border-form-primary`}
                    placeholder="Peso"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Altura (cm)</label>
                  <input
                    type="number"
                    value={imcValues.altura}
                    onChange={(e) => handleInputChange(question.id, { ...imcValues, altura: e.target.value })}
                    className={`w-full border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-transparent focus:outline-none focus:border-form-primary`}
                    placeholder="Altura"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">IMC (kg/m²)</label>
                  <input
                    type="text"
                    value={imcValues.imc}
                    disabled
                    className="w-full border border-gray-300 rounded-md p-2 bg-gray-50"
                    placeholder="IMC"
                  />
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Rango: {question.min || 0} - {question.max || 100} {question.units || ''}</span>
              </div>
              <input
                type="number"
                id={`q-${question.id}`}
                value={(responses[question.id] as string) || ''}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                className={`w-full border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-transparent focus:outline-none focus:border-form-primary`}
                placeholder={`Valor (${question.units || ''})`}
              />
            </div>
          );
        }
      
      case 'diagnosis':
        // Obtenemos los diagnósticos predefinidos
        const predefinedDiagnoses: Diagnosis[] = [
          { id: "1", code: "E11", name: "Diabetes tipo 2" },
          { id: "2", code: "I10", name: "Hipertensión esencial (primaria)" },
          { id: "3", code: "J45", name: "Asma" },
          { id: "4", code: "K29.7", name: "Gastritis, no especificada" },
          { id: "5", code: "M54.5", name: "Dolor lumbar" },
          { id: "6", code: "G43", name: "Migraña" },
          { id: "7", code: "F41.1", name: "Trastorno de ansiedad generalizada" },
          { id: "8", code: "F32", name: "Episodio depresivo" },
          { id: "9", code: "J03", name: "Amigdalitis aguda" },
          { id: "10", code: "B01", name: "Varicela" },
          { id: "11", code: "A09", name: "Diarrea y gastroenteritis de presunto origen infeccioso" },
          { id: "12", code: "N39.0", name: "Infección de vías urinarias, sitio no especificado" },
          { id: "13", code: "H10", name: "Conjuntivitis" },
          { id: "14", code: "J01", name: "Sinusitis aguda" },
          { id: "15", code: "L20", name: "Dermatitis atópica" }
        ];

        const searchTerm = searchTerms[question.id] || '';
        const selectedDiagnoses = (responses[question.id] as Diagnosis[]) || [];
        
        const filteredDiagnoses = predefinedDiagnoses.filter(
          (diagnosis) => 
            diagnosis.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            diagnosis.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <div className="border border-gray-300 rounded-md p-3">
            {/* Buscador de diagnósticos */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className={`block w-full pl-10 pr-3 py-2 border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-form-primary focus:border-form-primary`}
                placeholder="Buscar diagnóstico por código o nombre"
                value={searchTerm}
                onChange={(e) => handleSearchChange(question.id, e.target.value)}
              />
            </div>

            {/* Diagnósticos seleccionados */}
            {selectedDiagnoses.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Diagnósticos seleccionados:</h4>
                <div className="space-y-2">
                  {selectedDiagnoses.map(diagnosis => (
                    <div 
                      key={diagnosis.id} 
                      className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md"
                    >
                      <div>
                        <span className="font-medium text-blue-700">{diagnosis.code}</span>
                        <span className="mx-2">-</span>
                        <span>{diagnosis.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newSelected = selectedDiagnoses.filter(d => d.id !== diagnosis.id);
                          handleInputChange(question.id, newSelected);
                        }}
                        className="text-gray-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de diagnósticos filtrados */}
            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {filteredDiagnoses.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredDiagnoses.map(diagnosis => {
                    const isSelected = selectedDiagnoses.some(d => d.id === diagnosis.id);
                    if (isSelected) return null;
                    
                    return (
                      <li 
                        key={diagnosis.id}
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          const newSelected = [...selectedDiagnoses, diagnosis];
                          handleInputChange(question.id, newSelected);
                          // Limpiar búsqueda después de seleccionar
                          handleSearchChange(question.id, '');
                        }}
                      >
                        <div>
                          <span className="font-medium">{diagnosis.code}</span>
                          <span className="mx-2">-</span>
                          <span>{diagnosis.name}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? "No se encontraron diagnósticos" : "Busque y seleccione diagnósticos"}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'clinical':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Datos clínicos principales"
              value={(responses[question.id] as string) || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`w-full border ${isError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 bg-transparent focus:outline-none focus:border-form-primary`}
            />
          </div>
        );
      
    case 'signature':
      return (
        <div>
          <p className="text-sm text-gray-500 mb-2">Dibuje su firma con el dedo o un lápiz óptico</p>
          <SignaturePad
            value={(responses[question.id] as string) || ''}
            onChange={(value) => handleInputChange(question.id, value)}
            className={isError ? 'border-red-500' : ''}
          />
        </div>
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
