
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { Header } from "@/components/layout/header";
import { FormTitle } from "@/components/ui/form-title";
import { Question, QuestionData } from "@/components/ui/question";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Form } from "./Home";

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
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [saving, setSaving] = useState(false);

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
      // Crear nuevo formulario con preguntas iniciales clínicas
      setQuestions([
        {
          id: nanoid(),
          ...defaultQuestion,
          title: "Nombre del paciente",
          type: "short",
          required: true,
        },
        {
          id: nanoid(),
          ...defaultQuestion,
          title: "Presión arterial",
          type: "vitals",
          required: true,
          min: 80,
          max: 180,
          units: "mmHg",
        },
        {
          id: nanoid(),
          ...defaultQuestion,
          title: "Índice de Masa Corporal (IMC)",
          type: "calculation",
          formula: "[Peso] / ([Altura] * [Altura])",
        },
      ]);
    }
  }, [id, navigate, toast]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: nanoid(),
        ...defaultQuestion,
      },
    ]);
  };

  const handleUpdateQuestion = (id: string, data: Partial<QuestionData>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...data } : q))
    );
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
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
          createdAt: now,
          updatedAt: now,
          responseCount: 0
        };
        
        forms.unshift(newForm);
        toast({
          title: "Formulario creado",
          description: "Tu nuevo formulario clínico está listo",
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
          <div className="mb-6 form-card overflow-visible">
            <FormTitle
              defaultTitle={title}
              defaultDescription={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />
          </div>
          
          <div className="space-y-4 mb-8">
            {questions.map((question) => (
              <Question
                key={question.id}
                question={question}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
              />
            ))}
          </div>
          
          <div className="flex items-center mb-8">
            <Button 
              onClick={handleAddQuestion}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
              variant="outline"
            >
              <Plus size={16} className="mr-2" />
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
                  {saving ? "Guardando..." : "Guardar formulario médico"}
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
