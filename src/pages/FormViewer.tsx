
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { QuestionRenderer } from '@/components/forms/form-viewer/question-renderer';
import { QuestionData } from '@/components/forms/question/types';
import { FormTitle } from '@/components/ui/form-title';
import { BackButton } from '@/App';
import { Check, Link as LinkIcon, Printer, AlertTriangle, CalendarIcon, ClipboardList, PanelRightClose, PanelRightOpen, GripVertical, MoreHorizontal, ArrowLeft, Save, ClipboardPlus, Pill, TestTube, Scan, UserPlus, Scissors, List } from 'lucide-react';
import { toast } from "sonner";
import { Form as FormType } from './FormsPage';
import { FormLoading } from '@/components/forms/form-viewer/form-loading';
import { FormError } from '@/components/forms/form-viewer/form-error';
import { FormSubmissionSuccess } from '@/components/forms/form-viewer/form-submission-success';
import { createDynamicSchema, fetchFormById, saveFormResponse } from '@/utils/form-utils';
import { useToast } from '@/hooks/use-toast';
import { PatientHistoryPanel } from '@/components/patients/PatientHistoryPanel';
import { FormHeaderPreview } from '@/components/forms/FormHeaderPreview';
import { PatientHeaderBanner } from '@/components/forms/PatientHeaderBanner';
import { RegistroAtenciones } from '@/components/forms/RegistroAtenciones';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface FormData {
  [key: string]: any;
}

const PANEL_WIDTH_KEY = 'kerhub-antecedentes-panel-width';
const PANEL_COLLAPSED_KEY = 'kerhub-antecedentes-panel-collapsed';
const DEFAULT_PANEL_WIDTH = 380;
const MIN_PANEL_WIDTH = 280;
const MIN_FORM_WIDTH = 400;

