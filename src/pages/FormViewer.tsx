
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
import { Check, Link as LinkIcon, Printer, AlertTriangle, CalendarIcon, ClipboardList, PanelRightClose, PanelRightOpen, GripVertical, MoreHorizontal, ArrowLeft, Save, ClipboardPlus, Pill, TestTube, Scan, UserPlus, Scissors, List, Plus, Search, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { Form as FormType } from './FormsPage';
import { FormLoading } from '@/components/forms/form-viewer/form-loading';
import { FormError } from '@/components/forms/form-viewer/form-error';
import { FormSubmissionSuccess } from '@/components/forms/form-viewer/form-submission-success';
import { createDynamicSchema, fetchFormById, saveFormResponse } from '@/utils/form-utils';
import { useToast } from '@/hooks/use-toast';
import { PatientHistoryPanel } from '@/components/patients/PatientHistoryPanel';
import { FormHeaderPreview } from '@/components/forms/FormHeaderPreview';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface FormData {
  [key: string]: any;
}

interface FormEntry {
  id: string;
  questions: QuestionData[];
  title: string;
  description: string;
  formType: string;
  formData: FormData;
  saved: boolean;
  isDirty: boolean;
  responseId?: string; // track existing response for upsert
}

const PANEL_WIDTH_KEY = 'kerhub-antecedentes-panel-width';
const PANEL_COLLAPSED_KEY = 'kerhub-antecedentes-panel-collapsed';
const DEFAULT_PANEL_WIDTH = 380;
const MIN_PANEL_WIDTH = 280;
const MIN_FORM_WIDTH = 400;
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds

const FormViewer = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const draftRestoredRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [headerConfig, setHeaderConfig] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingValues, setPendingValues] = useState<any>(null);
  const [showRegistro, setShowRegistro] = useState(false);
  const { hasRole } = useAuth();
  const canCreateOrders = hasRole('doctor') || hasRole('admin');
  const { toast: uiToast } = useToast();

  // Multi-form state
  const [formsMap, setFormsMap] = useState<Record<string, FormEntry>>({});
  const [activeFormId, setActiveFormId] = useState<string>(formId || '');
  const [showAddFormDialog, setShowAddFormDialog] = useState(false);
  const [addFormSearch, setAddFormSearch] = useState('');
  const [addFormResults, setAddFormResults] = useState<{ id: string; titulo: string; tipo: string }[]>([]);
  const [addFormLoading, setAddFormLoading] = useState(false);
  const [dynamicFormIds, setDynamicFormIds] = useState<string[]>([]);

  // Autosave state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const pendingNavigationRef = useRef<string | number | null>(null);
  const [isCompletingAttention, setIsCompletingAttention] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);

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
  const extraFormIds = queryParams.get("forms")?.split(',').filter(Boolean) || [];

  // Build ordered list of all form IDs
  const allFormIds = React.useMemo(() => {
    const ids: string[] = [];
    if (formId) ids.push(formId);
    extraFormIds.forEach(id => { if (!ids.includes(id)) ids.push(id); });
    dynamicFormIds.forEach(id => { if (!ids.includes(id)) ids.push(id); });
    return ids;
  }, [formId, extraFormIds.join(','), dynamicFormIds.join(',')]);

  const isMultiForm = allFormIds.length > 1;

  // Dirty flags derived from formsMap
  const dirtyFlags = React.useMemo(() => {
    const flags: Record<string, boolean> = {};
    for (const [fId, entry] of Object.entries(formsMap)) {
      flags[fId] = entry.isDirty;
    }
    return flags;
  }, [formsMap]);

  const hasAnyDirty = Object.values(dirtyFlags).some(Boolean);
  const dirtyCount = Object.values(dirtyFlags).filter(Boolean).length;

  // beforeunload protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasAnyDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasAnyDirty]);

  // Search forms for add dialog
  const searchForms = useCallback(async (query: string) => {
    setAddFormLoading(true);
    try {
      let q = supabase.from('formularios').select('id, titulo, tipo').eq('estado', 'activo').limit(20);
      if (query.trim()) {
        q = q.ilike('titulo', `%${query.trim()}%`);
      }
      const { data } = await q;
      setAddFormResults((data as any[]) || []);
    } catch { setAddFormResults([]); }
    setAddFormLoading(false);
  }, []);

  useEffect(() => {
    if (showAddFormDialog) {
      searchForms(addFormSearch);
    }
  }, [showAddFormDialog, addFormSearch, searchForms]);

  const handleAddNewForm = async (newFormId: string) => {
    if (allFormIds.includes(newFormId)) {
      toast("Este formulario ya fue agregado");
      return;
    }
    const result = await fetchFormById(newFormId);
    if (result.form) {
      const qs = result.form.questions as QuestionData[] || [];
      setFormsMap(prev => ({
        ...prev,
        [newFormId]: {
          id: newFormId,
          questions: qs,
          title: result.form!.title,
          description: result.form!.description,
          formType: result.form!.formType || 'historia_clinica',
          formData: {},
          saved: false,
          isDirty: false,
        },
      }));
      setDynamicFormIds(prev => [...prev, newFormId]);
      setActiveFormId(newFormId);
      setShowAddFormDialog(false);
      setAddFormSearch('');
    }
  };

  // Derived state from active form
  const activeEntry = formsMap[activeFormId];
  const formData = activeEntry?.formData || {};
  const questions = activeEntry?.questions || [];
  const formTitle = activeEntry?.title || "Formulario";
  const formDescription = activeEntry?.description || "";
  const formType = activeEntry?.formType || "historia_clinica";

  // Draft cache key
  const draftKey = `kerhub-draft-${activeFormId || 'unknown'}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`;

  // Auto-save draft to localStorage (debounced 500ms)
  useEffect(() => {
    if (!draftRestoredRef.current) return;
    if (submitted) return;
    const hasData = Object.keys(formData).some(k => {
      const v = formData[k];
      return v !== undefined && v !== null && v !== '';
    });
    if (!hasData) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch { /* quota exceeded */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, draftKey, submitted]);

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
      const delta = startX - moveEvent.clientX;
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const maxWidth = Math.floor(containerWidth * 0.5);
      let newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(maxWidth, startWidth + delta));
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

  // ── Save a single form to DB ──
  const saveFormToDb = useCallback(async (fId: string, showToast = false): Promise<boolean> => {
    const entry = formsMap[fId];
    if (!entry) return false;

    const { data: { user } } = await supabase.auth.getUser();
    const medicoId = user?.id;

    if (patientId && !medicoId) {
      if (showToast) uiToast({ title: "Error de autenticación", description: "Debes iniciar sesión.", variant: "destructive" });
      return false;
    }

    const processed = processFormValues(entry.questions, entry.formData, entry.formData);

    if (patientId && medicoId) {
      const admisionId = consultationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultationId) ? consultationId : null;

      if (entry.responseId) {
        // Update existing response
        const { error: updateError } = await supabase
          .from("respuestas_formularios" as any)
          .update({ datos_respuesta: processed, updated_at: new Date().toISOString() })
          .eq('id', entry.responseId);
        if (updateError) {
          if (showToast) uiToast({ title: "Error al guardar", description: `${entry.title}: ${updateError.message}`, variant: "destructive" });
          return false;
        }
      } else {
        // Insert new response
        const { data: insertData, error: insertError } = await supabase
          .from("respuestas_formularios" as any)
          .insert({
            formulario_id: fId,
            paciente_id: patientId,
            admision_id: admisionId,
            medico_id: medicoId,
            datos_respuesta: processed,
          })
          .select('id')
          .single();
        if (insertError) {
          if (showToast) uiToast({ title: "Error al guardar", description: `${entry.title}: ${insertError.message}`, variant: "destructive" });
          return false;
        }
        // Store the response ID for future updates
        setFormsMap(prev => ({
          ...prev,
          [fId]: { ...prev[fId], responseId: (insertData as any)?.id },
        }));
      }
    } else {
      saveFormResponse(fId, { ...processed, _patientId: patientId, _consultationId: consultationId });
    }

    // Clear draft and mark clean
    const dk = `kerhub-draft-${fId}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`;
    localStorage.removeItem(dk);

    setFormsMap(prev => ({
      ...prev,
      [fId]: { ...prev[fId], saved: true, isDirty: false },
    }));

    return true;
  }, [formsMap, patientId, consultationId, uiToast]);

  // ── Autosave on tab switch ──
  const handleTabSwitch = useCallback(async (targetFormId: string) => {
    if (targetFormId === activeFormId) return;

    const currentEntry = formsMap[activeFormId];
    if (currentEntry?.isDirty) {
      setSaveStatus('saving');
      const success = await saveFormToDb(activeFormId);
      if (!success) {
        setSaveStatus('idle');
        uiToast({ title: "Error al guardar", description: `No se pudo guardar "${currentEntry.title}". Corrige los errores antes de cambiar de formulario.`, variant: "destructive" });
        return; // Don't switch tab
      }
      setSaveStatus('saved');
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }

    setActiveFormId(targetFormId);
  }, [activeFormId, formsMap, saveFormToDb, uiToast]);

  // ── 30s interval autosave ──
  useEffect(() => {
    if (!draftRestoredRef.current) return;

    const interval = setInterval(async () => {
      // Save ALL dirty forms silently
      for (const fId of allFormIds) {
        const entry = formsMap[fId];
        if (entry?.isDirty) {
          setSaveStatus('saving');
          await saveFormToDb(fId);
          setSaveStatus('saved');
          if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
          saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        }
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [allFormIds, formsMap, saveFormToDb]);

  // ── Load all forms ──
  useEffect(() => {
    const loadAllForms = async () => {
      if (allFormIds.length === 0) return;
      setLoading(true);
      setError("");

      try {
        const [headerResult, ...formResults] = await Promise.all([
          supabase.from("configuracion_encabezado" as any).select("*").limit(1).single(),
          ...allFormIds.map(id => fetchFormById(id)),
        ]);

        if (headerResult.data) {
          setHeaderConfig(headerResult.data);
        }

        const newFormsMap: Record<string, FormEntry> = {};

        formResults.forEach((result, idx) => {
          const fId = allFormIds[idx];
          if (result.form) {
            const qs = result.form.questions as QuestionData[] || [];
            newFormsMap[fId] = {
              id: fId,
              questions: qs,
              title: result.form.title,
              description: result.form.description,
              formType: result.form.formType || "historia_clinica",
              formData: {},
              saved: false,
              isDirty: false,
            };

            // Restore draft
            const dk = `kerhub-draft-${fId}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`;
            try {
              const savedDraft = localStorage.getItem(dk);
              if (savedDraft) {
                newFormsMap[fId].formData = { ...newFormsMap[fId].formData, ...JSON.parse(savedDraft) };
              }
            } catch { /* ignore */ }
          }
          if (result.error && idx === 0) {
            setError(result.error);
          }
        });

        setFormsMap(newFormsMap);
        setActiveFormId(allFormIds[0]);
        draftRestoredRef.current = true;
      } catch (error) {
        console.error('Error loading forms:', error);
        setError("Error al cargar el formulario");
      } finally {
        setLoading(false);
      }
    };

    loadAllForms();
  }, [allFormIds.join(','), patientId]);

  const dynamicSchema = createDynamicSchema(questions);
  
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: formData,
  });

  // Reset form values when switching tabs
  useEffect(() => {
    if (activeEntry) {
      form.reset(activeEntry.formData);
    }
  }, [activeFormId]);

  const handleInputChange = (id: string, value: any) => {
    setFormsMap(prev => ({
      ...prev,
      [activeFormId]: {
        ...prev[activeFormId],
        formData: { ...prev[activeFormId]?.formData, [id]: value },
        isDirty: true,
      }
    }));
  };

  const processFormValues = (qs: QuestionData[], fd: FormData, rawValues: any) => {
    const processedValues = { ...rawValues };
    qs.forEach(question => {
      if (question.type === "vitals") {
        const predefined = question.predefinedVitals;
        if (predefined) {
          const vitalsData: Record<string, any> = {};
          Object.entries(predefined).forEach(([key, v]) => {
            if (v.enabled) {
              vitalsData[key] = fd[`${question.id}_${key}`] || "";
            }
          });
          (question.customVitals || []).forEach(cv => {
            vitalsData[`custom_${cv.id}`] = fd[`${question.id}_custom_${cv.id}`] || "";
          });
          processedValues[question.id] = vitalsData;
        } else if (question.vitalType === "TA") {
          processedValues[question.id] = { sys: fd[`${question.id}_sys`], dia: fd[`${question.id}_dia`] };
        } else if (question.vitalType === "IMC") {
          processedValues[question.id] = { weight: fd[`${question.id}_weight`], height: fd[`${question.id}_height`], bmi: fd[`${question.id}_bmi`] };
        }
      } else if (question.type === "clinical") {
        processedValues[question.id] = { title: fd[`${question.id}_title`], detail: fd[`${question.id}_detail`] };
      } else if (question.type === "multifield" && question.multifields) {
        const multifieldValues: Record<string, string> = {};
        question.multifields.forEach(field => {
          multifieldValues[field.id] = fd[`${question.id}_${field.id}`] || '';
        });
        processedValues[question.id] = multifieldValues;
      } else if (question.type === "scored_checkbox" || question.type === "score_total") {
        processedValues[question.id] = fd[question.id] || { score: 0 };
      }
    });
    return processedValues;
  };

  // ── "Completar atención" handler ──
  const handleCompleteAttention = async () => {
    setIsCompletingAttention(true);
    const failedForms: string[] = [];

    // Save all dirty forms
    for (const fId of allFormIds) {
      const entry = formsMap[fId];
      if (!entry) continue;
      if (entry.isDirty) {
        const success = await saveFormToDb(fId, true);
        if (!success) {
          failedForms.push(entry.title);
        }
      }
    }

    if (failedForms.length > 0) {
      uiToast({
        title: "Error al completar",
        description: `No se pudieron guardar: ${failedForms.join(', ')}`,
        variant: "destructive",
      });
      setIsCompletingAttention(false);
      return;
    }

    // Update admission status if valid UUID
    if (consultationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultationId)) {
      const { error: admError } = await supabase
        .from("admisiones" as any)
        .update({ estado: 'completada', fecha_fin: new Date().toISOString() })
        .eq('id', consultationId);
      if (admError) {
        uiToast({ title: "Error al completar admisión", description: admError.message, variant: "destructive" });
        setIsCompletingAttention(false);
        return;
      }
    }

    // Clear all drafts
    for (const fId of allFormIds) {
      const dk = `kerhub-draft-${fId}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`;
      localStorage.removeItem(dk);
    }

    if (isEmbedded && formId) {
      window.parent.postMessage({ type: 'formCompleted', formId }, '*');
    }

    setIsCompletingAttention(false);
    setIsCompleted(true);
    setShowCompletedDialog(true);
  };

  // ── Navigation with protection ──
  const handleNavigateBack = useCallback(() => {
    if (hasAnyDirty) {
      if (patientId) {
        const params = new URLSearchParams({ patientId });
        if (formId) params.set('selectedForms', formId);
        pendingNavigationRef.current = `/app/pacientes/nueva-consulta?${params.toString()}`;
      } else {
        pendingNavigationRef.current = -1;
      }
      setShowExitDialog(true);
    } else {
      if (patientId) {
        const params = new URLSearchParams({ patientId });
        if (formId) params.set('selectedForms', formId);
        navigate(`/app/pacientes/nueva-consulta?${params.toString()}`);
      } else {
        navigate(-1);
      }
    }
  }, [hasAnyDirty, patientId, formId, navigate]);

  const handleExitSaveAndLeave = async () => {
    setShowExitDialog(false);
    for (const fId of allFormIds) {
      const entry = formsMap[fId];
      if (entry?.isDirty) {
        await saveFormToDb(fId);
      }
    }
    const target = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (typeof target === 'number') navigate(target);
    else if (target) navigate(target);
  };

  const handleExitWithoutSaving = () => {
    setShowExitDialog(false);
    const target = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (typeof target === 'number') navigate(target);
    else if (target) navigate(target);
  };

  // Legacy onSubmit kept for non-clinical layouts
  const onSubmit = async (values: z.infer<typeof dynamicSchema>) => {
    const processedValues = processFormValues(questions, formData, values);
    setPendingValues(processedValues);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingValues) return;
    setShowConfirmModal(false);

    const { data: { user } } = await supabase.auth.getUser();
    const medicoId = user?.id;

    if (patientId && !medicoId) {
      uiToast({ title: "Error de autenticación", description: "Debes iniciar sesión para guardar respuestas.", variant: "destructive" });
      return;
    }

    const formsToSave: { fId: string; data: any }[] = [];

    for (const fId of allFormIds) {
      const entry = formsMap[fId];
      if (!entry) continue;
      if (fId === activeFormId) {
        const { _patientId, _consultationId, ...cleanData } = pendingValues;
        formsToSave.push({ fId, data: cleanData });
      } else {
        const processed = processFormValues(entry.questions, entry.formData, entry.formData);
        formsToSave.push({ fId, data: processed });
      }
    }

    let hadError = false;
    for (const { fId, data } of formsToSave) {
      if (patientId && medicoId) {
        const { error: insertError } = await supabase
          .from("respuestas_formularios" as any)
          .insert({
            formulario_id: fId,
            paciente_id: patientId,
            admision_id: consultationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultationId) ? consultationId : null,
            medico_id: medicoId,
            datos_respuesta: data,
          });
        if (insertError) {
          uiToast({ title: "Error al guardar", description: `${formsMap[fId]?.title}: ${insertError.message}`, variant: "destructive" });
          hadError = true;
          continue;
        }
      } else {
        saveFormResponse(fId, { ...data, _patientId: patientId, _consultationId: consultationId });
      }
      const dk = `kerhub-draft-${fId}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`;
      localStorage.removeItem(dk);

      setFormsMap(prev => ({
        ...prev,
        [fId]: { ...prev[fId], saved: true, isDirty: false },
      }));
    }

    if (!hadError) {
      const savedCount = formsToSave.length;
      uiToast({
        title: "✅ Formulario guardado exitosamente",
        description: savedCount > 1
          ? `${savedCount} formularios guardados — ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`
          : `${formTitle} — ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`,
      });
    }

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
              onClick={handleNavigateBack}
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
              <h1 className="text-lg font-semibold">
                {isMultiForm ? 'Consulta' : formTitle}
              </h1>
              {!isMultiForm && formDescription && (
                <p className="text-xs text-muted-foreground">{formDescription}</p>
              )}
              {isMultiForm && (
                <p className="text-xs text-muted-foreground">{allFormIds.length} formularios</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showRegistro ? (
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => {
                setShowRegistro(false);
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
            {canCreateOrders && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                    <ClipboardPlus className="w-3.5 h-3.5" />
                    Órdenes
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => toast("Próximamente")} className="flex items-center gap-2 text-sm">
                    <Pill className="w-4 h-4 text-muted-foreground" />
                    Medicamentos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast("Próximamente")} className="flex items-center gap-2 text-sm">
                    <TestTube className="w-4 h-4 text-muted-foreground" />
                    Laboratorio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast("Próximamente")} className="flex items-center gap-2 text-sm">
                    <Scan className="w-4 h-4 text-muted-foreground" />
                    Imagenología
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast("Próximamente")} className="flex items-center gap-2 text-sm">
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    Interconsulta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast("Próximamente")} className="flex items-center gap-2 text-sm">
                    <Scissors className="w-4 h-4 text-muted-foreground" />
                    Procedimientos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toast("Próximamente")} className="flex items-center gap-2 text-sm">
                    <List className="w-4 h-4 text-muted-foreground" />
                    Ver órdenes del paciente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          isCompleted ? (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] tracking-wide uppercase" style={{ color: '#15803d' }}>
              <CheckCircle className="w-3 h-3" />
              Atención completada
            </div>
          ) : (
            <p className="mt-1.5 text-[10px] text-muted-foreground tracking-wide uppercase">
              ● Consulta en curso
            </p>
          )
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
              {/* Multi-form chevron tabs + add button */}
              {!showRegistro && (
                <div className="mb-4 overflow-x-auto scrollbar-none">
                  <div className="flex items-center gap-0 min-w-0">
                    {isMultiForm && allFormIds.map((fId, idx) => {
                      const entry = formsMap[fId];
                      if (!entry) return null;
                      const isActive = fId === activeFormId;
                      const isFirst = idx === 0;
                      return (
                        <button
                          key={fId}
                          type="button"
                          onClick={() => handleTabSwitch(fId)}
                          className={`shrink-0 h-9 px-4 text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                          style={{
                            clipPath: isFirst
                              ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                              : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
                            marginLeft: isFirst ? 0 : '-4px',
                            paddingRight: '1.25rem',
                            paddingLeft: isFirst ? '0.75rem' : '1.25rem',
                          }}
                        >
                          <span className="max-w-[160px] truncate">{entry.title}</span>
                          {/* Dirty/saved indicator dot */}
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            entry.isDirty
                              ? 'bg-orange-400'
                              : entry.saved
                                ? 'bg-green-500'
                                : 'bg-transparent'
                          }`} />
                        </button>
                      );
                    })}
                    {/* Add form button */}
                    <button
                      type="button"
                      onClick={() => setShowAddFormDialog(true)}
                      className="shrink-0 w-7 h-7 rounded-full bg-muted hover:bg-muted-foreground/10 flex items-center justify-center ml-2 transition-colors"
                      title="Agregar formulario"
                    >
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                    {/* Save status indicator */}
                    {saveStatus !== 'idle' && (
                      <span className="ml-3 text-xs text-muted-foreground flex items-center gap-1 shrink-0 animate-in fade-in duration-200">
                        {saveStatus === 'saving' && (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Guardando...</>
                        )}
                        {saveStatus === 'saved' && (
                          <><Check className="w-3 h-3 text-green-500" /> Guardado</>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Add form dialog */}
              <Dialog open={showAddFormDialog} onOpenChange={setShowAddFormDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar formulario</DialogTitle>
                  </DialogHeader>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre..."
                      value={addFormSearch}
                      onChange={e => setAddFormSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ScrollArea className="h-[280px]">
                    {addFormLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Buscando...</p>
                    ) : addFormResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No se encontraron formularios</p>
                    ) : (
                      <div className="space-y-1 pr-3">
                        {addFormResults.map(f => {
                          const alreadyAdded = allFormIds.includes(f.id);
                          return (
                            <button
                              key={f.id}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => handleAddNewForm(f.id)}
                              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{f.titulo}</p>
                                <p className="text-[11px] text-muted-foreground">{f.tipo}</p>
                              </div>
                              {alreadyAdded && (
                                <Badge variant="secondary" className="text-[10px] shrink-0">Agregado</Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <FormHeaderPreview config={headerConfig} formTitle={formTitle} />
              <FormProvider {...form}>
                <Form {...form}>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-3 max-w-none">
                    {questions.map(question => (
                      <QuestionRenderer
                        key={question.id}
                        question={question}
                        formData={formData}
                        onChange={handleInputChange}
                        errors={form.formState.errors}
                      />
                    ))}
                    <div className="h-12" />
                  </form>
                </Form>
              </FormProvider>
              <div className="sticky bottom-4 flex justify-end pointer-events-none print:hidden">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCompleteAttention}
                  disabled={isCompletingAttention}
                  className="rounded-full shadow-lg pointer-events-auto gap-1.5 h-9 px-4 text-xs"
                >
                  {isCompletingAttention ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  Completar atención
                </Button>
              </div>
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

      {/* Confirmation Modal (legacy for non-clinical) */}
      <ConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSave}
        formTitle={formTitle}
        getFilledFieldsSummary={getFilledFieldsSummary}
      />

      {/* Exit protection dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Cambios sin guardar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar en {dirtyCount} formulario(s). ¿Qué deseas hacer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <Button variant="destructive" className="rounded-xl" onClick={handleExitWithoutSaving}>
              Salir sin guardar
            </Button>
            <Button className="rounded-xl gap-1.5" onClick={handleExitSaveAndLeave}>
              <Save className="w-4 h-4" />
              Guardar y salir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
