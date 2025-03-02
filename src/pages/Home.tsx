
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { FormCard } from "@/components/ui/form-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();

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
  };

  const handleViewResponses = (id: string) => {
    navigate(`/respuestas/${id}`);
  };

  const handleDeleteForm = (id: string) => {
    setFormToDelete(id);
  };

  const confirmDeleteForm = () => {
    if (formToDelete) {
      const updatedForms = forms.filter(form => form.id !== formToDelete);
      setForms(updatedForms);
      localStorage.setItem("forms", JSON.stringify(updatedForms));
      
      toast("Formulario eliminado", {
        description: "El formulario ha sido eliminado exitosamente",
      });
      
      setFormToDelete(null);
    }
  };

  const cancelDeleteForm = () => {
    setFormToDelete(null);
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
                onDelete={handleDeleteForm}
              />
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este formulario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no puede deshacerse. El formulario será eliminado permanentemente, 
              incluso si tiene respuestas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteForm}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteForm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;
