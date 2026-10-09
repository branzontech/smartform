
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { db } from "@/integrations/data/client";
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
import { SectionedForm } from "@/components/forms/form-viewer/SectionedForm";
import { hasPartialAnswer, isAnswerable, missingRequired } from "@/components/forms/form-viewer/answers";
import { QuestionData } from '@/components/forms/question/types';
import { FormTitle } from '@/components/ui/form-title';
import { BackButton } from '@/App';
import { Check, Link as LinkIcon, Printer, AlertTriangle, CalendarIcon, ClipboardList, PanelRightClose, PanelRightOpen, GripVertical, MoreHorizontal, ArrowLeft, Save, Plus, Search, CheckCircle, Loader2, AlertCircle, Clock, XCircle, Circle, CalendarDays, Eye, Repeat } from 'lucide-react';
import { ChangeHistoryDialog } from '@/components/forms/ChangeHistoryDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Form as FormType } from './FormsPage';
import { FormLoading } from '@/components/forms/form-viewer/form-loading';
import { FormError } from '@/components/forms/form-viewer/form-error';
import { FormSubmissionSuccess } from '@/components/forms/form-viewer/form-submission-success';
import { createDynamicSchema, fetchFormById, saveFormResponse } from '@/utils/form-utils';
import { useToast } from '@/hooks/use-toast';
import { ORDER_TYPES, OrderTabContent } from '@/components/orders/RightPanelTabs';
import { PatientHistoryPanel } from '@/components/patients/PatientHistoryPanel';
import { FolderTabs, type FolderTab } from '@/components/kit/tabs/FolderTabs';

/** Pestañas de la consulta (como en Magnet): la historia en curso y, a la mano, registros, antecedentes y cada tipo de orden. */
const CONSULT_TABS: FolderTab<string>[] = [
  { id: "historia", title: "Historia clínica", pinned: true },
  { id: "registros", title: "Historial de registros" },
  { id: "antecedentes", title: "Antecedentes" },
  ...ORDER_TYPES.map((o) => ({ id: `orden-${o.type}`, title: o.label })),
];
/** Como en Magnet: al inicio solo la historia; el médico ancla desde «Más» las que use. */
const CONSULT_INITIAL_TABS = ["historia"];
import { FormHeaderPreview } from '@/components/forms/FormHeaderPreview';
import { useAuth } from '@/contexts/AuthContext';

import { PatientHeaderBanner } from '@/components/forms/PatientHeaderBanner';
import { RecordsHistory } from '@/components/forms/registros/RecordsHistory';
import { IncapacidadDialog } from '@/components/incapacidades/IncapacidadDialog';
import { IncapacidadPreviewDialog } from '@/components/incapacidades/IncapacidadPreviewDialog';
import { useIncapacidadesByAdmision } from '@/hooks/useIncapacidades';
import type { IncapacidadLike } from '@/utils/incapacidades/incapacidad-document';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
  /** Versión de las preguntas con que se diligencia (la del registro guardado o la vigente). */
  version?: number;
  formData: FormData;
  saved: boolean;
  isDirty: boolean;
  responseId?: string;
  lastSavedTime?: string;
  saveError?: boolean;
}

const PANEL_WIDTH_KEY = 'kerhub-antecedentes-panel-width';
const PANEL_COLLAPSED_KEY = 'kerhub-antecedentes-panel-collapsed';
const DEFAULT_PANEL_WIDTH = 380;
const MIN_PANEL_WIDTH = 280;
const MIN_FORM_WIDTH = 400;
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds
const SAVED_STATUS_DURATION_MS = 2000;
const EMPTY_FORM_DATA: FormData = {};
const EMPTY_QUESTIONS: QuestionData[] = [];

