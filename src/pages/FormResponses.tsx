import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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

      // Load responses (incluye anuladas/superseded para preservar contexto clínico)
      const { data: respRows } = await supabase
        .from("respuestas_formularios")
        .select("*")
        .eq("formulario_id", id)
        .order("fecha_registro", { ascending: false });

      const respRowsArr = (respRows ?? []) as any[];
      const recordIds = respRowsArr.map((r) => r.id);

      // Cargar último provenance por registro (para mostrar "anulado por X el Y")
      const provByRecord: Record<
        string,
        { activityType: any; agentNombreCompleto: string; recordedAt: string }
      > = {};
      if (recordIds.length > 0) {
        const { data: provRows } = await supabase
          .from("provenance_clinico")
          .select(
            "target_record_id, activity_type, agent_nombre_completo, recorded_at"
          )
          .eq("target_table", "respuestas_formularios")
          .in("target_record_id", recordIds)
          .order("recorded_at", { ascending: false });

        for (const p of (provRows ?? []) as any[]) {
          if (!provByRecord[p.target_record_id]) {
            provByRecord[p.target_record_id] = {
              activityType: p.activity_type,
              agentNombreCompleto: p.agent_nombre_completo,
              recordedAt: p.recorded_at,
            };
          }
        }
      }

      const mapped: FormResponse[] = respRowsArr.map((r) => ({
        timestamp: r.fecha_registro,
        recordId: r.id,
        estadoRegistro: r.estado_registro ?? "active",
        supersedes: r.supersedes ?? null,
        supersededBy: r.superseded_by ?? null,
        lastCorrection: provByRecord[r.id] ?? null,
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
  }, [id, navigate, toast, reloadKey]);

  const responsesById = useMemo(() => {
    const map: Record<string, { index: number }> = {};
    responses.forEach((r, idx) => {
      if (r.recordId) map[r.recordId] = { index: idx };
    });
    return map;
  }, [responses]);

  const visibleResponses = useMemo(
    () =>
      showOnlyActive
        ? responses.filter((r) => (r.estadoRegistro ?? "active") === "active")
        : responses,
    [responses, showOnlyActive]
  );

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

  const handleCorrectionSuccess = () => {
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showCreate={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-6 w-full max-w-3xl px-4">
            <div className="h-12 bg-muted rounded-md w-3/4"></div>
            <div className="h-8 bg-muted rounded-md w-1/2"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-muted rounded-md"></div>
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
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="text-muted-foreground text-sm">
                  {responses.length} respuesta{responses.length !== 1 ? "s" : ""} totales
                  {responses.length !== visibleResponses.length && (
                    <span className="ml-2 text-xs">
                      ({visibleResponses.length} mostradas)
                    </span>
                  )}
                </div>
                {responses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="only-active"
                      checked={showOnlyActive}
                      onCheckedChange={setShowOnlyActive}
                    />
                    <Label
                      htmlFor="only-active"
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Mostrar solo activos
                    </Label>
                  </div>
                )}
              </div>
              
              {visibleResponses.length > 0 ? (
                formData.formType === "formato" || formData.formType === "historia_clinica" ? (
                  <FormatDocumentView 
                    formData={formData}
                    responses={visibleResponses}
                    onPrint={handlePrintFormat}
                    responsesById={responsesById}
                    onCorrectionSuccess={handleCorrectionSuccess}
                  />
                ) : (
                  <FormSummaryTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    formData={formData}
                    responses={visibleResponses}
                    onPrint={handlePrintFormat}
                    responsesById={responsesById}
                    onCorrectionSuccess={handleCorrectionSuccess}
                  />
                )
              ) : (
                <EmptyState
                  title="No hay respuestas"
                  description="Este formulario aún no tiene respuestas. Comparte el enlace para empezar a recibir datos."
                  buttonText="Compartir formulario"
                  onClick={handleShareForm}
                  icon={<BarChart size={48} className="text-muted-foreground/40" />}
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
