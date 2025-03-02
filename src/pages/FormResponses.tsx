
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Form } from "./Home";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart, Users, Printer, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[];
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
      const savedForms = localStorage.getItem("forms");
      const formResponses = localStorage.getItem(`formResponses_${id}`);
      
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
        }
      }
      
      if (formResponses) {
        try {
          const parsedResponses = JSON.parse(formResponses);
          setResponses(parsedResponses);
        } catch (error) {
          console.error("Error loading responses:", error);
        }
      }
    }
    
    setLoading(false);
  }, [id, navigate, toast]);

  const getQuestionSummary = (questionId: string) => {
    if (!formData) return null;
    
    const question = formData.questions.find(q => q.id === questionId);
    if (!question) return null;
    
    if (question.type === 'short' || question.type === 'paragraph') {
      return responses.map(response => {
        const answer = response.data[questionId];
        return { answer: answer || "Sin respuesta", count: 1 };
      });
    } else {
      const counts: { [key: string]: number } = {};
      
      responses.forEach(response => {
        const answer = response.data[questionId];
        
        if (Array.isArray(answer)) {
          // Para casillas de verificación (checkbox)
          answer.forEach(option => {
            counts[option] = (counts[option] || 0) + 1;
          });
        } else if (answer) {
          // Para selección múltiple, desplegable
          counts[answer] = (counts[answer] || 0) + 1;
        }
      });
      
      return Object.entries(counts).map(([answer, count]) => ({ answer, count }));
    }
  };

  const renderSummary = () => {
    if (!formData || responses.length === 0) return null;
    
    return (
      <div className="space-y-6 animate-fade-in">
        {formData.questions.map(question => {
          const summary = getQuestionSummary(question.id);
          if (!summary) return null;
          
          const isTextResponse = question.type === 'short' || question.type === 'paragraph';
          
          return (
            <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-scale-in">
              <h3 className="text-lg font-medium mb-4">{question.title}</h3>
              
              {isTextResponse ? (
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-gray-500">
                    {responses.length} respuesta{responses.length !== 1 ? 's' : ''}
                  </p>
                  {responses.length <= 5 ? (
                    <div className="space-y-2">
                      {summary.map((item, i) => (
                        <div key={i} className="border-b border-gray-100 pb-2">
                          {item.answer ? String(item.answer) : <span className="text-gray-400 italic">Sin respuesta</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("individual")}
                      className="text-gray-600"
                    >
                      Ver todas las respuestas
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <div className="space-y-4">
                    {summary.map((item, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-1/2 text-sm">{item.answer}</div>
                        <div className="w-1/2">
                          <div className="flex items-center">
                            <div 
                              className="h-5 bg-form-primary rounded"
                              style={{ 
                                width: `${Math.max(5, (item.count / responses.length) * 100)}%` 
                              }}
                            ></div>
                            <span className="ml-2 text-sm">
                              {item.count} ({Math.round((item.count / responses.length) * 100)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderIndividualResponses = () => {
    if (!formData || responses.length === 0) return null;
    
    return (
      <div className="space-y-6 animate-fade-in">
        {responses.map((response, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="text-lg font-medium">Respuesta {index + 1}</h3>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">
                  {format(new Date(response.timestamp), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                </div>
                {formData.formType === "formato" && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handlePrintFormat(response, index)}
                    className="flex items-center gap-1"
                  >
                    <Printer size={14} />
                    Imprimir
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {formData.questions.map(question => {
                const answer = response.data[question.id];
                
                return (
                  <div key={question.id} className="pb-3 border-b border-gray-100 last:border-0">
                    <div className="text-sm text-gray-500 mb-1">{question.title}</div>
                    <div>
                      {answer ? (
                        Array.isArray(answer) ? 
                          answer.join(", ") : 
                          String(answer)
                      ) : (
                        <span className="text-gray-400 italic">Sin respuesta</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handlePrintFormat = (response: FormResponse, index: number) => {
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

  const renderFormTypeContent = () => {
    if (!formData) return null;
    
    // Para formularios tipo "formato"
    if (formData.formType === "formato") {
      return (
        <div className="animate-fade-in">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 text-emerald-700 mb-4">
              <FileText size={20} />
              <h3 className="text-lg font-medium">Formato Tipo Documento</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Este es un formato tipo documento. Cada respuesta se guarda como un documento individual que puede visualizarse o imprimirse.
            </p>
            <div className="flex items-center gap-2">
              <span className="font-medium">{responses.length}</span>
              <span className="text-gray-500">documentos guardados</span>
            </div>
          </div>
          
          {renderIndividualResponses()}
        </div>
      );
    }
    
    // Para formularios tipo "forms" (original)
    return (
      <>
        <div className="flex space-x-1 border border-gray-200 rounded-lg p-1 mb-6 bg-gray-50 w-fit">
          <button
            className={`px-4 py-2 rounded ${activeTab === "summary" ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'} transition-all`}
            onClick={() => setActiveTab("summary")}
          >
            <div className="flex items-center">
              <BarChart size={16} className="mr-2" />
              Resumen
            </div>
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === "individual" ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'} transition-all`}
            onClick={() => setActiveTab("individual")}
          >
            <div className="flex items-center">
              <Users size={16} className="mr-2" />
              Individuales
            </div>
          </button>
        </div>
        
        {activeTab === "summary" ? renderSummary() : renderIndividualResponses()}
      </>
    );
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
                {formData.responseCount} respuesta{formData.responseCount !== 1 ? 's' : ''} totales
              </div>
              
              {responses.length > 0 ? (
                renderFormTypeContent()
              ) : (
                <EmptyState
                  title="No hay respuestas"
                  description="Este formulario aún no tiene respuestas. Comparte el enlace para empezar a recibir datos."
                  buttonText="Compartir formulario"
                  onClick={() => {
                    const url = `${window.location.origin}/ver/${id}`;
                    navigator.clipboard.writeText(url).then(() => {
                      toast({
                        title: "Enlace copiado al portapapeles",
                        description: "Ahora puedes compartir el formulario",
                      });
                    });
                  }}
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