const FormViewer = () => {
  const { id: formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const draftRestoredRef = useRef(false);
  /** Último formsMap: lo leen el autoguardado y los guardados en curso sin cierres desactualizados. */
  const formsMapRef = useRef<Record<string, FormEntry>>({});
  /** id de la respuesta ya creada por formato: evita insertar dos veces si dos guardados coinciden. */
  const responseIdsRef = useRef<Record<string, string>>({});
  const savesInFlightRef = useRef<Record<string, Promise<boolean>>>({});
  /** Versión del contenido por formato: lo escrito durante un guardado no queda marcado como guardado. */
  const versionRef = useRef<Record<string, number>>({});
  const loadedOnceRef = useRef(false);
  /** Sube cada vez que llegan formatos: los campos se rellenan con el borrador recuperado. */
  const [loadCount, setLoadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [headerConfig, setHeaderConfig] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingValues, setPendingValues] = useState<any>(null);
  const [showRegistro, setShowRegistro] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState("historia");
  const workspaceRef = useRef<HTMLDivElement>(null);
  // Al cambiar de pestaña el área vuelve arriba: si no, el contenido nuevo queda fuera de la vista.
  const openWorkspaceTab = (tabId: string) => {
    setWorkspaceTab(tabId);
    workspaceRef.current?.scrollTo({ top: 0 });
  };
  const [showIncapacidadDialog, setShowIncapacidadDialog] = useState(false);
  const [previewIncapacidad, setPreviewIncapacidad] = useState<IncapacidadLike | null>(null);
  const { hasRole, user: authUser } = useAuth();
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
  const [showChangeHistory, setShowChangeHistory] = useState(false);
  // Aviso tras cambiar de historia: cuántos campos pasaron de la equivocada a la correcta.
  useEffect(() => {
    const carried = sessionStorage.getItem("kerhub-history-changed");
    if (carried === null) return;
    sessionStorage.removeItem("kerhub-history-changed");
    uiToast({
      title: "Historia clínica cambiada",
      description: Number(carried) > 0 ? `${carried} campo(s) pasaron de la historia anterior: revísalos y vuelve a firmar.` : "La historia anterior no tenía campos en común con esta.",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir la consulta
  }, []);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationIssues, setValidationIssues] = useState<{formId: string; title: string; missingCount: number}[]>([]);
  const [showEmptyFormDialog, setShowEmptyFormDialog] = useState(false);
  const [emptyFormIds, setEmptyFormIds] = useState<string[]>([]);
  const [validationErrorsByForm, setValidationErrorsByForm] = useState<Record<string, string[]>>({});


  // Panel resize state

  // Panel resize state
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem(PANEL_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_PANEL_WIDTH;
  });
  // Always start expanded when entering an attention; user may collapse during the session
  const [isCollapsed, setIsCollapsed] = useState(false);
  const previousWidthRef = useRef(panelWidth);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelStateBeforeRegistroRef = useRef<boolean | null>(null);

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get("patientId");
  const consultationId = queryParams.get("consultationId");
  const isEmbedded = queryParams.get("embedded") === "true";
  const formsParam = queryParams.get("forms") || '';
  const extraFormIds = React.useMemo(() => formsParam.split(',').filter(Boolean), [formsParam]);

  // Resolve real DB admission UUID (consultationId might be a nanoid from localStorage)
  const isConsultationUUID = consultationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultationId);
  const [resolvedAdmisionId, setResolvedAdmisionId] = useState<string | null>(isConsultationUUID ? consultationId : null);

  useEffect(() => {
    if (isConsultationUUID) {
      setResolvedAdmisionId(consultationId);
      return;
    }
    if (!patientId) return;
    let vigente = true;
    const fetchActiveAdmission = async () => {
      const { data } = await db
        .from('admisiones')
        .select('id')
        .eq('paciente_id', patientId)
        .in('estado', ['en_curso', 'planificada'])
        .order('fecha_inicio', { ascending: false })
        .limit(1);
      if (vigente && data && data.length > 0) {
        setResolvedAdmisionId(data[0].id);
      }
    };
    fetchActiveAdmission();
    return () => { vigente = false; };
  }, [patientId, consultationId, isConsultationUUID]);

  // Incapacidades for this admission
  const { data: incapacidadesList = [] } = useIncapacidadesByAdmision(resolvedAdmisionId);
  const incapacidadCount = incapacidadesList.filter(i => i.estado === "activa").length;

  // Build ordered list of all form IDs (keyed by content so equal lists keep the same reference)
  const dynamicFormIdsKey = dynamicFormIds.join(',');
  const allFormIds = React.useMemo(() => {
    const ids: string[] = [];
    if (formId) ids.push(formId);
    extraFormIds.forEach(id => { if (!ids.includes(id)) ids.push(id); });
    dynamicFormIdsKey.split(',').filter(Boolean).forEach(id => { if (!ids.includes(id)) ids.push(id); });
    return ids;
  }, [formId, extraFormIds, dynamicFormIdsKey]);

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
      let q = db.from('formularios').select('id, titulo, tipo').eq('estado', 'activo').limit(20);
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

  const handleRemoveForm = useCallback((targetId: string) => {
    // Do not allow removing the primary form (the one in the route)
    if (targetId === formId) {
      toast("No se puede quitar el formulario principal");
      return;
    }
    // Remove from dynamic and extra (URL) lists
    setDynamicFormIds(prev => prev.filter(id => id !== targetId));
    if (extraFormIds.includes(targetId)) {
      const remainingExtras = extraFormIds.filter(id => id !== targetId);
      const params = new URLSearchParams(location.search);
      if (remainingExtras.length > 0) {
        params.set('forms', remainingExtras.join(','));
      } else {
        params.delete('forms');
      }
      navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`, { replace: true });
    }
    // Drop from formsMap
    setFormsMap(prev => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
    // If active tab is being removed, switch to another available form
    if (activeFormId === targetId) {
      const remaining = allFormIds.filter(id => id !== targetId);
      if (remaining.length > 0) setActiveFormId(remaining[0]);
    }
    toast.success("Formulario quitado de la consulta");
  }, [formId, extraFormIds, location.pathname, location.search, navigate, activeFormId, allFormIds]);

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
          version: result.form!.version,
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
  formsMapRef.current = formsMap;
  const activeEntry = formsMap[activeFormId];
  // Historia clínica de la consulta: el formato principal (el de la ruta) cuando es una historia.
  const historyEntry = formId && formsMap[formId]?.formType === "historia_clinica" ? formsMap[formId] : undefined;
  const formData = activeEntry?.formData || EMPTY_FORM_DATA;
  const questions = activeEntry?.questions || EMPTY_QUESTIONS;
  const formTitle = activeEntry?.title || "Formulario";
  const formDescription = activeEntry?.description || "";
  const formType = activeEntry?.formType || "historia_clinica";

  // Draft cache key
  const draftKey = `kerhub-draft-${activeFormId || 'unknown'}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`;

  // Auto-save draft to localStorage (debounced 500ms)
  useEffect(() => {
    if (!draftRestoredRef.current) return;
    if (submitted) return;
    // Solo cambios pendientes: lo ya guardado en la base no necesita borrador.
    if (!activeEntry?.isDirty) return;
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
  }, [formData, draftKey, submitted, activeEntry?.isDirty]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  // Persist panel prefs
  useEffect(() => {
    localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
  }, [panelWidth]);
  // Collapsed state intentionally NOT persisted — panel always opens expanded by default

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
  // Un solo guardado por formato a la vez: si ya hay uno en curso se espera ese.
  const saveFormToDb = useCallback((fId: string, showToast = false): Promise<boolean> => {
    const pending = savesInFlightRef.current[fId];
    if (pending) return pending;
    const run = (async (): Promise<boolean> => {
      const entry = formsMapRef.current[fId];
      if (!entry) return false;
      const startVersion = versionRef.current[fId] ?? 0;

      const { data: { user } } = await db.auth.getUser();
      const medicoId = user?.id;
      if (patientId && !medicoId) {
        if (showToast) uiToast({ title: "Tu sesión caducó", description: "Vuelve a iniciar sesión para guardar.", variant: "destructive" });
        return false;
      }

      const processed = processFormValues(entry.questions, entry.formData, entry.formData);

      if (patientId && medicoId) {
        const existingId = entry.responseId ?? responseIdsRef.current[fId];
        if (existingId) {
          const { error: updateError } = await db
            .from("respuestas_formularios" as any)
            .update({ datos_respuesta: processed, updated_at: new Date().toISOString() })
            .eq('id', existingId);
          if (updateError) {
            if (showToast) uiToast({ title: "No se pudo guardar", description: `${entry.title}: ${updateError.message}`, variant: "destructive" });
            setFormsMap(prev => ({ ...prev, [fId]: { ...prev[fId], saveError: true } }));
            return false;
          }
        } else {
          const { data: insertData, error: insertError } = await db
            .from("respuestas_formularios" as any)
            .insert({
              formulario_id: fId,
              // La versión que el profesional tenía abierta, aunque el formato haya cambiado mientras tanto.
              formulario_version: entry.version,
              paciente_id: patientId,
              admision_id: resolvedAdmisionId,
              medico_id: medicoId,
              datos_respuesta: processed,
              // Para reabrir la consulta con lo ya guardado (la consulta aún no es una tabla).
              fhir_extensions: consultationId ? { consulta_id: consultationId } : {},
            })
            .select('id')
            .single();
          if (insertError) {
            if (showToast) uiToast({ title: "No se pudo guardar", description: `${entry.title}: ${insertError.message}`, variant: "destructive" });
            setFormsMap(prev => ({ ...prev, [fId]: { ...prev[fId], saveError: true } }));
            return false;
          }
          const newId = (insertData as any)?.id as string | undefined;
          if (newId) responseIdsRef.current[fId] = newId;
          setFormsMap(prev => ({ ...prev, [fId]: { ...prev[fId], responseId: newId } }));
        }
      } else {
        saveFormResponse(fId, { ...processed, _patientId: patientId, _consultationId: consultationId });
      }

      const changedMeanwhile = (versionRef.current[fId] ?? 0) !== startVersion;
      if (!changedMeanwhile) {
        localStorage.removeItem(`kerhub-draft-${fId}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`);
      }
      const timeStr = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setFormsMap(prev => ({
        ...prev,
        [fId]: { ...prev[fId], saved: true, isDirty: changedMeanwhile, lastSavedTime: timeStr, saveError: false },
      }));
      return true;
    })();
    savesInFlightRef.current[fId] = run;
    run.finally(() => { delete savesInFlightRef.current[fId]; });
    return run;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lee formsMapRef; processFormValues es estable en la práctica
  }, [patientId, consultationId, uiToast, resolvedAdmisionId]);

  // ── Helper: check if form has no responses ──
  const isFormEmpty = useCallback((fId: string): boolean => {
    const entry = formsMap[fId];
    if (!entry) return true;
    return !entry.questions.some(q => hasPartialAnswer(q, entry.formData));
  }, [formsMap]);

  // ── Show "saved" briefly, then go back to idle ──
  const markSavedBriefly = useCallback(() => {
    setSaveStatus('saved');
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), SAVED_STATUS_DURATION_MS);
  }, []);

  // Clear the pending "saved" timer on unmount
  useEffect(() => () => {
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
  }, []);

  // ── Autosave on tab switch ──
  const handleTabSwitch = useCallback(async (targetFormId: string) => {
    if (targetFormId === activeFormId) return;

    const currentEntry = formsMap[activeFormId];
    if (currentEntry?.isDirty && !isFormEmpty(activeFormId)) {
      setSaveStatus('saving');
      const success = await saveFormToDb(activeFormId);
      if (!success) {
        setSaveStatus('idle');
        uiToast({ title: "Error al guardar", description: `No se pudo guardar "${currentEntry.title}". Corrige los errores antes de cambiar de formulario.`, variant: "destructive" });
        return;
      }
      markSavedBriefly();
    }

    setActiveFormId(targetFormId);
  }, [activeFormId, formsMap, saveFormToDb, uiToast, isFormEmpty, markSavedBriefly]);

  // ── 30s interval autosave ──
  const saveRef = useRef(saveFormToDb);
  saveRef.current = saveFormToDb;
  const allFormIdsRef = useRef<string[]>([]);
  allFormIdsRef.current = allFormIds;
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!draftRestoredRef.current) return;
      for (const fId of allFormIdsRef.current) {
        const entry = formsMapRef.current[fId];
        if (entry?.isDirty && entry.questions.some(q => hasPartialAnswer(q, entry.formData))) {
          setSaveStatus('saving');
          await saveRef.current(fId);
          markSavedBriefly();
        }
      }
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [markSavedBriefly]);

  // ── Load all forms ──
  // Solo carga los formatos que aún no están: agregar uno a mitad de consulta no
  // borra lo escrito en los demás ni pierde sus respuestas ya guardadas.
  useEffect(() => {
    let vigente = true;
    const loadMissingForms = async () => {
      const toLoad = allFormIds.filter(id => !formsMapRef.current[id]);
      if (toLoad.length === 0) return;
      const firstLoad = !loadedOnceRef.current;
      if (firstLoad) {
        setLoading(true);
        setError("");
      }
      try {
        const [headerResult, ...formResults] = await Promise.all([
          firstLoad
            ? db.from("configuracion_encabezado" as any).select("*").limit(1).single()
            : Promise.resolve({ data: null }),
          ...toLoad.map(id => fetchFormById(id)),
        ] as Promise<any>[]);
        if (!vigente) return;
        if (headerResult?.data) setHeaderConfig(headerResult.data);

        // Respuestas ya guardadas de esta consulta: se recuperan al reabrirla.
        const savedByForm: Record<string, { id: string; datos: Record<string, any>; version?: number }> = {};
        if (patientId && consultationId) {
          const { data: savedRows } = await db
            .from("respuestas_formularios" as any)
            .select("id, formulario_id, formulario_version, admision_id, datos_respuesta, fhir_extensions")
            .eq("paciente_id", patientId)
            // Un registro anulado (p. ej. historia equivocada) no vuelve a la consulta.
            .eq("estado_registro", "active")
            .in("formulario_id", toLoad)
            .order("created_at", { ascending: false })
            .limit(50);
          if (!vigente) return;
          for (const row of (savedRows as any[]) ?? []) {
            const sameConsultation = row.fhir_extensions?.consulta_id === consultationId || (isConsultationUUID && row.admision_id === consultationId);
            if (sameConsultation && !savedByForm[row.formulario_id]) {
              savedByForm[row.formulario_id] = { id: row.id, datos: row.datos_respuesta ?? {}, version: row.formulario_version ?? undefined };
            }
          }
        }

        // Un registro ya guardado se retoma con las preguntas de su versión, no con las del formato editado después.
        const versionQuestions: Record<string, { preguntas: QuestionData[]; version: number }> = {};
        const outdated = toLoad.filter((fId, idx) => {
          const saved = savedByForm[fId];
          const current = formResults[idx]?.form?.version;
          return saved?.version && current && saved.version !== current;
        });
        if (outdated.length) {
          const { data: versionRows } = await db
            .from("formularios_versiones" as any)
            .select("formulario_id, version, preguntas")
            .in("formulario_id", outdated);
          if (!vigente) return;
          for (const row of (versionRows as any[]) ?? []) {
            if (row.version === savedByForm[row.formulario_id]?.version) {
              versionQuestions[row.formulario_id] = { preguntas: row.preguntas ?? [], version: row.version };
            }
          }
        }

        const newFormsMap: Record<string, FormEntry> = {};
        formResults.forEach((result: any, idx: number) => {
          const fId = toLoad[idx];
          if (result.form) {
            newFormsMap[fId] = {
              id: fId,
              questions: versionQuestions[fId]?.preguntas ?? ((result.form.questions as QuestionData[]) || []),
              title: result.form.title,
              description: result.form.description,
              formType: result.form.formType || "historia_clinica",
              version: versionQuestions[fId]?.version ?? savedByForm[fId]?.version ?? result.form.version,
              formData: savedByForm[fId]?.datos ?? {},
              saved: !!savedByForm[fId],
              isDirty: false,
              responseId: savedByForm[fId]?.id,
            };
            if (savedByForm[fId]) responseIdsRef.current[fId] = savedByForm[fId].id;
            // Borrador temporal (cambios aún no guardados, más recientes que la base)
            const dk = `kerhub-draft-${fId}${patientId ? `-${patientId}` : ''}${consultationId ? `-${consultationId}` : ''}`;
            try {
              const savedDraft = localStorage.getItem(dk);
              if (savedDraft) {
                const draft = JSON.parse(savedDraft) as Record<string, unknown>;
                const base = newFormsMap[fId].formData;
                // Pendiente solo si el borrador trae algo distinto de lo guardado.
                const differs = Object.keys(draft).some(k => JSON.stringify(draft[k]) !== JSON.stringify(base[k]));
                newFormsMap[fId].formData = { ...base, ...draft };
                newFormsMap[fId].isDirty = differs;
                if (!differs) localStorage.removeItem(dk);
              }
            } catch { /* borrador ilegible: se ignora */ }
          }
          if (result.error && firstLoad && idx === 0) setError(result.error);
        });

        setFormsMap(prev => ({ ...newFormsMap, ...prev }));
        setLoadCount(c => c + 1);
        if (firstLoad) setActiveFormId(allFormIds[0]);
        loadedOnceRef.current = true;
        draftRestoredRef.current = true;
      } catch {
        if (vigente) setError("No se pudo cargar el formulario. Intenta de nuevo.");
      } finally {
        if (vigente && firstLoad) setLoading(false);
      }
    };
    loadMissingForms();
    return () => { vigente = false; };
  }, [allFormIds, patientId, consultationId]);

  const dynamicSchema = createDynamicSchema(questions);
  
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: formData,
  });

  // Rellena los campos al cambiar de pestaña y al terminar de cargar (borrador recuperado)
  useEffect(() => {
    if (activeEntry) {
      form.reset(activeEntry.formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de pestaña o al cargar; con activeEntry se reiniciaría en cada tecla
  }, [activeFormId, loadCount]);

  const handleInputChange = (id: string, value: any) => {
    versionRef.current[activeFormId] = (versionRef.current[activeFormId] ?? 0) + 1;
    setFormsMap(prev => ({
      ...prev,
      [activeFormId]: {
        ...prev[activeFormId],
        formData: { ...prev[activeFormId]?.formData, [id]: value },
        isDirty: true,
        saveError: false,
      }
    }));
    setValidationErrorsByForm(prev => {
      const errors = prev[activeFormId];
      if (!errors) return prev;
      const updated = errors.filter(e => e !== id);
      if (updated.length === errors.length) return prev;
      return { ...prev, [activeFormId]: updated };
    });
  };

  

  // ── Helper: check if a vitals question has at least one value ──
  const vitalsHasData = useCallback((formData: Record<string, any>, qId: string): boolean => {
    return Object.keys(formData).some(key => {
      if (!key.startsWith(`${qId}_`)) return false;
      const v = formData[key];
      return v !== undefined && v !== null && v !== '';
    });
  }, []);

  // ── Helper: get missing required fields ──
  const getRequiredFieldErrors = useCallback((fId: string): string[] => {
    const entry = formsMap[fId];
    if (!entry) return [];
    return missingRequired(entry.questions.filter(isAnswerable), entry.formData).map(q => q.id);
  }, [formsMap]);

  // ── Helper: check if form has any response ──
  const formHasAnyResponse = useCallback((fId: string): boolean => {
    const entry = formsMap[fId];
    if (!entry) return false;
    return entry.questions.some(q => hasPartialAnswer(q, entry.formData));
  }, [formsMap]);

  // ── Helper: check if all required fields are filled ──
  const allRequiredFilled = useCallback((fId: string): boolean => {
    return getRequiredFieldErrors(fId).length === 0;
  }, [getRequiredFieldErrors]);

  // ── Helper: get form status for display ──
  type FormStatusType = 'sin_diligenciar' | 'en_progreso_sin_guardar' | 'guardado_parcial' | 'completo_guardado' | 'error';
  const getFormStatus = useCallback((fId: string): { label: string; color: string; status: FormStatusType } => {
    const entry = formsMap[fId];
    if (!entry) return { label: 'Sin diligenciar', color: 'hsl(var(--muted-foreground))', status: 'sin_diligenciar' };
    if (entry.saveError) return { label: 'Error al guardar', color: '#dc2626', status: 'error' };

    const hasData = formHasAnyResponse(fId);
    if (!hasData) return { label: 'Sin diligenciar', color: 'hsl(var(--muted-foreground))', status: 'sin_diligenciar' };

    const reqFilled = allRequiredFilled(fId);

    if (entry.isDirty) return { label: 'En progreso - Sin guardar', color: '#f97316', status: 'en_progreso_sin_guardar' };
    if (entry.saved && reqFilled) return { label: `Completo - Guardado ✓ ${entry.lastSavedTime || ''}`, color: '#16a34a', status: 'completo_guardado' };
    if (entry.saved && !reqFilled) return { label: `En progreso - Guardado parcial ✓ ${entry.lastSavedTime || ''}`, color: '#f97316', status: 'guardado_parcial' };
    return { label: 'En progreso - Sin guardar', color: '#f97316', status: 'en_progreso_sin_guardar' };
  }, [formsMap, formHasAnyResponse, allRequiredFilled]);

  const handleSaveActive = async () => {
    const fId = activeFormId;
    const entry = formsMap[fId];
    if (!entry || isCompleted) return;
    setSaveStatus('saving');
    const ok = await saveFormToDb(fId, true);
    if (!ok) { setSaveStatus('idle'); return; }
    markSavedBriefly();
    const missing = getRequiredFieldErrors(fId);
    setValidationErrorsByForm(prev => ({ ...prev, [fId]: missing }));
    if (missing.length > 0) {
      uiToast({
        title: "Guardado parcial",
        description: missing.length === 1
          ? `Falta 1 campo obligatorio en «${entry.title}». Está marcado en rojo.`
          : `Faltan ${missing.length} campos obligatorios en «${entry.title}». Están marcados en rojo.`,
      });
      document.querySelector(`[id^="q-${missing[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      uiToast({ title: "Formato guardado", description: `«${entry.title}» está completo.` });
    }
  };
  const saveActiveRef = useRef(handleSaveActive);
  saveActiveRef.current = handleSaveActive;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveActiveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    // Phase 1: Check for completely empty forms
    const emptyForms = allFormIds.filter(fId => formsMap[fId] && isFormEmpty(fId));
    if (emptyForms.length > 0) {
      setEmptyFormIds(emptyForms);
      setShowEmptyFormDialog(true);
      return;
    }

    // Phase 2: Validate required fields
    const issues: {formId: string; title: string; missingCount: number}[] = [];
    const errMap: Record<string, string[]> = {};
    for (const fId of allFormIds) {
      if (!formsMap[fId]) continue;
      const errors = getRequiredFieldErrors(fId);
      if (errors.length > 0) {
        issues.push({ formId: fId, title: formsMap[fId]?.title || 'Formulario', missingCount: errors.length });
        errMap[fId] = errors;
      }
    }
    if (issues.length > 0) {
      setValidationIssues(issues);
      setValidationErrorsByForm(errMap);
      setShowValidationDialog(true);
      return;
    }

    // Phase 3: All good, proceed
    await doCompleteAttention();
  };

  const handleDiscardEmptyForms = useCallback(() => {
    setShowEmptyFormDialog(false);
    setDynamicFormIds(prev => prev.filter(id => !emptyFormIds.includes(id)));
    setFormsMap(prev => {
      const next = { ...prev };
      emptyFormIds.forEach(id => delete next[id]);
      return next;
    });
    if (emptyFormIds.includes(activeFormId)) {
      const remaining = allFormIds.filter(id => !emptyFormIds.includes(id) && formsMap[id]);
      if (remaining.length > 0) setActiveFormId(remaining[0]);
    }
    setEmptyFormIds([]);
  }, [emptyFormIds, activeFormId, allFormIds, formsMap]);

  const doCompleteAttention = async () => {
    setIsCompletingAttention(true);
    const failedForms: string[] = [];
    const formsToSave = allFormIds.filter(fId => formsMap[fId] && !isFormEmpty(fId));

    if (formsToSave.length === 0) {
      uiToast({ title: "Sin datos para guardar", description: "Debes diligenciar al menos un formulario.", variant: "destructive" });
      setIsCompletingAttention(false);
      return;
    }

    for (const fId of formsToSave) {
      const entry = formsMap[fId];
      if (!entry) continue;
      if (entry.isDirty || !entry.saved) {
        const success = await saveFormToDb(fId, true);
        if (!success) failedForms.push(entry.title);
      }
    }

    if (failedForms.length > 0) {
      uiToast({ title: "Error al completar", description: `No se pudieron guardar: ${failedForms.join(', ')}`, variant: "destructive" });
      setIsCompletingAttention(false);
      return;
    }

    if (resolvedAdmisionId) {
      const { error: admError } = await db
        .from("admisiones" as any)
        .update({ estado: 'completada', fecha_fin: new Date().toISOString() })
        .eq('id', resolvedAdmisionId);
      if (admError) {
        uiToast({ title: "Error al completar admisión", description: admError.message, variant: "destructive" });
        setIsCompletingAttention(false);
        return;
      }
    }

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

    const { data: { user } } = await db.auth.getUser();
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
        const { error: insertError } = await db
          .from("respuestas_formularios" as any)
          .insert({
            formulario_id: fId,
            formulario_version: formsMap[fId]?.version,
            paciente_id: patientId,
            admision_id: resolvedAdmisionId,
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
    const summary: { id: string; label: string; value: string; isEmpty: boolean }[] = [];
    
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
      
      summary.push({ id: q.id, label: q.title, value: displayValue, isEmpty });
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

  const printForm = async () => {
    const entry = formsMap[activeFormId];
    if (!entry) {
      window.print();
      return;
    }
    const { printForms } = await import('@/utils/forms/form-document');
    await printForms(
      {
        forms: [{
          id: entry.id,
          title: entry.title,
          description: entry.description,
          questions: entry.questions,
          formData: entry.formData,
        }],
        patientId: patientId || undefined,
        doctorId: authUser?.id,
        doctorFallbackName: authUser?.email || '',
        institution: headerConfig,
      },
      entry.title,
    );
  };

  const printAllForms = async () => {
    const entries = allFormIds
      .map(id => formsMap[id])
      .filter(Boolean);
    if (entries.length === 0) return;
    const { printForms } = await import('@/utils/forms/form-document');
    await printForms(
      {
        forms: entries.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          questions: e.questions,
          formData: e.formData,
        })),
        patientId: patientId || undefined,
        doctorId: authUser?.id,
        doctorFallbackName: authUser?.email || '',
        institution: headerConfig,
      },
      `Formularios — ${entries.length} documento(s)`,
    );
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
        <div className="hidden print:block">
          <FormHeaderPreview config={headerConfig} formTitle={formTitle} />
        </div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{formTitle}</h2>
          {formDescription && (
            <p className="text-sm text-muted-foreground">{formDescription}</p>
          )}
        </div>
        
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <SectionedForm questions={questions} formData={formData} onChange={handleInputChange} errors={form.formState.errors} />
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
        
        <div className="print:bg-card">
          <div className="hidden print:block">
            <FormHeaderPreview config={headerConfig} formTitle={formTitle} />
          </div>
          <FormProvider {...form}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <SectionedForm questions={questions} formData={formData} onChange={handleInputChange} errors={form.formState.errors} />
                <Button type="submit" className="h-11 w-full gap-2 rounded-full px-6 sm:w-auto print:hidden"><Save size={16} />Guardar</Button>
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
      <div className="shrink-0 print:hidden bg-card border-b px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNavigateBack}
              aria-label="Volver"
              title="Volver"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {patientId ? (
              <PatientHeaderBanner inline pacienteId={patientId} admisionId={resolvedAdmisionId || undefined} />
            ) : (
              <h1 className="truncate text-base font-semibold">{isMultiForm ? 'Consulta' : formTitle}</h1>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isConsultationForm && (
              <span className={cn("mr-1 hidden text-[13px] md:inline", isCompleted ? "font-semibold text-green-700 dark:text-green-400" : "text-muted-foreground")}>
                {isCompleted ? "Atención completada" : "Consulta en curso"}
                {isMultiForm ? ` · ${allFormIds.length} formatos` : ""}
              </span>
            )}
            {/* Incapacidad button */}
            {patientId && resolvedAdmisionId && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground relative"
                    title="Incapacidades"
                  >
                    <CalendarDays className="w-4 h-4" />
                    {incapacidadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        {incapacidadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                    <span className="text-xs font-semibold text-foreground">Incapacidades</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs text-primary"
                      onClick={() => setShowIncapacidadDialog(true)}
                    >
                      <Plus className="w-3 h-3" />
                      Nueva
                    </Button>
                  </div>
                  {incapacidadesList.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      Sin incapacidades registradas
                    </div>
                  ) : (
                    <ScrollArea className="max-h-48">
                      <div className="divide-y divide-border/30">
                        {incapacidadesList.map((inc) => {
                          const estadoBadge = inc.estado === "activa"
                            ? "bg-green-500/10 text-green-700 border-green-500/20"
                            : inc.estado === "anulada"
                            ? "bg-red-500/10 text-red-700 border-red-500/20"
                            : "bg-muted text-muted-foreground";
                          return (
                            <div
                              key={inc.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40 cursor-pointer"
                              onClick={() => setPreviewIncapacidad(inc as unknown as IncapacidadLike)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-foreground truncate">
                                    {inc.numero_incapacidad || "—"}
                                  </span>
                                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", estadoBadge)}>
                                    {inc.estado}
                                  </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {inc.fecha_inicio} · {inc.duracion_dias} días · {inc.diagnostico_principal}
                                </div>
                              </div>
                              <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </PopoverContent>
              </Popover>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={printForm} className="gap-2 text-sm">
                  <Printer className="w-4 h-4" />
                  Imprimir actual
                </DropdownMenuItem>
                {isMultiForm && (
                  <DropdownMenuItem onClick={printAllForms} className="gap-2 text-sm">
                    <Printer className="w-4 h-4" />
                    Imprimir todo
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={copyFormLinkToClipboard} className="gap-2 text-sm">
                  <LinkIcon className="w-4 h-4" />
                  Compartir enlace
                </DropdownMenuItem>
                {historyEntry && patientId && !isCompleted && (
                  <DropdownMenuItem onClick={() => setShowChangeHistory(true)} className="gap-2 text-sm">
                    <Repeat className="w-4 h-4" />
                    Cambiar historia clínica
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {historyEntry && patientId && showChangeHistory && (
              <ChangeHistoryDialog
                open={showChangeHistory}
                onOpenChange={setShowChangeHistory}
                current={{
                  id: historyEntry.id,
                  title: historyEntry.title,
                  questions: historyEntry.questions,
                  formData: historyEntry.formData,
                  responseId: historyEntry.responseId ?? responseIdsRef.current[historyEntry.id],
                }}
                // Solo la admisión explícita de la consulta; si no hay, el diálogo busca la en curso del paciente.
                admissionId={isConsultationUUID ? consultationId : null}
                patientId={patientId}
                canAnnul={hasRole("doctor") || hasRole("admin")}
                draftKeyFor={(fId) => `kerhub-draft-${fId}${patientId ? `-${patientId}` : ""}${consultationId ? `-${consultationId}` : ""}`}
                onChanged={(newId, carried) => {
                  // Misma consulta con la historia correcta en lugar de la equivocada.
                  const params = new URLSearchParams(location.search);
                  const forms = (params.get("forms") ?? "").split(",").filter(Boolean).map((id) => (id === historyEntry.id ? newId : id));
                  if (forms.length) params.set("forms", [...new Set(forms)].join(","));
                  sessionStorage.setItem("kerhub-history-changed", String(carried.length));
                  window.location.assign(`/app/ver/${newId}?${params.toString()}`);
                }}
              />
            )}
          </div>
        </div>

      </div>

      {/* Two-column area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Área de trabajo: paciente arriba y pestañas de carpeta a todo el ancho */}
        {/* En el historial, el panel ocupa el alto que queda y sus columnas se desplazan solas: la página no hace scroll doble. */}
        <div ref={workspaceRef} className={cn("flex-1 min-w-0 overflow-y-auto px-6 pb-6 pt-4 bg-canvas", workspaceTab === "registros" && "md:flex md:flex-col")} style={{ overscrollBehavior: 'contain' }}>
          <div className="mb-4 shrink-0 print:hidden">
            <FolderTabs id="consult.workspace.v2" label="Consulta" tabs={CONSULT_TABS} active={workspaceTab} onChange={openWorkspaceTab} initialVisible={CONSULT_INITIAL_TABS} />
          </div>
          {workspaceTab === "registros" && patientId ? (
            <div className="overflow-hidden rounded-card bg-card shadow-card dark:border dark:border-border dark:shadow-none md:min-h-[360px] md:flex-1">
              <RecordsHistory patientId={patientId} headerConfig={headerConfig} />
            </div>
          ) : workspaceTab === "antecedentes" && patientId ? (
            <div className="rounded-card bg-card shadow-card dark:border dark:border-border dark:shadow-none">
              <PatientHistoryPanel patientId={patientId} />
            </div>
          ) : workspaceTab.startsWith("orden-") && patientId ? (
            <div className="min-h-[420px] rounded-card bg-card shadow-card dark:border dark:border-border dark:shadow-none">
              <OrderTabContent type={workspaceTab.slice("orden-".length)} patientId={patientId} admisionId={resolvedAdmisionId} />
            </div>
          ) : (
            <>
              {/* Multi-form chevron tabs + add button */}
              {!showRegistro && (
                <div className="mb-4">
                  <div className="overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-0 min-w-0">
                      {isMultiForm && allFormIds.map((fId, idx) => {
                        const entry = formsMap[fId];
                        if (!entry) return null;
                        const isActive = fId === activeFormId;
                        const isFirst = idx === 0;
                        const canRemove = fId !== formId;
                        return (
                          <div
                            key={fId}
                            className={`shrink-0 h-9 flex items-center transition-all duration-200 group ${
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
                            <button
                              type="button"
                              onClick={() => handleTabSwitch(fId)}
                              className="h-full flex items-center gap-1.5 text-xs font-medium"
                            >
                              <span className="max-w-[160px] truncate">{entry.title}</span>
                            </button>
                            {canRemove && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveForm(fId);
                                }}
                                className={`ml-1.5 w-4 h-4 rounded-full flex items-center justify-center transition-opacity ${
                                  isActive
                                    ? 'opacity-80 hover:opacity-100 hover:bg-primary-foreground/20'
                                    : 'opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-foreground/10'
                                }`}
                                title="Quitar formulario"
                                aria-label="Quitar formulario"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowAddFormDialog(true)}
                        className="shrink-0 w-7 h-7 rounded-full bg-muted hover:bg-muted-foreground/10 flex items-center justify-center ml-2 transition-colors"
                        title="Agregar formulario"
                      >
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
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
                  {/* Status bar */}
                  {(() => {
                    const st = getFormStatus(activeFormId);
                    const StatusIcon = st.status === 'sin_diligenciar' ? Circle
                      : st.status === 'en_progreso_sin_guardar' ? Clock
                      : st.status === 'guardado_parcial' ? AlertCircle
                      : st.status === 'completo_guardado' ? CheckCircle
                      : XCircle;
                    return (
                      <div className="flex min-h-10 items-center gap-2 rounded-b-md px-4 py-1.5 text-[13px]" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
                        <StatusIcon className="h-3.5 w-3.5" style={{ color: st.color }} />
                        <span style={{ color: st.color }}>{st.label}</span>
                        <div className="flex-1" />
                        {!isCompleted && (
                          <Button type="button" size="sm" variant="outline" onClick={() => void handleSaveActive()}
                            disabled={saveStatus === 'saving'} className="h-8 gap-1.5 rounded-full" title="Guardar este formato (Ctrl+S)">
                            {saveStatus === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Guardar formato
                          </Button>
                        )}
                      </div>
                    );
                  })()}
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
              <div className="hidden print:block">
                <FormHeaderPreview config={headerConfig} formTitle={formTitle} />
              </div>
              <FormProvider {...form}>
                <Form {...form}>
                  <form onSubmit={(e) => e.preventDefault()} className={`space-y-3 max-w-none ${isCompleted ? 'pointer-events-none opacity-80' : ''}`}>
                    <SectionedForm
                      questions={questions}
                      formData={formData}
                      onChange={isCompleted ? () => {} : handleInputChange}
                      errors={form.formState.errors}
                      invalidIds={validationErrorsByForm[activeFormId] || []}
                      onOpenTab={openWorkspaceTab}
                    />
                    <div className="h-12" />
                  </form>
                </Form>
              </FormProvider>
              {!isCompleted && (
                // Siempre activo: al pulsarlo se valida y se dice qué formato y qué campos faltan.
                <div className="sticky bottom-4 flex justify-end pointer-events-none print:hidden">
                  <Button
                    type="button"
                    onClick={handleCompleteAttention}
                    disabled={isCompletingAttention}
                    className="pointer-events-auto h-11 gap-2 rounded-full px-5 shadow-lg"
                  >
                    {isCompletingAttention ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Completar atención
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Confirmation Modal (legacy for non-clinical) */}
      <ConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmSave}
        formTitle={formTitle}
        getFilledFieldsSummary={getFilledFieldsSummary}
      />

      {/* Incapacidad Dialog (create) */}
      {patientId && resolvedAdmisionId && (
        <IncapacidadDialog
          open={showIncapacidadDialog}
          onOpenChange={setShowIncapacidadDialog}
          pacienteId={patientId}
          admisionId={resolvedAdmisionId}
          medicoNombre={authUser?.name || "Médico"}
          medicoId={authUser?.id || ""}
        />
      )}

      {/* Incapacidad Preview (print/share) */}
      <IncapacidadPreviewDialog
        incapacidad={previewIncapacidad}
        open={!!previewIncapacidad}
        onOpenChange={(o) => { if (!o) setPreviewIncapacidad(null); }}
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

      {/* Validation errors dialog */}
      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
              No se puede completar la atención
            </AlertDialogTitle>
            <AlertDialogDescription>
              Los siguientes formularios tienen campos obligatorios sin diligenciar:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-2">
            {validationIssues.map(issue => (
              <div key={issue.formId} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{issue.title}</p>
                  <p className="text-xs" style={{ color: '#ef4444' }}>{issue.missingCount} campo(s) obligatorio(s) vacío(s)</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => {
                    setShowValidationDialog(false);
                    setActiveFormId(issue.formId);
                  }}
                >
                  Ir al formulario
                </Button>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Entendido</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty form dialog */}
      <AlertDialog open={showEmptyFormDialog} onOpenChange={setShowEmptyFormDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Formularios sin diligenciar
            </AlertDialogTitle>
            <AlertDialogDescription>
              {emptyFormIds.length === 1
                ? `El formulario "${formsMap[emptyFormIds[0]]?.title}" está completamente vacío. ¿Deseas descartarlo o necesitas diligenciarlo?`
                : `Los siguientes formularios están completamente vacíos:`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {emptyFormIds.length > 1 && (
            <div className="space-y-1 my-2">
              {emptyFormIds.map(fId => (
                <p key={fId} className="text-sm pl-4">• {formsMap[fId]?.title || 'Formulario'}</p>
              ))}
            </div>
          )}
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setShowEmptyFormDialog(false);
                const firstEmpty = emptyFormIds[0];
                if (firstEmpty) setActiveFormId(firstEmpty);
              }}
            >
              Diligenciar
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleDiscardEmptyForms}
            >
              Descartar {emptyFormIds.length > 1 ? 'formularios' : 'formulario'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Completion success dialog */}
      <AlertDialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm text-center">
          <AlertDialogHeader className="items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
              <CheckCircle className="w-6 h-6" style={{ color: '#16a34a' }} />
            </div>
            <AlertDialogTitle>Atención completada</AlertDialogTitle>
            <AlertDialogDescription>
              Todos los registros fueron guardados correctamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2 sm:space-x-0">
            <Button
              className="rounded-xl gap-1.5 w-full"
              onClick={() => {
                setShowCompletedDialog(false);
                panelStateBeforeRegistroRef.current = isCollapsed;
                setIsCollapsed(true);
                setWorkspaceTab("registros");
              }}
            >
              <ClipboardList className="w-4 h-4" />
              Ver registros guardados
            </Button>
            <Button
              variant="outline"
              className="rounded-xl w-full"
              onClick={() => setShowCompletedDialog(false)}
            >
              Continuar en esta vista
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
  getFilledFieldsSummary: () => { id: string; label: string; value: string; isEmpty: boolean }[];
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
          {getFilledFieldsSummary().map((field) => (
            <div key={field.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-border/30 bg-card/50">
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
