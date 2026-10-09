
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Plus, SeparatorHorizontal, Save, X } from "lucide-react";
import { nanoid } from "nanoid";
import { db } from "@/integrations/data/client";

import { Question } from "@/components/ui/question";
import { QuestionData } from "@/components/forms/question/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Form, DEFAULT_FORM_CATEGORIES } from "./FormsPage";
import { BackButton } from "../App";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SectionedForm } from "@/components/forms/form-viewer/SectionedForm";
import { cn } from "@/lib/utils";

const PREVIEW_KEY = "kerhub.formCreator.preview";
/** Opción de la lista de categorías que abre el campo para crear una nueva. */
const NEW_CATEGORY = "__new_category__";

/** La vista previa abierta o cerrada es una preferencia de cada usuario en su navegador. */
const readPreviewPref = () => {
  try { return localStorage.getItem(PREVIEW_KEY) !== "off"; } catch { return true; }
};

const defaultQuestion: Omit<QuestionData, "id"> = {
  type: "short",
  title: "",
  required: false,
};

const DRAFT_KEY = "form-creator-draft";

const saveDraft = (data: any) => {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* sessionStorage no disponible: el borrador es opcional */ }
};

const loadDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const clearDraft = () => {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* sessionStorage no disponible: nada que limpiar */ }
};

