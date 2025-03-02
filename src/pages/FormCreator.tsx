
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, FileText, PieChart, Palette } from "lucide-react";
import { nanoid } from "nanoid";
import { Header } from "@/components/layout/header";
import { FormTitle } from "@/components/ui/form-title";
import { Question } from "@/components/ui/question";
import { QuestionData, FormDesignOptions, defaultDesignOptions } from "@/components/forms/question/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Form } from "./Home";
import { BackButton } from "../App";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const defaultQuestion: Omit<QuestionData, "id"> = {
  type: "short",
  title: "",
  required: false,
};

// Predefined color schemes
const colorSchemes = [
  { name: "Default", primaryColor: "#0099ff", backgroundColor: "#ffffff", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Soothing Green", primaryColor: "#10b981", backgroundColor: "#f0fdf4", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Professional Blue", primaryColor: "#3b82f6", backgroundColor: "#f0f9ff", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Warm Orange", primaryColor: "#f97316", backgroundColor: "#fff7ed", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Elegant Purple", primaryColor: "#8b5cf6", backgroundColor: "#f5f3ff", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Medical Green", primaryColor: "#22c55e", backgroundColor: "#f0fdf4", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" }
];

const FormCreator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [activeTab, setActiveTab] = useState("content");
  const [title, setTitle] = useState("Nuevo formulario Smart Doctor");
  const [description, setDescription] = useState("Formulario para registro de datos clínicos");
  const [formType, setFormType] = useState<"forms" | "formato">("forms");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [designOptions, setDesignOptions] = useState<FormDesignOptions>(defaultDesignOptions);

  useEffect(() => {
    if (id) {
      // Cargar formulario existente
      const savedForms = localStorage.getItem("forms");
      if (savedForms) {
        try {
          const forms = JSON.parse(savedForms);
          const form = forms.find((f: Form) => f.id === id);
          
          if (form) {
            setTitle(form.title);
            setDescription(form.description);
            setFormType(form.formType || "forms");
            setQuestions(form.questions || []);
            // Cargar opciones de diseño si existen
            if (form.designOptions) {
              setDesignOptions(form.designOptions);
            }
            setLoading(false);
          } else {
            // Formulario no encontrado
            toast({
              title: "Error",
              description: "El formulario no existe",
              variant: "destructive",
            });
            navigate("/");
          }
        } catch (error) {
          console.error("Error parsing forms:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar el formulario",
            variant: "destructive",
          });
          navigate("/");
        }
      }
    } else {
      // En caso de nuevo formulario, no cargamos preguntas por defecto
      // Mantenemos el arreglo de preguntas vacío
      setQuestions([]);
    }
  }, [id, navigate, toast]);

  const toggleQuestionExpansion = (id: string) => {
    setExpandedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };

  const handleAddQuestion = () => {
    const newQuestionId = nanoid();
    const newQuestion = {
      id: newQuestionId,
      ...defaultQuestion,
      title: "Nueva pregunta",
    };
    
    setQuestions([...questions, newQuestion]);
    // Expandir automáticamente la nueva pregunta
    setExpandedQuestions(prev => [...prev, newQuestionId]);
  };

  const handleUpdateQuestion = (id: string, data: Partial<QuestionData>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...data } : q))
    );
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
      // Eliminar del arreglo de expandidos si estaba ahí
      setExpandedQuestions(prev => prev.filter(qId => qId !== id));
    } else {
      toast({
        title: "Error",
        description: "El formulario debe tener al menos una pregunta",
      });
    }
  };

  const handleMoveQuestionUp = (id: string) => {
    const index = questions.findIndex(q => q.id === id);
    if (index > 0) {
      const newQuestions = [...questions];
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
      setQuestions(newQuestions);
    }
  };

  const handleMoveQuestionDown = (id: string) => {
    const index = questions.findIndex(q => q.id === id);
    if (index < questions.length - 1) {
      const newQuestions = [...questions];
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
      setQuestions(newQuestions);
    }
  };

  const handleColorSchemeChange = (schemeName: string) => {
    const scheme = colorSchemes.find(s => s.name === schemeName);
    if (scheme) {
      setDesignOptions(prev => ({
        ...prev,
        primaryColor: scheme.primaryColor,
        backgroundColor: scheme.backgroundColor,
        questionBackgroundColor: scheme.questionBackgroundColor,
        questionTextColor: scheme.questionTextColor
      }));
    }
  };

  const handleDesignOptionChange = (option: keyof FormDesignOptions, value: string) => {
    setDesignOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const saveForm = async () => {
    setSaving(true);
    
    try {
      // Validar que el formulario tenga título
      if (!title.trim()) {
        toast({
          title: "Error",
          description: "El formulario debe tener un título",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      // Validar que todas las preguntas tengan título
      const invalidQuestions = questions.filter(q => !q.title.trim());
      if (invalidQuestions.length > 0) {
        toast({
          title: "Error",
          description: "Todas las preguntas deben tener un título",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      // Obtener formularios existentes
      const savedForms = localStorage.getItem("forms");
      let forms: Form[] = savedForms ? JSON.parse(savedForms) : [];
      
      const now = new Date();
      const formId = id || nanoid();
      
      if (id) {
        // Actualizar formulario existente
        forms = forms.map((form: Form) => {
          if (form.id === id) {
            return {
              ...form,
              title,
              description,
              questions,
              formType,
              designOptions,
              updatedAt: now
            };
          }
          return form;
        });
        
        toast({
          title: "Formulario actualizado",
          description: "Los cambios han sido guardados",
        });
      } else {
        // Crear nuevo formulario
        const newForm: Form = {
          id: formId,
          title,
          description,
          questions,
          formType,
          designOptions,
          createdAt: now,
          updatedAt: now,
          responseCount: 0
        };
        
        forms.unshift(newForm);
        toast({
          title: "Formulario creado",
          description: `Tu nuevo ${formType === "forms" ? "formulario" : "formato"} clínico está listo`,
        });
      }
      
      localStorage.setItem("forms", JSON.stringify(forms));
      
      // Redirigir a la página principal después de un breve retraso
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el formulario",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyDesignToPreview = () => {
    document.documentElement.style.setProperty('--form-primary', designOptions.primaryColor);
    return {
      backgroundColor: designOptions.backgroundColor,
      fontFamily: designOptions.fontFamily,
    };
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

  return (
    <div className="min-h-screen flex flex-col" style={applyDesignToPreview()}>
      <Header showCreate={false} />
      <main className="flex-1 container mx-auto py-6">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <div className="form-card overflow-visible mb-6" style={{backgroundColor: designOptions.backgroundColor}}>
            <FormTitle
              defaultTitle={title}
              defaultDescription={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-5 pb-5">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="design" className="flex items-center gap-1">
                  <Palette size={16} />
                  <span>Diseño</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="content">
                <div className="mt-4">
                  <label htmlFor="form-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de formulario
                  </label>
                  <Select
                    value={formType}
                    onValueChange={(value: "forms" | "formato") => setFormType(value)}
                  >
                    <SelectTrigger id="form-type" className="w-full max-w-xs">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forms" className="flex items-center">
                        <div className="flex items-center">
                          <PieChart size={16} className="mr-2 text-blue-600" />
                          <span>Forms (Para estadísticas)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="formato" className="flex items-center">
                        <div className="flex items-center">
                          <FileText size={16} className="mr-2 text-emerald-600" />
                          <span>Formato (Para documentos)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <p className="mt-2 text-sm text-gray-500">
                    {formType === "forms" 
                      ? "Ideal para recopilar datos y generar estadísticas de las respuestas."
                      : "Diseñado para crear documentos que se pueden visualizar e imprimir con formato organizado."}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="design" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Esquema de colores predefinidos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {colorSchemes.map((scheme) => (
                      <div 
                        key={scheme.name}
                        className="flex flex-col items-center p-3 border rounded-md cursor-pointer hover:shadow-md transition-shadow"
                        style={{
                          backgroundColor: scheme.backgroundColor,
                          borderColor: designOptions.primaryColor === scheme.primaryColor ? scheme.primaryColor : 'transparent',
                        }}
                        onClick={() => handleColorSchemeChange(scheme.name)}
                      >
                        <div 
                          className="w-8 h-8 mb-2 rounded-full" 
                          style={{ backgroundColor: scheme.primaryColor }}
                        ></div>
                        <span className="text-sm font-medium">{scheme.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Personalización</h3>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Color principal</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: designOptions.primaryColor }}
                        ></div>
                        <Input 
                          id="primaryColor"
                          type="color"
                          value={designOptions.primaryColor}
                          onChange={(e) => handleDesignOptionChange('primaryColor', e.target.value)}
                          className="w-12 h-8 p-0"
                        />
                        <Input 
                          type="text"
                          value={designOptions.primaryColor}
                          onChange={(e) => handleDesignOptionChange('primaryColor', e.target.value)}
                          className="w-28"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipografía</Label>
                      <Select
                        value={designOptions.fontFamily}
                        onValueChange={(value) => handleDesignOptionChange('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una tipografía" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter, system-ui, sans-serif">Inter (Moderna)</SelectItem>
                          <SelectItem value="'Playfair Display', serif">Playfair (Elegante)</SelectItem>
                          <SelectItem value="'Roboto', sans-serif">Roboto (Profesional)</SelectItem>
                          <SelectItem value="'Montserrat', sans-serif">Montserrat (Limpia)</SelectItem>
                          <SelectItem value="'Poppins', sans-serif">Poppins (Amigable)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Bordes</Label>
                      <Select
                        value={designOptions.borderRadius}
                        onValueChange={(value) => handleDesignOptionChange('borderRadius', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Estilo de bordes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Cuadrados</SelectItem>
                          <SelectItem value="sm">Ligeramente redondeados</SelectItem>
                          <SelectItem value="md">Redondeados</SelectItem>
                          <SelectItem value="lg">Muy redondeados</SelectItem>
                          <SelectItem value="xl">Completamente redondeados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Espaciado entre preguntas</Label>
                      <RadioGroup
                        value={designOptions.questionSpacing}
                        onValueChange={(value) => handleDesignOptionChange('questionSpacing', value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="compact" id="spacing-compact" />
                          <Label htmlFor="spacing-compact">Compacto</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="normal" id="spacing-normal" />
                          <Label htmlFor="spacing-normal">Normal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="spacious" id="spacing-spacious" />
                          <Label htmlFor="spacing-spacious">Espacioso</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estilo de botones</Label>
                      <Select
                        value={designOptions.buttonStyle}
                        onValueChange={(value) => handleDesignOptionChange('buttonStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Estilo de botones" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Estándar</SelectItem>
                          <SelectItem value="outline">Con borde</SelectItem>
                          <SelectItem value="rounded">Redondeados</SelectItem>
                          <SelectItem value="pill">Forma de píldora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-gray-500 italic">Los cambios se aplicarán automáticamente a la vista previa. Guarda el formulario para conservar estos cambios.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Lista de preguntas */}
          <div className="space-y-4 mb-8">
            {questions.map((question, index) => (
              <Question
                key={question.id}
                question={question}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                isExpanded={expandedQuestions.includes(question.id)}
                onToggleExpand={() => toggleQuestionExpansion(question.id)}
                onMoveUp={handleMoveQuestionUp}
                onMoveDown={handleMoveQuestionDown}
                isFirst={index === 0}
                isLast={index === questions.length - 1}
                designOptions={designOptions}
              />
            ))}
          </div>
          
          {/* Botón para añadir campos */}
          <div className="flex justify-center mb-8">
            <Button 
              onClick={handleAddQuestion}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 shadow-sm"
              variant="outline"
              size="lg"
              style={{
                backgroundColor: designOptions.questionBackgroundColor,
                color: designOptions.questionTextColor,
                borderColor: `${designOptions.primaryColor}30`,
              }}
            >
              <Plus size={20} className="mr-2" />
              Añadir campo clínico
            </Button>
          </div>
          
          <div className="sticky bottom-6 flex justify-end">
            <div className="glassmorphism px-6 py-4 rounded-full shadow-lg animate-slide-up">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="bg-white"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveForm}
                  className="bg-form-primary hover:bg-form-primary/90"
                  disabled={saving}
                  style={{
                    backgroundColor: designOptions.primaryColor,
                    borderColor: designOptions.primaryColor
                  }}
                >
                  {saving ? "Guardando..." : `Guardar ${formType === "forms" ? "formulario" : "formato"} médico`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormCreator;
