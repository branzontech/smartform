
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, FileText, PieChart } from "lucide-react";
import { nanoid } from "nanoid";
import { Header } from "@/components/layout/header";
import { FormTitle } from "@/components/ui/form-title";
import { Question, QuestionData } from "@/components/ui/question";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Form } from "./Home";
import { BackButton } from "../App";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultQuestion: Omit<QuestionData, "id"> = {
  type: "short",
  title: "",
  required: false,
};

const FormCreator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [title, setTitle] = useState("Nuevo formulario Smart Doctor");
  const [description, setDescription] = useState("Formulario para registro de datos clínicos");
  const [formType, setFormType] = useState<"forms" | "formato">("forms");
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);

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
    <div className="min-h-screen flex flex-col">
      <Header showCreate={false} />
      <main className="flex-1 container mx-auto py-6">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <div className="form-card overflow-visible mb-6">
            <FormTitle
              defaultTitle={title}
              defaultDescription={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />
            
            <div className="px-5 pb-5 pt-2">
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
            </div>
          </div>
          
          {/* Lista de preguntas */}
          <div className="space-y-4 mb-8">
            {questions.map((question) => (
              <Question
                key={question.id}
                question={question}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                isExpanded={expandedQuestions.includes(question.id)}
                onToggleExpand={() => toggleQuestionExpansion(question.id)}
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
