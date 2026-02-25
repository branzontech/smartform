import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Form } from "./FormsPage";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormatDocumentView } from "@/components/forms/responses/format-document-view";
import { FormSummaryTabs } from "@/components/forms/responses/form-summary-tabs";
import { printFormResponse } from "@/utils/print-utils";
import { FormResponse } from "@/types/form-types";
import { supabase } from "@/integrations/supabase/client";

const FormResponses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [activeTab, setActiveTab] = useState<"summary" | "individual">("summary");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      // Load form metadata
      const { data: formRow, error: formErr } = await supabase
        .from("formularios")
        .select("*")
        .eq("id", id)
        .single();

      if (!formRow || formErr) {
        toast({ title: "Error", description: "El formulario no existe", variant: "destructive" });
        navigate("/");
        return;
      }

      setFormData({
        id: formRow.id,
        title: formRow.titulo,
        description: formRow.descripcion || "",
        questions: (formRow.preguntas as any[]) || [],
        createdAt: new Date(formRow.created_at),
        updatedAt: new Date(formRow.updated_at),
        responseCount: formRow.respuestas_count || 0,
        formType: (formRow.tipo as "forms" | "formato") || "forms",
      });

      // Load responses from respuestas_formularios
      const { data: respRows } = await supabase
        .from("respuestas_formularios" as any)
        .select("*")
        .eq("formulario_id", id)
        .order("fecha_registro", { ascending: false });

      const mapped: FormResponse[] = (respRows || []).map((r: any) => ({
        timestamp: r.fecha_registro,
        data: {
          ...r.datos_respuesta,
          _patientId: r.paciente_id,
          _consultationId: r.admision_id,
        },
      }));
      setResponses(mapped);
      setLoading(false);
    };
    load();
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
                formData.formType === "formato" || formData.formType === "historia_clinica" ? (
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
