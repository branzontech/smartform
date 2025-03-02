
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Form } from '@/pages/Home';

interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[];
  };
}

export const printFormResponse = (formData: Form, response: FormResponse, index: number) => {
  // Creamos una ventana de impresión con estilo
  const printWindow = window.open('', '_blank');
  if (!printWindow || !formData) return;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${formData.title} - Respuesta ${index + 1}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .date { color: #666; font-size: 14px; }
        .question-group { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .question { font-weight: bold; margin-bottom: 5px; }
        .answer { margin-left: 10px; }
        .no-answer { color: #999; font-style: italic; }
        @media print {
          body { padding: 0; font-size: 12px; }
          h1 { font-size: 18px; }
          .question-group { page-break-inside: avoid; }
          .print-button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${formData.title}</h1>
        <div class="date">
          ${format(new Date(response.timestamp), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
        </div>
      </div>
      
      ${formData.questions.map(question => {
        const answer = response.data[question.id];
        return `
          <div class="question-group">
            <div class="question">${question.title}</div>
            <div class="answer">
              ${answer 
                ? (Array.isArray(answer) 
                    ? answer.join(", ") 
                    : String(answer))
                : '<span class="no-answer">Sin respuesta</span>'
              }
            </div>
          </div>
        `;
      }).join('')}
      
      <div class="print-button">
        <button onclick="window.print()">Imprimir documento</button>
      </div>
      <script>
        // Auto-print cuando se carga el documento
        window.onload = function() {
          setTimeout(() => window.print(), 500);
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
};