const FormViewer = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<FormData>({});
  const draftRestoredRef = useRef(false);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [formTitle, setFormTitle] = useState("Formulario");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<string>("historia_clinica");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [headerConfig, setHeaderConfig] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingValues, setPendingValues] = useState<any>(null);
  const [showRegistro, setShowRegistro] = useState(false);
  const { toast: uiToast } = useToast();

  // Panel resize state
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem(PANEL_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_PANEL_WIDTH;
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(PANEL_COLLAPSED_KEY) === 'true';
  });
  const previousWidthRef = useRef(panelWidth);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelStateBeforeRegistroRef = useRef<boolean | null>(null);

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get("patientId");
  const consultationId = queryParams.get("consultationId");
  const isEmbedded = queryParams.get("embedded") === "true";

  // Draft cache key — unique per form + patient + consultation
  const draftKey = `kerhub-draft-${formId || 'unknown'}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`;

  // Auto-save draft to localStorage (debounced 500ms)
  useEffect(() => {
    if (!draftRestoredRef.current) return; // Don't save until draft has been restored/checked
    if (submitted) return;
    const hasData = Object.keys(formData).some(k => {
      const v = formData[k];
      return v !== undefined && v !== null && v !== '';
    });
    if (!hasData) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch { /* quota exceeded — ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, draftKey, submitted]);

  // Clear draft helper
  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  // Persist panel prefs
  useEffect(() => {
    localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
  }, [panelWidth]);
  useEffect(() => {
    localStorage.setItem(PANEL_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = useCallback(() => {
    if (!isCollapsed) {
      previousWidthRef.current = panelWidth;
    }
    setIsCollapsed(prev => !prev);
  }, [isCollapsed, panelWidth]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.classList.add('select-none', 'cursor-col-resize');

    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = startX - moveEvent.clientX; // dragging left = bigger panel
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const maxWidth = Math.floor(containerWidth * 0.5);
      let newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(maxWidth, startWidth + delta));
      // Ensure form column has minimum width
      if (containerWidth - newWidth < MIN_FORM_WIDTH) {
        newWidth = containerWidth - MIN_FORM_WIDTH;
      }
      setPanelWidth(newWidth);
    };

    const onUp = () => {
      isDraggingRef.current = false;
      document.body.classList.remove('select-none', 'cursor-col-resize');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  useEffect(() => {
    const loadForm = async () => {
      if (formId) {
        setLoading(true);
        setError("");
        
        try {
          const [result, headerResult] = await Promise.all([
            fetchFormById(formId),
            supabase.from("configuracion_encabezado" as any).select("*").limit(1).single(),
          ]);

          if (headerResult.data) {
            setHeaderConfig(headerResult.data);
          }
          
          if (result.form) {
            setQuestions(result.form.questions as QuestionData[]);
            setFormTitle(result.form.title);
            setFormDescription(result.form.description);
            if (result.form.formType) {
              setFormType(result.form.formType);
            }
            
            if (result.error) {
              setError(result.error);
            }
          }
          
          if (patientId) {
            const savedPatients = localStorage.getItem("patients");
            if (savedPatients) {
              const patients = JSON.parse(savedPatients);
              const patient = patients.find((p: any) => p.id === patientId);
              
              if (patient) {
                const patientData: FormData = {};
                questions.forEach(question => {
                  if (question.type === "short" && question.title.includes("nombre")) {
                    patientData[question.id] = patient.name;
                  } else if (question.type === "short" && question.title.includes("identificación")) {
                    patientData[question.id] = patient.documentId;
                  } else if (question.type === "short" && question.title.includes("teléfono")) {
                    patientData[question.id] = patient.contactNumber;
                  } else if (question.type === "short" && question.title.includes("email")) {
                    patientData[question.id] = patient.email;
                  }
                });
                
                setFormData(prevData => ({...prevData, ...patientData}));
              }
            }
          }
          
          // Restore draft from localStorage if available
          try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
              const draftData = JSON.parse(savedDraft);
              setFormData(prev => ({ ...prev, ...draftData }));
              toast("Borrador restaurado", {
                description: "Se recuperaron los datos que no habías guardado",
                icon: <Check size={16} className="text-primary" />,
              });
            }
          } catch { /* corrupt draft — ignore */ }
          draftRestoredRef.current = true;

        } catch (error) {
          console.error('Error loading form:', error);
          setError("Error al cargar el formulario");
        } finally {
          setLoading(false);
        }
      }
    };

    loadForm();
  }, [formId, patientId]);

  const dynamicSchema = createDynamicSchema(questions);
  
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: formData,
  });

  const handleInputChange = (id: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [id]: value,
    }));
  };

  const onSubmit = async (values: z.infer<typeof dynamicSchema>) => {
    const processedValues = { ...values };
    
    questions.forEach(question => {
      if (question.type === "vitals") {
        // New vitals structure: collect all enabled vital fields
        const predefined = question.predefinedVitals;
        if (predefined) {
          const vitalsData: Record<string, any> = {};
          Object.entries(predefined).forEach(([key, v]) => {
            if (v.enabled) {
              vitalsData[key] = formData[`${question.id}_${key}`] || "";
            }
          });
          // Include custom vitals
          (question.customVitals || []).forEach(cv => {
            vitalsData[`custom_${cv.id}`] = formData[`${question.id}_custom_${cv.id}`] || "";
          });
          processedValues[question.id] = vitalsData;
        } else if (question.vitalType === "TA") {
          processedValues[question.id] = {
            sys: formData[`${question.id}_sys`],
            dia: formData[`${question.id}_dia`]
          };
        } else if (question.vitalType === "IMC") {
          processedValues[question.id] = {
            weight: formData[`${question.id}_weight`],
            height: formData[`${question.id}_height`],
            bmi: formData[`${question.id}_bmi`]
          };
        }
      } else if (question.type === "clinical") {
        processedValues[question.id] = {
          title: formData[`${question.id}_title`],
          detail: formData[`${question.id}_detail`]
        };
      } else if (question.type === "multifield" && question.multifields) {
        const multifieldValues: Record<string, string> = {};
        question.multifields.forEach(field => {
          multifieldValues[field.id] = formData[`${question.id}_${field.id}`] || '';
        });
        processedValues[question.id] = multifieldValues;
      } else if (question.type === "scored_checkbox" || question.type === "score_total") {
        processedValues[question.id] = formData[question.id] || { score: 0 };
      }
    });

    setPendingValues(processedValues);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingValues) return;
    setShowConfirmModal(false);

    const { _patientId, _consultationId, ...cleanData } = pendingValues;

    if (formId && patientId) {
      const { data: { user } } = await supabase.auth.getUser();
      const medicoId = user?.id;

      if (!medicoId) {
        uiToast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para guardar respuestas.",
          variant: "destructive",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from("respuestas_formularios" as any)
        .insert({
          formulario_id: formId,
          paciente_id: patientId,
          admision_id: consultationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultationId) ? consultationId : null,
          medico_id: medicoId,
          datos_respuesta: cleanData,
        });

      if (insertError) {
        uiToast({
          title: "Error al guardar",
          description: insertError.message,
          variant: "destructive",
        });
        return;
      }
    } else if (formId) {
      pendingValues._patientId = patientId || undefined;
      pendingValues._consultationId = consultationId || undefined;
      saveFormResponse(formId, pendingValues);
    }

    if (isEmbedded && formId) {
      window.parent.postMessage({
        type: 'formCompleted',
        formId: formId
      }, '*');
    }

    uiToast({
      title: "✅ Formulario guardado exitosamente",
      description: `${formTitle} — ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`,
    });

    clearDraft();
    setPendingValues(null);
  };

  const getFilledFieldsSummary = () => {
    if (!pendingValues) return [];
    const summary: { label: string; value: string; isEmpty: boolean }[] = [];
    
    questions.forEach(q => {
      if (q.type === "section") return;
      const val = pendingValues[q.id];
      let displayValue = "";
      let isEmpty = false;
      
      if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
        displayValue = "Sin completar";
        isEmpty = true;
      } else if (typeof val === "object" && !Array.isArray(val)) {
        displayValue = Object.values(val).filter(Boolean).join(", ") || "Sin completar";
        isEmpty = !Object.values(val).some(Boolean);
      } else if (Array.isArray(val)) {
        displayValue = val.join(", ");
      } else {
        displayValue = String(val).length > 80 ? String(val).substring(0, 80) + "..." : String(val);
      }
      
      summary.push({ label: q.title, value: displayValue, isEmpty });
    });
    
    return summary;
  };

  const copyFormLinkToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast("Enlace copiado al portapapeles", {
      description: "Ahora puedes compartir el formulario",
      icon: <Check size={16} className="text-green-500" />,
    });
  };

  const printForm = () => {
    window.print();
  };

  if (loading) {
    return <FormLoading />;
  }

  if (error && !questions.length) {
    return <FormError error={error} />;
  }

  if (submitted) {
    return <FormSubmissionSuccess onResubmit={() => setSubmitted(false)} />;
  }

  const isConsultationForm = patientId && consultationId;
  const showPatientPanel = !!patientId;

  // Embedded layout
  if (isEmbedded) {
    return (
      <div className="p-4 bg-background">
        <FormHeaderPreview config={headerConfig} formTitle={formTitle} />
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{formTitle}</h2>
          {formDescription && (
            <p className="text-sm text-muted-foreground">{formDescription}</p>
          )}
        </div>
        
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {questions.map(question => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  formData={formData}
                  onChange={handleInputChange}
                  errors={form.formState.errors}
                />
              ))}
              <div className="pt-4">
                <Button type="submit" className="w-full">
                  Completar formulario
                </Button>
              </div>
            </form>
          </Form>
        </FormProvider>
      </div>
    );
  }

  // Standard single-column layout for regular forms (no patient)
  if (!showPatientPanel) {
    return (
      <div className="h-full overflow-y-auto py-12 container print:py-6 print:mx-0 print:w-full print:max-w-none">
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold">{formTitle}</h1>
          {formDescription && <p className="text-muted-foreground">{formDescription}</p>}
        </div>
        <div className="print:hidden">
          <BackButton />
        </div>
        <div className="mb-6 flex justify-between items-center print:hidden">
          <FormTitle 
            defaultTitle={formTitle}
            defaultDescription={formDescription}
            readOnly={true}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={printForm} className="flex items-center gap-2">
              <Printer size={16} />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={copyFormLinkToClipboard} className="flex items-center gap-2">
              <LinkIcon size={16} />
              Compartir
            </Button>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border/50 print:shadow-none print:border-none">
          <FormHeaderPreview config={headerConfig} formTitle={formTitle} />
          <FormProvider {...form}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                {questions.map(question => (
                  <QuestionRenderer
                    key={question.id}
                    question={question}
                    formData={formData}
                    onChange={handleInputChange}
                    errors={form.formState.errors}
                  />
                ))}
                <Button type="submit" className="w-full sm:w-auto print:hidden gap-2"><Save size={16} />Guardar</Button>
              </form>
            </Form>
          </FormProvider>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          open={showConfirmModal}
          onOpenChange={setShowConfirmModal}
          onConfirm={handleConfirmSave}
          formTitle={formTitle}
          getFilledFieldsSummary={getFilledFieldsSummary}
        />
      </div>
    );
  }

  // Two-column clinical layout with resizable panel
  return (
    <div ref={containerRef} className="h-full overflow-hidden flex flex-col print:overflow-visible -mx-6">
      {/* Print header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">{formTitle}</h1>
        {formDescription && <p className="text-muted-foreground">{formDescription}</p>}
      </div>

      {/* Fixed header bar */}
      <div className="shrink-0 print:hidden bg-card border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (patientId) {
                  const params = new URLSearchParams({ patientId });
                  if (formId) params.set('selectedForms', formId);
                  navigate(`/app/pacientes/nueva-consulta?${params.toString()}`);
                } else {
                  navigate(-1);
                }
              }}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-md border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
            >
              <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <ArrowLeft className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Volver
              </span>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{formTitle}</h1>
              {formDescription && (
                <p className="text-xs text-muted-foreground">{formDescription}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showRegistro ? (
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => {
                setShowRegistro(false);
                // Restore previous panel state
                if (panelStateBeforeRegistroRef.current !== null) {
                  setIsCollapsed(panelStateBeforeRegistroRef.current);
                  panelStateBeforeRegistroRef.current = null;
                }
              }}>
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al formulario
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                title="Registro de Atenciones"
                onClick={() => {
                  panelStateBeforeRegistroRef.current = isCollapsed;
                  setIsCollapsed(true);
                  setShowRegistro(true);
                }}
              >
                <ClipboardList className="w-4 h-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={printForm} className="gap-2 text-sm">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyFormLinkToClipboard} className="gap-2 text-sm">
                  <LinkIcon className="w-4 h-4" />
                  Compartir enlace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isConsultationForm && (
          <div className="mt-2 p-2.5 bg-primary/5 rounded-md border border-primary/20">
            <p className="text-primary text-xs font-medium">
              Consulta médica en curso — Complete el formulario de atención
            </p>
          </div>
        )}
      </div>

      {/* Two-column area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* LEFT — Form or Registro with its own scroll */}
        <div className="flex-1 min-w-0 overflow-y-auto p-6 bg-background" style={{ overscrollBehavior: 'contain' }}>
          {showRegistro && patientId ? (
            <RegistroAtenciones
              patientId={patientId}
              headerConfig={headerConfig}
            />
          ) : (
            <>
              {patientId && (
                <PatientHeaderBanner
                  pacienteId={patientId}
                  admisionId={consultationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultationId) ? consultationId : undefined}
                />
              )}
              <FormHeaderPreview config={headerConfig} formTitle={formTitle} />
              <FormProvider {...form}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 max-w-none">
                    {questions.map(question => (
                      <QuestionRenderer
                        key={question.id}
                        question={question}
                        formData={formData}
                        onChange={handleInputChange}
                        errors={form.formState.errors}
                      />
                    ))}
                    <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t">
                      <Button type="submit" className="w-full print:hidden gap-2">
                        <Save size={16} />
                        Guardar
                      </Button>
                    </div>
                  </form>
                </Form>
              </FormProvider>
            </>
          )}
        </div>

        {/* RIGHT — Resizable panel or collapsed strip */}
        {!isCollapsed ? (
          <>
            {/* Resize handle */}
            <div
              className="w-1.5 hover:w-2 cursor-col-resize flex items-center justify-center hover:bg-primary/10 transition-all group shrink-0 print:hidden"
              onMouseDown={handleResizeStart}
            >
              <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-0.5 h-1 bg-muted-foreground/30 rounded-full" />
                <div className="w-0.5 h-1 bg-muted-foreground/30 rounded-full" />
                <div className="w-0.5 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            </div>

            {/* Panel */}
            <div
              className="shrink-0 overflow-hidden flex flex-col bg-muted/20 border-l print:hidden"
              style={{ width: `${panelWidth}px` }}
            >
              {/* Panel header */}
              <div className="shrink-0 px-4 py-3 border-b flex items-center justify-between bg-card">
                <h3 className="font-semibold text-sm">Antecedentes del Paciente</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapse}
                  className="h-7 w-7 text-muted-foreground"
                >
                  <PanelRightClose className="w-4 h-4" />
                </Button>
              </div>
              {/* Panel content — independent scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                <PatientHistoryPanel patientId={patientId!} className="h-full" />
              </div>
            </div>
          </>
        ) : (
          /* Collapsed strip */
          <div className="shrink-0 border-l flex flex-col items-center print:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsCollapsed(false);
                setPanelWidth(previousWidthRef.current || DEFAULT_PANEL_WIDTH);
              }}
              className="h-10 w-8 rounded-none hover:bg-muted text-muted-foreground"
              title="Abrir panel de antecedentes"
            >
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSave}
        formTitle={formTitle}
        getFilledFieldsSummary={getFilledFieldsSummary}
      />
    </div>
  );
};

