
import { Form } from "@/pages/Home";
import { FormResponse } from "@/types/form-types";

export const printFormResponse = (formData: Form, response: FormResponse, index: number) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para imprimir.');
    return;
  }

  // Start building the HTML content
  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${formData.title} - Respuesta ${index + 1}</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .response-info {
          text-align: right;
          margin-bottom: 20px;
          font-size: 14px;
          color: #666;
        }
        .question {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        .question-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .answer {
          font-size: 16px;
        }
        .signature-img {
          max-width: 300px;
          border: 1px solid #ddd;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        @media print {
          body {
            padding: 0;
          }
          .print-button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${formData.title}</h1>
          ${formData.description ? `<p>${formData.description}</p>` : ''}
        </div>
        
        <div class="response-info">
          Respuesta #${index + 1} - ${new Date(response.timestamp).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
  `;

  // Add each question and answer
  formData.questions.forEach(question => {
    const answer = response.data[question.id];
    
    content += `
      <div class="question">
        <div class="question-title">${question.title}</div>
        <div class="answer">
    `;

    // Handle different types of answers
    if (!answer) {
      content += '<span style="color: #999; font-style: italic;">Sin respuesta</span>';
    } else {
      switch (question.type) {
        case 'checkbox':
          content += Array.isArray(answer) ? answer.join(", ") : String(answer);
          break;
        
        case 'vitals':
          if (question.vitalType === "TA" && typeof answer === 'object') {
            content += `${answer.sys}/${answer.dia} mmHg`;
          } else if (question.vitalType === "IMC" && typeof answer === 'object') {
            content += `Peso: ${answer.weight} kg, Altura: ${answer.height} cm, IMC: ${answer.bmi}`;
          } else {
            content += String(answer);
          }
          break;
        
        case 'clinical':
          if (typeof answer === 'object') {
            content += `<div style="font-weight: 500;">${answer.title}</div>`;
            content += `<div style="font-size: 14px; color: #666;">${answer.detail}</div>`;
          } else {
            content += String(answer);
          }
          break;
        
        case 'multifield':
          if (typeof answer === 'object') {
            Object.entries(answer).forEach(([key, value]) => {
              const fieldLabel = question.multifields?.find((f: any) => f.id === key)?.label || key;
              content += `<div><span style="font-size: 14px; color: #666; margin-right: 8px;">${fieldLabel}:</span>${String(value)}</div>`;
            });
          } else {
            content += String(answer);
          }
          break;
        
        case 'file':
          if (typeof answer === 'object' && answer.name) {
            content += `<div>Archivo: ${answer.name} (${(answer.size / (1024 * 1024)).toFixed(2)} MB)</div>`;
          } else {
            content += '<span style="color: #999; font-style: italic;">Archivo no disponible</span>';
          }
          break;
        
        case 'signature':
          if (answer && typeof answer === 'string' && answer.startsWith('data:image')) {
            content += `<img src="${answer}" alt="Firma" class="signature-img" />`;
          } else {
            content += '<span style="color: #999; font-style: italic;">Sin firma</span>';
          }
          break;
        
        default:
          content += Array.isArray(answer) ? answer.join(", ") : String(answer);
      }
    }
    
    content += '</div></div>';
  });

  // Close the HTML
  content += `
        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}</p>
        </div>
        
        <div class="print-button" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #0099ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Imprimir documento
          </button>
        </div>
      </div>
      
      <script>
        // Auto-print when document loads
        window.onload = function() {
          // Short delay to ensure styles are applied
          setTimeout(() => {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  // Write to the new window and open the print dialog
  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();
};
