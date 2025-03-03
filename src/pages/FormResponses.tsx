
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Form } from "./Home";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormatDocumentView } from "@/components/forms/responses/format-document-view";
import { FormSummaryTabs } from "@/components/forms/responses/form-summary-tabs";
import { printFormResponse } from "@/utils/print-utils";
import { getFormResponses } from "@/utils/form-utils";

interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[] | Record<string, any>;
  };
}

const FormResponses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [activeTab, setActiveTab] = useState<"summary" | "individual">("summary");

  useEffect(() => {
    // Cargar formulario y respuestas
    if (id) {
      setLoading(true);
      const savedForms = localStorage.getItem("forms");
      
      if (savedForms) {
        try {
          const forms = JSON.parse(savedForms);
          const form = forms.find((f: Form) => f.id === id);
          
          if (form) {
            setFormData({
              ...form,
              createdAt: new Date(form.createdAt),
              updatedAt: new Date(form.updatedAt)
            });
            
            // Usar la nueva función para obtener respuestas
            const formResponses = getFormResponses(id);
            console.log("Respuestas cargadas:", formResponses);
            setResponses(formResponses);
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
            description: "Error al cargar el formulario",
            variant: "destructive",
          });
        }
      }
      
      setLoading(false);
    }
  }, [id, navigate, toast]);

  const handlePrintFormat = (response: FormResponse, index: number) => {
    if (!formData) return;
    printFormResponse(formData, response, index);
  };

  const handleShareForm = () => {
    if (!id) return;
    
    const url = `${window.location.origin}/ver/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Enlace copiado al portapapeles",
        description: "Ahora puedes compartir el formulario",
      });
    });
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
          {formData && (
            <div className="mb-8">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                ← Volver
              </Button>
              
              <h1 className="text-2xl font-bold mb-2">{formData.title}</h1>
              <div className="text-gray-500 mb-4">
                {responses.length} respuesta{responses.length !== 1 ? 's' : ''} totales
              </div>
              
              {responses.length > 0 ? (
                formData.formType === "formato" ? (
                  <FormatDocumentView 
                    formData={formData}
                    responses={responses}
                    onPrint={handlePrintFormat}
                  />
                ) : (
                  <FormSummaryTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    formData={formData}
                    responses={responses}
                    onPrint={handlePrintFormat}
                  />
                )
              ) : (
                <EmptyState
                  title="No hay respuestas"
                  description="Este formulario aún no tiene respuestas. Comparte el enlace para empezar a recibir datos."
                  buttonText="Compartir formulario"
                  onClick={handleShareForm}
                  icon={<BarChart size={48} className="text-gray-300" />}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FormResponses;
