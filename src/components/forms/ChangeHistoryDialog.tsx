import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/integrations/data/client";
import { anularRegistro } from "@/lib/correccionService";
import { fetchFormById } from "@/utils/form-utils";
import { carryOverAnswers } from "./carry-over";
import { useClinicalHistories } from "./clinical-histories";
import type { QuestionData } from "./question/types";

const DEFAULT_REASON = "Historia clínica equivocada en la admisión";
const MIN_REASON = 10;

export interface CurrentHistory {
  id: string;
  title: string;
  questions: QuestionData[];
  /** Lo diligenciado hasta ahora (guardado o no). */
  formData: Record<string, unknown>;
  /** Registro ya guardado en la base: se anula, no se borra. */
  responseId?: string;
}

interface ChangeHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: CurrentHistory;
  /** Admisión de la consulta, si la consulta es una admisión. Si no, se usa la admisión en curso del paciente. */
  admissionId: string | null;
  patientId: string;
  /** Solo médico o administrador anulan lo ya guardado; el admisionista no toca datos clínicos. */
  canAnnul: boolean;
  /** Clave del borrador local de una historia en esta consulta. */
  draftKeyFor: (formId: string) => string;
  onChanged: (newFormId: string, carried: string[]) => void;
}

/**
 * Cambio de historia clínica cuando el admisionista se equivocó.
 * Sin nada guardado, se cambia y ya. Con datos guardados, el registro se anula
 * con su motivo (sigue visible como «Anulado») y los campos que coinciden pasan
 * a la historia correcta para revisarlos; la firma se vuelve a firmar.
 */
/** Admisión a la que pertenece la consulta: la explícita o la en curso más reciente (nunca una planificada a futuro). */
async function resolveAdmission(admissionId: string | null, patientId: string): Promise<string | null> {
  if (admissionId) return admissionId;
  const { data, error } = await db
    .from("admisiones")
    .select("id")
    .eq("paciente_id", patientId)
    .eq("estado", "en_curso")
    .order("fecha_inicio", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return ((data ?? []) as { id: string }[])[0]?.id ?? null;
}

/** Cambia la historia de la admisión y confirma que la fila se actualizó (la RLS puede filtrarla sin error). */
async function setAdmissionHistory(admissionId: string, formId: string) {
  const { data, error } = await db.from("admisiones").update({ formulario_id: formId }).eq("id", admissionId).select("id");
  if (error) throw new Error(error.message);
  if (!data || (data as unknown[]).length !== 1) throw new Error("No se pudo actualizar la admisión. Revisa tus permisos.");
}

export function ChangeHistoryDialog({ open, onOpenChange, current, admissionId, patientId, canAnnul, draftKeyFor, onChanged }: ChangeHistoryDialogProps) {
  const { data: histories = [], isSuccess: historiesLoaded } = useClinicalHistories();
  const options = histories.filter((h) => h.id !== current.id);
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const hasSaved = !!current.responseId;
  const blocked = hasSaved && !canAnnul;
  const reasonOk = !hasSaved || reason.trim().length >= MIN_REASON;

  const confirm = async () => {
    if (!targetId || blocked || !reasonOk) return;
    setWorking(true);
    setError("");
    const targetDraft = draftKeyFor(targetId);
    try {
      const target = await fetchFormById(targetId);
      if (!target.form) throw new Error(target.error ?? "No se pudo cargar la historia elegida.");

      // 1. Primero lo que pasa a la historia correcta: si algo falla después, no se pierde.
      const { data, carried } = carryOverAnswers(current.questions, current.formData, target.form.questions as QuestionData[]);
      try {
        if (carried.length) localStorage.setItem(targetDraft, JSON.stringify(data));
      } catch { /* sin almacenamiento: la historia nueva abre vacía */ }

      // 2. La admisión, verificando que se actualizó.
      const admission = await resolveAdmission(admissionId, patientId);
      if (admission) await setAdmissionHistory(admission, targetId);

      // 3. Por último se anula lo guardado. Si falla, la admisión vuelve a la historia anterior.
      if (current.responseId) {
        try {
          await anularRegistro({ target_table: "respuestas_formularios", target_record_id: current.responseId, reason_text: reason.trim() });
        } catch (annulError) {
          const alreadyAnnulled = annulError instanceof Error && /ya fue anulado/i.test(annulError.message);
          if (!alreadyAnnulled) {
            if (admission) await setAdmissionHistory(admission, current.id).catch(() => undefined);
            throw annulError;
          }
        }
      }

      try { localStorage.removeItem(draftKeyFor(current.id)); } catch { /* nada que limpiar */ }
      onChanged(targetId, carried);
    } catch (e) {
      try { localStorage.removeItem(targetDraft); } catch { /* nada que limpiar */ }
      setError(e instanceof Error ? e.message : "No se pudo cambiar la historia clínica.");
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !working && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar historia clínica</DialogTitle>
          <DialogDescription>
            Para cuando la admisión quedó con una historia que no corresponde al servicio. Hoy: «{current.title}».
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="new-history">Historia correcta</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger id="new-history"><SelectValue placeholder="Selecciona la historia clínica" /></SelectTrigger>
              <SelectContent>
                {options.map((h) => <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {historiesLoaded && options.length === 0 && <p className="text-xs text-muted-foreground">No hay otra historia clínica activa. Créala en Configuración › Formularios.</p>}
          </div>

          {hasSaved ? (
            <div className="grid gap-3 rounded-xl bg-amber-500/10 px-4 py-3 text-[13px] leading-5">
              <p>
                <span className="font-semibold">«{current.title}» ya tiene datos guardados.</span> No se borran: el registro se
                anula con el motivo y queda en el historial como «Anulado». Los campos que coinciden pasan a la historia correcta
                para que los revises; la firma se vuelve a firmar.
              </p>
              {blocked ? (
                <p className="font-medium text-amber-800 dark:text-amber-300">Solo un médico o un administrador puede anular un registro guardado.</p>
              ) : (
                <div className="grid gap-1.5">
                  <Label htmlFor="change-reason">Motivo de la anulación</Label>
                  <Textarea id="change-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="resize-none bg-background" />
                  {!reasonOk && <p className="text-xs text-destructive">Escribe al menos {MIN_REASON} caracteres.</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Aún no hay datos guardados en esta historia: se cambia directamente. Lo escrito sin guardar que coincida pasa a la nueva.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={working}>Cancelar</Button>
          <Button onClick={confirm} disabled={!targetId || blocked || !reasonOk || working}>
            {working && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {hasSaved ? "Anular y cambiar" : "Cambiar historia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
