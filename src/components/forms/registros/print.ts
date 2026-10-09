import { format } from "date-fns";
import { toast } from "sonner";
import type { ClinicalRecord } from "./types";

const LOADING_PAGE = (text: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Generando…</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#6b7280}</style>
</head><body>${text}</body></html>`;

/**
 * Imprime uno o varios registros con el documento clínico oficial.
 * La ventana se abre de inmediato (si no, el navegador la bloquea) y se llena cuando el documento está listo.
 */
export async function printRecords(records: ClinicalRecord[], opts: { patientId: string; headerConfig?: unknown }) {
  if (records.length === 0) {
    toast.info("No hay registros para imprimir.");
    return;
  }
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Permite las ventanas emergentes para imprimir.");
    return;
  }
  w.document.open();
  w.document.write(LOADING_PAGE(records.length === 1 ? "Generando documento…" : `Generando ${records.length} documentos…`));
  w.document.close();

  try {
    const { buildFormsFullHtml } = await import("@/utils/forms/form-document");
    const single = records.length === 1 ? records[0] : null;
    const html = await buildFormsFullHtml(
      {
        forms: records.map((r) => ({
          id: r.id,
          title: r.title,
          description: `${r.groupLabel} · Registrado el ${format(r.createdAt, "dd/MM/yyyy HH:mm")} por ${r.professional}`,
          questions: r.questions,
          formData: r.data,
        })),
        patientId: opts.patientId,
        doctorId: single?.response.medico_id ?? undefined,
        doctorFallbackName: single?.professional,
        institution: opts.headerConfig,
      },
      single ? single.title : `Histórico clínico — ${records.length} documentos`,
    );
    if (w.closed) return;
    // Se reemplaza el contenido en el mismo ciclo de carga para imprimir una sola vez.
    w.document.open();
    w.document.write(html);
    w.document.close();
    const triggerPrint = () => setTimeout(() => { try { w.focus(); w.print(); } catch { /* la ventana se cerró antes de imprimir */ } }, 400);
    if (w.document.readyState === "complete") triggerPrint();
    else w.addEventListener("load", triggerPrint, { once: true });
  } catch (err) {
    w.close();
    toast.error("No se pudo generar el documento para imprimir.", { description: err instanceof Error ? err.message : undefined });
  }
}
