import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ArrowRight, FileText, History, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/pages/FormsPage";
import { FormResponse, FormComplexValue } from "@/types/form-types";
import {
  CorrectionTriggerButton,
  HistorialCorreccionesDialog,
  DiffHighlightForm,
  type DiffEditableField,
} from "@/components/correcciones";
import { cn } from "@/lib/utils";

interface IndividualResponseProps {
  response: FormResponse;
  index: number;
  formData: Form;
  onPrint: (response: FormResponse, index: number) => void;
  /** Mapa global por id de respuesta para poder navegar entre originales y reemplazos */
  responsesById?: Record<string, { index: number }>;
  patientLabel?: string;
  doctorLabel?: string;
  onCorrectionSuccess?: () => void;
}

export const IndividualResponse = ({
  response,
  index,
  formData,
  onPrint,
  responsesById,
  patientLabel,
  doctorLabel,
  onCorrectionSuccess,
}: IndividualResponseProps) => {
  const [historialOpen, setHistorialOpen] = useState(false);

  const estado = response.estadoRegistro ?? "active";
  const isAnulado = estado === "entered-in-error";
  const isSuperseded = estado === "superseded";
  const isReemplazo = !!response.supersedes;

  const renderAnswer = (question: any, answer: any) => {
    if (!answer) {
      return <span className="text-muted-foreground italic">Sin respuesta</span>;
    }
    switch (question.type) {
      case "checkbox":
        return Array.isArray(answer) ? answer.join(", ") : String(answer);
      case "vitals":
        if (question.vitalType === "TA" && typeof answer === "object" && !Array.isArray(answer)) {
          const v = answer as FormComplexValue;
          return `${v.sys}/${v.dia} mmHg`;
        } else if (question.vitalType === "IMC" && typeof answer === "object" && !Array.isArray(answer)) {
          const v = answer as FormComplexValue;
          return `Peso: ${v.weight} kg, Altura: ${v.height} cm, IMC: ${v.bmi}`;
        }
        return String(answer);
      case "clinical":
        if (typeof answer === "object" && !Array.isArray(answer)) {
          const v = answer as FormComplexValue;
          return (
            <div>
              <div className="font-medium">{v.title}</div>
              <div className="text-sm text-muted-foreground">{v.detail}</div>
            </div>
          );
        }
        return String(answer);
      case "multifield":
        if (typeof answer === "object" && !Array.isArray(answer)) {
          return (
            <div className="space-y-1">
              {Object.entries(answer).map(([key, value]) => {
                const fieldLabel =
                  question.multifields?.find((f: any) => f.id === key)?.label ?? key;
                return (
                  <div key={key} className="flex">
                    <span className="text-sm text-muted-foreground mr-2">
                      {fieldLabel}:
                    </span>
                    <span>{String(value)}</span>
                  </div>
                );
              })}
            </div>
          );
        }
        return String(answer);
      case "file":
        if (typeof answer === "object" && !Array.isArray(answer)) {
          const f = answer as FormComplexValue;
          if (f.name) {
            return (
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                <span>{f.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({((f.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            );
          }
        }
        return <span className="text-muted-foreground italic">Archivo no disponible</span>;
      case "signature":
        if (answer && typeof answer === "string" && answer.startsWith("data:image")) {
          return (
            <div className="max-w-xs">
              <img src={answer} alt="Firma" className="border rounded" />
            </div>
          );
        }
        return <span className="text-muted-foreground italic">Sin firma</span>;
      case "scored_checkbox": {
        if (!answer || typeof answer !== "object")
          return <span className="text-muted-foreground italic">Sin respuesta</span>;
        const scoredVal = answer as any;
        const selectedIds: string[] = scoredVal.selectedOptions || [];
        const items = question.scoredItems || [];
        if (selectedIds.length === 0)
          return <span className="text-muted-foreground italic">Sin respuesta</span>;
        return (
          <div className="space-y-1">
            {selectedIds.map((optId: string) => {
              const item = items.find((si: any) => si.id === optId);
              return (
                <div key={optId} className="flex items-center gap-2">
                  <span>{item ? `${item.text} (${item.score} pts)` : optId}</span>
                </div>
              );
            })}
            <div className="text-sm font-medium text-muted-foreground">
              Puntaje: {scoredVal.score ?? 0}
            </div>
          </div>
        );
      }
      case "score_total": {
        if (!answer || typeof answer !== "object") {
          if (answer !== undefined && answer !== null) return String(answer);
          return <span className="text-muted-foreground italic">Sin respuesta</span>;
        }
        const totalVal = answer as any;
        return (
          <div>
            <span className="font-semibold">
              {totalVal.score ?? totalVal.total ?? 0} puntos
            </span>
            {totalVal.label && (
              <span className="text-sm text-muted-foreground ml-2">
                {totalVal.label}
              </span>
            )}
          </div>
        );
      }
      default:
        return Array.isArray(answer) ? answer.join(", ") : String(answer);
    }
  };

  // Construye previewData para el dialog de corrección
  const previewData = (() => {
    const items: { label: string; value: string }[] = [];
    if (patientLabel) items.push({ label: "Paciente", value: patientLabel });
    items.push({ label: "Formulario", value: formData.title });
    items.push({
      label: "Fecha",
      value: format(new Date(response.timestamp), "d MMM yyyy, HH:mm", {
        locale: es,
      }),
    });
    if (doctorLabel) items.push({ label: "Médico", value: doctorLabel });
    // 2-3 primeras respuestas no-meta
    const dataKeys = Object.keys(response.data ?? {}).filter(
      (k) => !k.startsWith("_")
    );
    for (const k of dataKeys.slice(0, 3)) {
      const q = formData.questions.find((qq: any) => qq.id === k);
      const v = (response.data as any)[k];
      if (v == null) continue;
      const vStr = typeof v === "object" ? JSON.stringify(v).slice(0, 80) : String(v);
      items.push({
        label: (q?.title as string) ?? k,
        value: vStr.length > 80 ? `${vStr.slice(0, 80)}…` : vStr,
      });
    }
    return items;
  })();

  // editableFields para DiffHighlightForm: respuestas no-meta del formulario
  const editableFields: DiffEditableField[] = formData.questions
    .filter((q: any) =>
      ["short-text", "paragraph", "shortText", "text", "textarea", "number", "date"].includes(
        q.type
      )
    )
    .map((q: any) => {
      let type: DiffEditableField["type"] = "text";
      if (q.type === "paragraph" || q.type === "textarea") type = "textarea";
      else if (q.type === "number") type = "number";
      else if (q.type === "date") type = "date";
      return { key: q.id, label: q.title ?? q.id, type };
    });

  // Para el DiffHighlightForm, la "originalData" son las respuestas
  const originalData = response.data as Record<string, unknown>;

  const renderReplacementForm = (
    onChange: (data: Record<string, unknown>) => void
  ) => (
    <DiffHighlightForm
      originalData={originalData}
      editableFields={editableFields}
      onChange={(diff) => {
        // Re-empaquetamos como datos_respuesta merged
        onChange({ datos_respuesta: { ...originalData, ...diff } });
      }}
    />
  );

  const handleNavigateTo = (recordId: string) => {
    const el = document.getElementById(`registro-${recordId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
    window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
    }, 2000);
  };

  const supersededByIndex =
    response.supersededBy && responsesById?.[response.supersededBy]?.index;
  const supersedesIndex =
    response.supersedes && responsesById?.[response.supersedes]?.index;

  return (
    <div
      id={response.recordId ? `registro-${response.recordId}` : undefined}
      className={cn(
        "bg-card rounded-lg shadow-sm border p-6 animate-scale-in transition-all",
        (isAnulado || isSuperseded) && "opacity-60"
      )}
    >
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4 pb-2 border-b">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={cn(
              "text-lg font-medium",
              (isAnulado || isSuperseded) && "line-through"
            )}
          >
            Respuesta {index + 1}
          </h3>
          {isAnulado && (
            <Badge
              variant="outline"
              className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40"
            >
              Anulado
            </Badge>
          )}
          {isSuperseded && (
            <Badge
              variant="outline"
              className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40"
            >
              Reemplazado
            </Badge>
          )}
          {isReemplazo && (
            <Badge
              variant="outline"
              className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40"
            >
              Corrección
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {format(
              new Date(response.timestamp),
              "d 'de' MMMM 'de' yyyy, HH:mm",
              { locale: es }
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPrint(response, index)}
            className="flex items-center gap-2"
          >
            <Printer size={16} />
            <span>Imprimir</span>
          </Button>
          {response.recordId && estado === "active" && (
            <CorrectionTriggerButton
              targetTable="respuestas_formularios"
              targetRecordId={response.recordId}
              recordCreatedAt={response.timestamp}
              recordEstadoRegistro="active"
              previewData={previewData}
              renderReplacementForm={
                editableFields.length > 0 ? renderReplacementForm : undefined
              }
              onSuccess={onCorrectionSuccess}
              variant="full"
            />
          )}
        </div>
      </div>

      {/* Banda informativa para registros no-activos */}
      {(isAnulado || isSuperseded) && response.lastCorrection && (
        <div className="mb-3 text-xs italic text-muted-foreground">
          {isAnulado ? "Anulado" : "Reemplazado"} por{" "}
          <span className="font-medium not-italic text-foreground">
            {response.lastCorrection.agentNombreCompleto}
          </span>{" "}
          el{" "}
          {format(
            new Date(response.lastCorrection.recordedAt),
            "d MMM yyyy, HH:mm",
            { locale: es }
          )}
        </div>
      )}

      {/* Links cruzados */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        {isSuperseded && response.supersededBy && (
          <button
            type="button"
            onClick={() => handleNavigateTo(response.supersededBy!)}
            className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
          >
            Ver corrección
            {supersededByIndex !== undefined && ` (Respuesta ${supersededByIndex + 1})`}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {isReemplazo && response.supersedes && (
          <button
            type="button"
            onClick={() => handleNavigateTo(response.supersedes!)}
            className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-400"
          >
            <ArrowLeft className="h-3 w-3" />
            Ver original
            {supersedesIndex !== undefined && ` (Respuesta ${supersedesIndex + 1})`}
          </button>
        )}
        {response.recordId && (isAnulado || isSuperseded || isReemplazo) && (
          <button
            type="button"
            onClick={() => setHistorialOpen(true)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <History className="h-3 w-3" />
            Ver historial
          </button>
        )}
      </div>

      <div className="space-y-4">
        {formData.questions.map((question) => {
          const answer = response.data[question.id];
          return (
            <div
              key={question.id}
              className="pb-3 border-b last:border-0"
            >
              <div className="text-sm text-muted-foreground mb-1">
                {question.title}
              </div>
              <div>{renderAnswer(question, answer)}</div>
            </div>
          );
        })}
      </div>

      {response.recordId && (
        <HistorialCorreccionesDialog
          open={historialOpen}
          onOpenChange={setHistorialOpen}
          targetTable="respuestas_formularios"
          targetRecordId={response.recordId}
          recordLabel={`Respuesta ${index + 1} · ${formData.title}`}
        />
      )}
    </div>
  );
};
