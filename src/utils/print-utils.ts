import { Form } from "@/pages/FormsPage";
import { FormResponse } from "@/types/form-types";
import { buildFormsFullHtml } from "@/utils/forms/form-document";
import type { QuestionData } from "@/components/forms/question/types";

/**
 * Print a single form response using the professional clinical document format
 * (institutional header + patient block + questions/answers + doctor signature).
 */
export const printFormResponse = async (
  formData: Form,
  response: FormResponse,
  index: number,
) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, permite las ventanas emergentes para imprimir.");
    return;
  }

  // Show a lightweight loading state while we fetch institution + patient data
  printWindow.document.open();
  printWindow.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${formData.title}</title>
    <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#6b7280}</style>
    </head><body>Generando documento…</body></html>`,
  );
  printWindow.document.close();

  // Extract patient context embedded in the response payload (added in FormResponses.tsx)
  const patientId = (response.data as any)?._patientId as string | undefined;

  // Strip internal metadata keys (prefixed with "_") from the form data
  const cleanData: Record<string, any> = {};
  Object.entries(response.data || {}).forEach(([key, value]) => {
    if (!key.startsWith("_")) cleanData[key] = value;
  });

  const timestamp = new Date(response.timestamp).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = await buildFormsFullHtml(
    {
      forms: [
        {
          id: formData.id,
          title: formData.title,
          description: formData.description
            ? `${formData.description} · Respuesta #${index + 1} · ${timestamp}`
            : `Respuesta #${index + 1} · ${timestamp}`,
          questions: (formData.questions as unknown as QuestionData[]) || [],
          formData: cleanData,
        },
      ],
      patientId: patientId || undefined,
    },
    `${formData.title} — Respuesta ${index + 1}`,
  );

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => setTimeout(() => printWindow.print(), 600);
};
