
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, FileText, Palette, SeparatorHorizontal, Save, X } from "lucide-react";
import { nanoid } from "nanoid";
import { supabase } from "@/integrations/supabase/client";

import { Question } from "@/components/ui/question";
import { QuestionData, FormDesignOptions, defaultDesignOptions } from "@/components/forms/question/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Form, DEFAULT_FORM_CATEGORIES } from "./FormsPage";
import { BackButton } from "../App";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const defaultQuestion: Omit<QuestionData, "id"> = {
  type: "short",
  title: "",
  required: false,
};

// Predefined color schemes
const colorSchemes = [
  { name: "Default", primaryColor: "#0099ff", backgroundColor: "#ffffff", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Soothing Green", primaryColor: "#10b981", backgroundColor: "#f0fdf4", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Professional Blue", primaryColor: "#3b82f6", backgroundColor: "#f0f9ff", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Warm Orange", primaryColor: "#f97316", backgroundColor: "#fff7ed", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Elegant Purple", primaryColor: "#8b5cf6", backgroundColor: "#f5f3ff", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" },
  { name: "Medical Green", primaryColor: "#22c55e", backgroundColor: "#f0fdf4", questionBackgroundColor: "#ffffff", questionTextColor: "#1f2937" }
];

const DRAFT_KEY = "form-creator-draft";

const saveDraft = (data: any) => {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
};

const loadDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const clearDraft = () => {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
};

const FormCreator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(!!id);
  const [activeTab, setActiveTab] = useState("content");
  
  // Intentar restaurar borrador
  const draft = !id ? loadDraft() : null;
  
  const [title, setTitle] = useState(draft?.title || "Nuevo formulario Ker Hub");
  const [description, setDescription] = useState(draft?.description || "Formulario para registro de datos clínicos");
  const [formType, setFormType] = useState<string>(draft?.formType || "historia_clinica");
  const [customCategory, setCustomCategory] = useState("");
  const [questions, setQuestions] = useState<QuestionData[]>(draft?.questions || []);
  const [saving, setSaving] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [designOptions, setDesignOptions] = useState<FormDesignOptions>(draft?.designOptions || defaultDesignOptions);
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
      saveDraft({ title, description, formType, questions, designOptions });
    }, 500);
    return () => clearTimeout(timeout);
  }, [id, title, description, formType, questions, designOptions]);

  useEffect(() => {
    if (id) {
      const loadForm = async () => {
        const { data, error } = await supabase
          .from("formularios")
          .select("*")
          .eq("id", id)
          .single();

        if (data && !error) {
          setTitle(data.titulo);
          setDescription(data.descripcion || "");
          setFormType(data.tipo || "historia_clinica");
          setQuestions((data.preguntas as any[]) || []);
          if (data.opciones_diseno && Object.keys(data.opciones_diseno as object).length > 0) {
            setDesignOptions(data.opciones_diseno as unknown as FormDesignOptions);
          }
          setLoading(false);
        } else {
          toast({
            title: "Error",
            description: "El formulario no existe",
            variant: "destructive",
          });
          navigate("/app/configuracion");
        }
      };
      loadForm();
    } else if (!draft) {
      setQuestions([]);
    }
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

  const handleColorSchemeChange = (schemeName: string) => {
    const scheme = colorSchemes.find(s => s.name === schemeName);
    if (scheme) {
      setDesignOptions(prev => ({
        ...prev,
        primaryColor: scheme.primaryColor,
        backgroundColor: scheme.backgroundColor,
        questionBackgroundColor: scheme.questionBackgroundColor,
        questionTextColor: scheme.questionTextColor
      }));
    }
  };

  const handleDesignOptionChange = (option: keyof FormDesignOptions, value: string) => {
    setDesignOptions(prev => ({
      ...prev,
      [option]: value
    }));
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
        opciones_diseno: designOptions as any,
        fhir_extensions: {} as any,
      };
      
      if (id) {
        const { error } = await supabase
          .from("formularios")
          .update(formPayload)
          .eq("id", id);

        if (error) throw error;
        
        toast({
          title: "Formulario actualizado",
          description: "Los cambios han sido guardados",
        });
      } else {
        const { error } = await supabase
          .from("formularios")
          .insert(formPayload);

        if (error) throw error;
        
        toast({
          title: "Formulario creado",
          description: `Tu nuevo formulario clínico está listo`,
        });
      }
      
      clearDraft();
      setTimeout(() => {
        navigate("/app/home/formularios");
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

  const applyDesignToPreview = () => {
    document.documentElement.style.setProperty('--form-primary', designOptions.primaryColor);
    return {
      backgroundColor: designOptions.backgroundColor,
      fontFamily: designOptions.fontFamily,
    };
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
    <div className="h-full flex flex-col overflow-hidden" style={applyDesignToPreview()}>
      {/* Barra de acciones — FIJA, nunca se mueve */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-background z-10">
        <BackButton />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/home/formularios")}
            disabled={saving}
            className="text-muted-foreground"
          >
            <X size={16} className="mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={saveForm}
            disabled={saving}
            style={{
              backgroundColor: designOptions.primaryColor,
              borderColor: designOptions.primaryColor
            }}
            className="text-white"
          >
            <Save size={16} className="mr-1" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Contenido — ÚNICO elemento con scroll */}
      <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-6 px-4">
            <div className="max-w-3xl mx-auto relative">
            <div className="form-card overflow-visible mb-3" style={{backgroundColor: designOptions.backgroundColor}}>
              {/* Bloque compacto: título + descripción */}
              <div className="px-4 pt-3 pb-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título del formulario"
                  className="text-lg font-semibold w-full bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="text-sm text-muted-foreground w-full bg-transparent border-none focus:outline-none mt-0.5"
                />
              </div>

              {/* Tabs + categoría en la misma fila */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-4 pb-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <TabsList className="h-8">
                    <TabsTrigger value="content" className="text-xs px-3 py-1">Contenido</TabsTrigger>
                    <TabsTrigger value="design" className="flex items-center gap-1 text-xs px-3 py-1">
                      <Palette size={14} />
                      <span>Diseño</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Categoría inline */}
                  <div className="flex items-center gap-1.5">
                    <Select
                        value={formType}
                        onValueChange={(value: string) => {
                          if (value === "__custom__") return;
                          setFormType(value);
                        }}
                      >
                        <SelectTrigger id="form-type" className="w-full max-w-xs">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_FORM_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center">
                                <FileText size={16} className="mr-2 text-primary" />
                                <span>{cat.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {!DEFAULT_FORM_CATEGORIES.find(c => c.value === formType) && formType && (
                            <SelectItem value={formType}>
                              <div className="flex items-center">
                                <FileText size={16} className="mr-2 text-primary" />
                                <span>{formType}</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {customCategory !== null && typeof customCategory === "string" && customCategory.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            placeholder="Nueva categoría..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="h-9 w-44 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customCategory.trim()) {
                                const slug = customCategory.trim().toLowerCase().replace(/\s+/g, '_');
                                setFormType(slug);
                                setCustomCategory("");
                                toast({ title: "Categoría creada", description: `"${customCategory.trim()}" establecida` });
                              } else if (e.key === "Escape") {
                                setCustomCategory("");
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!customCategory.trim()}
                            onClick={() => {
                              const slug = customCategory.trim().toLowerCase().replace(/\s+/g, '_');
                              setFormType(slug);
                              setCustomCategory("");
                              toast({ title: "Categoría creada", description: `"${customCategory.trim()}" establecida` });
                            }}
                          >
                            <Plus size={14} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-foreground"
                          title="Nueva categoría"
                          onClick={() => setCustomCategory(" ")}
                        >
                          <Plus size={16} />
                        </Button>
                      )}
                  </div>
                </div>
                
                <TabsContent value="content" className="hidden" />
                
                <TabsContent value="design" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Esquema de colores predefinidos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {colorSchemes.map((scheme) => (
                        <div 
                          key={scheme.name}
                          className="flex flex-col items-center p-3 border rounded-md cursor-pointer hover:shadow-md transition-shadow"
                          style={{
                            backgroundColor: scheme.backgroundColor,
                            borderColor: designOptions.primaryColor === scheme.primaryColor ? scheme.primaryColor : 'transparent',
                          }}
                          onClick={() => handleColorSchemeChange(scheme.name)}
                        >
                          <div 
                            className="w-8 h-8 mb-2 rounded-full" 
                            style={{ backgroundColor: scheme.primaryColor }}
                          ></div>
                          <span className="text-sm font-medium">{scheme.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Personalización</h3>
                    
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Color principal</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: designOptions.primaryColor }}
                          ></div>
                          <Input 
                            id="primaryColor"
                            type="color"
                            value={designOptions.primaryColor}
                            onChange={(e) => handleDesignOptionChange('primaryColor', e.target.value)}
                            className="w-12 h-8 p-0"
                          />
                          <Input 
                            type="text"
                            value={designOptions.primaryColor}
                            onChange={(e) => handleDesignOptionChange('primaryColor', e.target.value)}
                            className="w-28"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tipografía</Label>
                        <Select
                          value={designOptions.fontFamily}
                          onValueChange={(value) => handleDesignOptionChange('fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una tipografía" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter, system-ui, sans-serif">Inter (Moderna)</SelectItem>
                            <SelectItem value="'Playfair Display', serif">Playfair (Elegante)</SelectItem>
                            <SelectItem value="'Roboto', sans-serif">Roboto (Profesional)</SelectItem>
                            <SelectItem value="'Montserrat', sans-serif">Montserrat (Limpia)</SelectItem>
                            <SelectItem value="'Poppins', sans-serif">Poppins (Amigable)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Bordes</Label>
                        <Select
                          value={designOptions.borderRadius}
                          onValueChange={(value) => handleDesignOptionChange('borderRadius', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Estilo de bordes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Cuadrados</SelectItem>
                            <SelectItem value="sm">Ligeramente redondeados</SelectItem>
                            <SelectItem value="md">Redondeados</SelectItem>
                            <SelectItem value="lg">Muy redondeados</SelectItem>
                            <SelectItem value="xl">Completamente redondeados</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Espaciado entre preguntas</Label>
                        <RadioGroup
                          value={designOptions.questionSpacing}
                          onValueChange={(value) => handleDesignOptionChange('questionSpacing', value)}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="compact" id="spacing-compact" />
                            <Label htmlFor="spacing-compact">Compacto</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="normal" id="spacing-normal" />
                            <Label htmlFor="spacing-normal">Normal</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="spacious" id="spacing-spacious" />
                            <Label htmlFor="spacing-spacious">Espacioso</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Estilo de botones</Label>
                        <Select
                          value={designOptions.buttonStyle}
                          onValueChange={(value) => handleDesignOptionChange('buttonStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Estilo de botones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Estándar</SelectItem>
                            <SelectItem value="outline">Con borde</SelectItem>
                            <SelectItem value="rounded">Redondeados</SelectItem>
                            <SelectItem value="pill">Forma de píldora</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground italic">Los cambios se aplicarán automáticamente a la vista previa. Guarda el formulario para conservar estos cambios.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Questions list with inline floating toolbar */}
            <div className="space-y-4 mb-8">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex gap-2 items-start"
                  onMouseEnter={() => setActiveQuestionId(question.id)}
                  onClick={() => setActiveQuestionId(question.id)}
                >
                  <div className="flex-1 min-w-0">
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
                      designOptions={designOptions}
                    />
                  </div>

                  {/* Toolbar — solo visible en el campo activo */}
                  <div className={`shrink-0 flex flex-col gap-1 bg-background border border-border rounded-lg shadow-sm p-1 transition-opacity duration-200 ${
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
      </div>
    </div>
  );
};

export default FormCreator;
