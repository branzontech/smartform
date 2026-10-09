import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, History, MoreHorizontal, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CorrectionTriggerButton, DiffHighlightForm, HistorialCorreccionesDialog, type DiffEditableField } from "@/components/correcciones";
import { cn } from "@/lib/utils";
import { RecordBody } from "./RecordBody";
import { RecordActivity } from "./RecordActivity";
import { STATE_LABEL, STATE_TEXT, type ClinicalRecord, type Provenance } from "./types";

/** Campos que se pueden corregir: los de texto, número y fecha. */
function editableFieldsOf(record: ClinicalRecord): DiffEditableField[] {
  return record.questions
    .filter((q) => q.id && q.type !== "section")
    .map((q) => ({
      key: q.id,
      label: q.title || q.id,
      type: q.type === "paragraph" ? "textarea" : q.type === "number" ? "number" : q.type === "date" ? "date" : "text",
    }));
}

interface RecordPreviewProps {
  record: ClinicalRecord;
  provenance: Provenance[];
  canCorrect: boolean;
  onPrint: () => void;
  onCorrected: () => void;
  /** Solo en celular: vuelve a la lista. */
  onBack: () => void;
}

/** Vista previa del registro seleccionado: encabezado fijo con acciones, contenido y actividad. */
export function RecordPreview({ record, provenance, canCorrect, onPrint, onCorrected, onBack }: RecordPreviewProps) {
  const [showCorrections, setShowCorrections] = useState(false);
  const isActive = record.state === "active";
  const editableFields = useMemo(() => editableFieldsOf(record), [record]);
  const previewData = useMemo(() => [
    { label: "Formato", value: record.title },
    { label: "Profesional", value: record.professional },
    { label: "Fecha", value: format(record.createdAt, "dd/MM/yyyy HH:mm") },
    { label: "Atención", value: record.groupLabel },
  ], [record]);

  return (
    <article aria-label={record.title} className="min-w-0">
      <header className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-border bg-card px-5 pb-3.5 pt-4 md:px-6">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-1 h-8 gap-1.5 px-2 text-[13px] text-muted-foreground md:hidden">
            <ArrowLeft className="h-4 w-4" />Registros
          </Button>
          <h3 className={cn("text-lg font-bold leading-snug text-foreground", !isActive && "text-muted-foreground line-through decoration-1")}>{record.title}</h3>
          <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground">
            <span>{record.groupLabel} · {format(record.createdAt, "HH:mm", { locale: es })}</span>
            <span>{record.professional}</span>
            {record.version > 1 && <span title="Versión del formato con que se diligenció">Versión {record.version}</span>}
            <span className={cn("font-semibold", STATE_TEXT[record.state])}>{STATE_LABEL[record.state]}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 print:hidden">
          <Button variant="outline" size="sm" onClick={onPrint} className="h-8 gap-1.5 rounded-lg text-[13px]">
            <Printer className="h-4 w-4" />Imprimir
          </Button>
          {canCorrect && isActive && (
            <CorrectionTriggerButton
              targetTable="respuestas_formularios"
              targetRecordId={record.id}
              recordCreatedAt={record.response.created_at}
              recordEstadoRegistro={record.state}
              previewData={previewData}
              renderReplacementForm={
                editableFields.length > 0
                  ? (onChange) => <DiffHighlightForm originalData={record.data} editableFields={editableFields} onChange={onChange} />
                  : undefined
              }
              onSuccess={onCorrected}
              variant="full"
              className="h-8 rounded-lg text-[13px]"
            />
          )}
          {provenance.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Más acciones" className="h-8 w-8 rounded-lg text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={() => setShowCorrections(true)} className="gap-2 text-[13px]">
                  <History className="h-4 w-4" />Historial de correcciones
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className={cn("px-5 pb-6 md:px-6", !isActive && "opacity-70")}>
        <RecordBody questions={record.questions} data={record.data} score={record.score} />
        <section aria-label="Actividad" className="mt-2 grid gap-2 border-t border-border pt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Actividad</h4>
          <RecordActivity recordId={record.id} provenance={provenance} />
        </section>
      </div>

      {showCorrections && (
        <HistorialCorreccionesDialog
          open={showCorrections}
          onOpenChange={setShowCorrections}
          targetTable="respuestas_formularios"
          targetRecordId={record.id}
          recordLabel={record.title}
        />
      )}
    </article>
  );
}
