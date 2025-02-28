
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { FormCard } from "@/components/ui/form-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";

// Tipo de datos para formularios
export interface Form {
  id: string;
  title: string;
  description: string;
  questions: any[];
  createdAt: Date;
  updatedAt: Date;
  responseCount: number;
}

// Mock de datos iniciales
const mockForms: Form[] = [
  {
    id: "1",
    title: "Encuesta de satisfacción",
    description: "Encuesta para medir la satisfacción del cliente",
    questions: [],
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-06-20"),
    responseCount: 24
  },
  {
    id: "2",
    title: "Formulario de contacto",
    description: "Formulario para recopilar información de contacto",
    questions: [],
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-05-05"),
    responseCount: 12
  },
  {
    id: "3",
    title: "Evaluación de curso",
    description: "Formulario para evaluar la calidad del curso",
    questions: [],
    createdAt: new Date("2023-02-28"),
    updatedAt: new Date("2023-04-15"),
    responseCount: 8
  }
];

const Home = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      // Cargar datos del localStorage o usar mockForms
      const savedForms = localStorage.getItem("forms");
      if (savedForms) {
        try {
          const parsedForms = JSON.parse(savedForms).map((form: any) => ({
            ...form,
            createdAt: new Date(form.createdAt),
            updatedAt: new Date(form.updatedAt)
          }));
          setForms(parsedForms);
        } catch (error) {
          console.error("Error parsing forms:", error);
          setForms(mockForms);
        }
      } else {
        setForms(mockForms);
        // Guardar mockForms en localStorage
        localStorage.setItem("forms", JSON.stringify(mockForms));
      }
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleCreateForm = () => {
    navigate("/crear");
  };

  const handleEditForm = (id: string) => {
    navigate(`/editar/${id}`);
  };

  const handleViewForm = (id: string) => {
    navigate(`/ver/${id}`);
    
    // Copiar URL al portapapeles
    const url = `${window.location.origin}/ver/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Enlace copiado al portapapeles",
        description: "Ahora puedes compartir el formulario",
      });
    });
  };

  const handleViewResponses = (id: string) => {
    navigate(`/respuestas/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Tus formularios</h1>
        
        {forms.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No tienes formularios"
              description="Crea tu primer formulario para comenzar a recopilar respuestas."
              buttonText="Crear formulario"
              onClick={handleCreateForm}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <FormCard
                key={form.id}
                id={form.id}
                title={form.title}
                lastUpdated={form.updatedAt}
                responseCount={form.responseCount}
                onEdit={handleEditForm}
                onView={handleViewForm}
                onResponses={handleViewResponses}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