// Extracted confirmation modal to reduce main component size
const ConfirmationModal = ({
  open,
  onOpenChange,
  onConfirm,
  formTitle,
  getFilledFieldsSummary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  formTitle: string;
  getFilledFieldsSummary: () => { label: string; value: string; isEmpty: boolean }[];
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col rounded-2xl">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="w-5 h-5 text-primary" />
          Confirmar envío del formulario
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm">
          Revisa los datos antes de guardar. Una vez enviado, no podrás modificar esta respuesta.
        </AlertDialogDescription>
      </AlertDialogHeader>
      
      <div className="overflow-y-auto flex-1 -mx-6 px-6 py-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
          <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{formTitle}</span>
            <span className="text-muted-foreground ml-2">
              {format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          {getFilledFieldsSummary().map((field, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-border/30 bg-card/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                <p className={`text-sm mt-0.5 ${field.isEmpty ? "text-destructive italic" : "text-foreground"}`}>
                  {field.value}
                </p>
              </div>
              {field.isEmpty && (
                <Badge variant="outline" className="shrink-0 text-[10px] border-destructive/30 text-destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Vacío
                </Badge>
              )}
            </div>
          ))}
        </div>

        {getFilledFieldsSummary().some(f => f.isEmpty) && (
          <div className="flex items-center gap-2 p-3 mt-3 rounded-xl bg-destructive/5 border border-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">
              Hay campos sin completar. ¿Deseas continuar de todas formas?
            </p>
          </div>
        )}
      </div>

      <AlertDialogFooter className="mt-2">
        <AlertDialogCancel className="rounded-xl">Volver a revisar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="rounded-xl gap-2">
          <Check className="w-4 h-4" />
          Confirmar y guardar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default FormViewer;