const FormCreator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(!!id);
  
  // Intentar restaurar borrador
  const draft = !id ? loadDraft() : null;
  
  const [title, setTitle] = useState(draft?.title || "Nuevo formulario Ker Hub");
  const [description, setDescription] = useState(draft?.description || "Formulario para registro de datos clínicos");
  const [formType, setFormType] = useState<string>(draft?.formType || "historia_clinica");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const cancelCategory = () => { setCreatingCategory(false); setNewCategory(""); };
  const createCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    setFormType(name.toLowerCase().replace(/s+/g, "_"));
    cancelCategory();
    toast({ title: "Categoría creada", description: `«${name}» quedó asignada a este formulario.` });
  };
  const [questions, setQuestions] = useState<QuestionData[]>(
    draft?.questions || (!id ? [{ id: nanoid(), type: "short", title: "", required: false } as QuestionData] : [])
  );
  const [saving, setSaving] = useState(false);
  // Uso del formato: con registros guardados, los cambios crean una versión nueva y los campos usados no se borran.
  const [recordCount, setRecordCount] = useState(0);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(readPreviewPref);
  // Respuestas de prueba en la vista previa: nunca se guardan.
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  useEffect(() => {
    try { localStorage.setItem(PREVIEW_KEY, showPreview ? "on" : "off"); } catch { /* sin almacenamiento: la preferencia no se recuerda */ }
  }, [showPreview]);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(!!draft);

  // Mostrar notificación si se restauró un borrador
  useEffect(() => {
    if (draftRestored) {
      toast({ title: "Borrador restaurado", description: "Se recuperó tu progreso anterior automáticamente." });
      setDraftRestored(false);
    }
  }, [draftRestored, toast]);

  // Auto-guardar borrador en sessionStorage (solo formularios nuevos)
  useEffect(() => {
    if (id) return; // No guardar drafts si estamos editando uno existente
    const timeout = setTimeout(() => {
      saveDraft({ title, description, formType, questions });
    }, 500);
    return () => clearTimeout(timeout);
  }, [id, title, description, formType, questions]);

  useEffect(() => {
    let vigente = true;
    if (id) {
      const loadForm = async () => {
        const { data, error } = await db
          .from("formularios")
          .select("*")
          .eq("id", id)
          .single();

        if (!vigente) return;
        if (data && !error) {
          setTitle(data.titulo);
          setDescription(data.descripcion || "");
          setFormType(data.tipo || "historia_clinica");
          setQuestions((data.preguntas as any[]) || []);
          setCurrentVersion((data as { version?: number }).version ?? 1);
          const { count } = await db
            .from("respuestas_formularios")
            .select("id", { count: "exact", head: true })
            .eq("formulario_id", id);
          if (!vigente) return;
          setRecordCount(count ?? 0);
          // Los campos guardados ya pueden tener respuestas: se protegen todos los de la versión cargada.
          if (count) setUsedIds(new Set(((data.preguntas as { id: string }[]) || []).map((q) => q.id)));
          setLoading(false);
        } else {
          toast({
            title: "Error",
            description: "El formulario no existe",
            variant: "destructive",
          });
          navigate("/app/configuracion?tab=forms");
        }
      };
      loadForm();
    } else if (!loadDraft()) {
      setQuestions([{ id: nanoid(), type: "short", title: "", required: false } as QuestionData]);
    }
    return () => {
      vigente = false;
    };
  }, [id, navigate, toast]);

  const toggleQuestionExpansion = (id: string) => {
    setExpandedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };

  const handleAddQuestion = () => {
    const newQuestionId = nanoid();
    const newQuestion = {
      id: newQuestionId,
      ...defaultQuestion,
      title: "",
    };
    
    setQuestions([...questions, newQuestion]);
    // Colapsar todas y expandir solo la nueva (estilo Google Forms)
    setExpandedQuestions([newQuestionId]);
  };

  const handleAddSection = () => {
    const newSectionId = nanoid();
    const newSection: QuestionData = {
      id: newSectionId,
      type: "section",
      title: "",
      required: false,
    };
    setQuestions([...questions, newSection]);
  };

  const handleAddQuestionAfter = (afterId: string) => {
    const newQuestionId = nanoid();
    const newQuestion = { id: newQuestionId, ...defaultQuestion, title: "" };
    const index = questions.findIndex(q => q.id === afterId);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setQuestions(newQuestions);
    setExpandedQuestions([newQuestionId]);
    setActiveQuestionId(newQuestionId);
  };

  const handleAddSectionAfter = (afterId: string) => {
    const newSectionId = nanoid();
    const newSection: QuestionData = { id: newSectionId, type: "section", title: "", required: false };
    const index = questions.findIndex(q => q.id === afterId);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, newSection);
    setQuestions(newQuestions);
  };

  const handleDuplicateQuestion = (id: string) => {
    const original = questions.find(q => q.id === id);
    if (!original) return;
    const newId = nanoid();
    const duplicate = { ...original, id: newId, title: `${original.title} (copia)` };
    const index = questions.findIndex(q => q.id === id);
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicate);
    setQuestions(newQuestions);
    setExpandedQuestions([newId]);
  };

  const handleUpdateQuestion = (id: string, data: Partial<QuestionData>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...data } : q))
    );
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.find((q) => q.id === id)?.locked || usedIds.has(id)) return;
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
      // Eliminar del arreglo de expandidos si estaba ahí
      setExpandedQuestions(prev => prev.filter(qId => qId !== id));
    } else {
      toast({
        title: "Error",
        description: "El formulario debe tener al menos una pregunta",
      });
    }
  };

  const handleMoveQuestionUp = (id: string) => {
    const index = questions.findIndex(q => q.id === id);
    if (index > 0) {
      const newQuestions = [...questions];
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
      setQuestions(newQuestions);
    }
  };

  const handleMoveQuestionDown = (id: string) => {
    const index = questions.findIndex(q => q.id === id);
    if (index < questions.length - 1) {
      const newQuestions = [...questions];
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
      setQuestions(newQuestions);
    }
  };

  const saveForm = async () => {
    setSaving(true);
    
    try {
      if (!title.trim()) {
        toast({
          title: "Error",
          description: "El formulario debe tener un título",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      const invalidQuestions = questions.filter(q => !q.title.trim());
      if (invalidQuestions.length > 0) {
        toast({
          title: "Error",
          description: "Todas las preguntas deben tener un título",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const formPayload = {
        titulo: title,
        descripcion: description,
        tipo: formType,
        preguntas: questions as any,
        // fhir_extensions no se envía: al editar se perderían la marca de
        // formulario base y los códigos LOINC de la historia clínica.
      };
      
      let formId = id;
      
      if (id) {
        const { error } = await db
          .from("formularios")
          .update(formPayload)
          .eq("id", id);

        if (error) throw error;
        
        toast({
          title: "Formulario actualizado",
          description: "Los cambios han sido guardados",
        });
      } else {
        const { data, error } = await db
          .from("formularios")
          .insert(formPayload)
          .select("id")
          .single();

        if (error) throw error;
        formId = data.id;
        
        toast({
          title: "Formulario creado",
          description: `Tu nuevo formulario clínico está listo`,
        });
      }
      
      clearDraft();
      setTimeout(() => {
        navigate(`/app/ver/${formId}`);
      }, 500);
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el formulario",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-3xl px-4">
          <div className="h-12 bg-muted rounded-md w-3/4"></div>
          <div className="h-8 bg-muted rounded-md w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-muted rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Encabezado en una sola franja sobre el lienzo: volver, nombre y descripción; a la derecha categoría, vista previa y acciones. */}
      <div className="z-10 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <BackButton fallbackPath="/app/configuracion?tab=forms" />
        <div className="min-w-[220px] flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del formulario"
            aria-label="Título del formulario"
            className="w-full truncate border-none bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={1}
            aria-label="Descripción del formulario"
            className="block max-h-10 w-full resize-none border-none bg-transparent text-[13px] leading-5 text-muted-foreground [field-sizing:content] focus:outline-none"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Categoría: la lista trae al final «Nueva categoría…», que se escribe aquí mismo. */}
          {creatingCategory ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createCategory();
                  if (e.key === "Escape") cancelCategory();
                }}
                placeholder="Nombre de la categoría"
                aria-label="Nombre de la nueva categoría"
                className="h-8 w-44 text-[13px]"
              />
              <Button size="sm" className="h-8 text-[13px]" disabled={!newCategory.trim()} onClick={createCategory}>Crear</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Descartar nueva categoría" title="Descartar" onClick={cancelCategory}><X size={16} /></Button>
            </div>
          ) : (
            <Select
              value={formType}
              onValueChange={(value: string) => {
                if (value === NEW_CATEGORY) { setCreatingCategory(true); return; }
                setFormType(value);
              }}
            >
              <SelectTrigger id="form-type" aria-label="Categoría del formulario" className="h-8 w-44 text-[13px]">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_FORM_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-[13px]">{cat.label}</SelectItem>
                ))}
                {!DEFAULT_FORM_CATEGORIES.find(c => c.value === formType) && formType && (
                  <SelectItem value={formType} className="text-[13px]">{formType.replace(/_/g, " ")}</SelectItem>
                )}
                <SelectSeparator />
                <SelectItem value={NEW_CATEGORY} className="text-[13px] text-primary">
                  <span className="flex items-center gap-1.5"><Plus size={14} />Nueva categoría…</span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          <span className="mx-1 hidden h-5 w-px bg-border md:block" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
            className={cn("hidden h-8 gap-1.5 text-[13px] md:inline-flex", showPreview ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground")}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            Vista previa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/configuracion?tab=forms")}
            disabled={saving}
            className="h-8 text-[13px] text-muted-foreground"
          >
            <X size={16} className="mr-1" />
            Cancelar
          </Button>
          <Button size="sm" onClick={saveForm} disabled={saving} className="h-8 text-[13px]">
            <Save size={16} className="mr-1" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Editor y vista previa: cada columna se desplaza sola; la página no hace scroll. */}
      <div className={cn("grid min-h-0 flex-1 gap-4 pb-4", showPreview && "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
        <div className="min-h-0 overflow-y-auto">
          {/* Margen derecho para la barra flotante de cada pregunta. */}
          <div className={cn("mx-auto pb-6 pt-1 md:pr-12", showPreview ? "max-w-2xl" : "max-w-3xl")}>
            {recordCount > 0 && (
              <p className="mb-3 rounded-xl bg-primary/[0.06] px-4 py-2.5 text-[13px] leading-5 text-foreground">
                <span className="font-semibold">
                  {recordCount === 1 ? "1 registro usa" : `${recordCount} registros usan`} este formato (versión {currentVersion}).
                </span>{" "}
                <span className="text-muted-foreground">
                  Al guardar cambios se crea la versión {currentVersion + 1} y solo aplica a registros nuevos; los anteriores se siguen viendo como se diligenciaron. Los campos ya usados no se borran ni cambian de tipo: se pueden desactivar.
                </span>
              </p>
            )}
        {/* Empty state when no questions */}
        {questions.length === 0 && (
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center mb-4">
            <p className="text-sm text-muted-foreground mb-3">
              Agrega el primer campo para empezar a construir tu formulario
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={handleAddQuestion} className="gap-1.5">
                <Plus size={16} /> Agregar pregunta
              </Button>
              <Button variant="outline" onClick={handleAddSection} className="gap-1.5">
                <SeparatorHorizontal size={16} /> Agregar sección
              </Button>
            </div>
          </div>
        )}

        {/* Questions list with inline floating toolbar */}
        <div className="mb-8 grid gap-2">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="relative"
              onMouseEnter={() => setActiveQuestionId(question.id)}
              onClick={() => setActiveQuestionId(question.id)}
            >
              <div className="min-w-0">
                <Question
                  question={question}
                  onUpdate={handleUpdateQuestion}
                  onDelete={handleDeleteQuestion}
                  onDuplicate={handleDuplicateQuestion}
                  isExpanded={expandedQuestions.includes(question.id)}
                  onToggleExpand={() => toggleQuestionExpansion(question.id)}
                  onMoveUp={handleMoveQuestionUp}
                  onMoveDown={handleMoveQuestionDown}
                  isFirst={index === 0}
                  isLast={index === questions.length - 1}
                  allQuestions={questions}
                  used={usedIds.has(question.id)}
                />
              </div>

              {/* Toolbar — solo visible en el campo activo */}
              {/* Fuera de la tarjeta (a su derecha) para que todas las tarjetas midan lo mismo que el encabezado. */}
              <div className={`absolute left-full top-0 ml-2 hidden flex-col gap-1 rounded-lg border border-border bg-background p-1 shadow-sm transition-opacity duration-200 md:flex ${
                activeQuestionId === question.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddQuestionAfter(question.id); }}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors group"
                  title="Añadir pregunta"
                >
                  <Plus size={18} className="text-muted-foreground group-hover:text-foreground" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddSectionAfter(question.id); }}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors group"
                  title="Añadir sección"
                >
                  <SeparatorHorizontal size={18} className="text-muted-foreground group-hover:text-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
          </div>
        </div>

        {showPreview && (
          <aside aria-label="Vista previa del formulario" className="hidden min-h-0 flex-col overflow-hidden rounded-card bg-[hsl(var(--canvas))] ring-1 ring-border md:flex">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4 py-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">Vista previa</p>
                <p className="truncate text-xs text-muted-foreground">Así lo verá el profesional. Prueba campos y cálculos.</p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 shrink-0 text-[13px] text-muted-foreground" onClick={() => setPreviewData({})}>
                Limpiar
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground">{title || "Formulario sin título"}</h2>
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
              </div>
              {questions.length > 0 ? (
                <SectionedForm
                  questions={questions}
                  formData={previewData}
                  onChange={(qid, value) => setPreviewData((d) => ({ ...d, [qid]: value }))}
                  errors={{}}
                />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Agrega preguntas para verlas aquí.</p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default FormCreator;
