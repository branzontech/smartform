
import { useState } from "react";
import { ChevronDown, ChevronUp, Trash, ArrowUp, ArrowDown, Copy, GripVertical, Rows3, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { QuestionData } from "../forms/question/types";
import { QuestionType } from "./question-types";
import { QuestionContent } from "../forms/question/question-content";

interface QuestionProps {
  question: QuestionData;
  onUpdate: (id: string, data: Partial<QuestionData>) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  readOnly?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  designOptions?: any;
  allQuestions?: QuestionData[];
}

export const Question = ({
  question,
  onUpdate,
  onDelete,
  onDuplicate,
  readOnly = false,
  isExpanded = false,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  designOptions,
  allQuestions,
}: QuestionProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = (data: Partial<QuestionData>) => {
    onUpdate(question.id, data);
  };

  const handleRequiredChange = (checked: boolean) => {
    handleUpdate({ required: checked });
  };

  const handleTypeChange = (type: string) => {
    // Proporcionar valores por defecto según el tipo
    const updates: Partial<QuestionData> = { type };

    switch (type) {
      case "multiple":
      case "checkbox":
      case "dropdown":
        if (!question.options || question.options.length === 0) {
          updates.options = ["Opción 1"];
        }
        break;
      case "vitals":
        if (!question.vitalType) {
          updates.vitalType = "FC";
          updates.min = 60;
          updates.max = 100;
          updates.units = "lpm";
        }
        break;
      case "multifield":
        if (!question.multifields || question.multifields.length === 0) {
          updates.multifields = [
            { id: crypto.randomUUID(), label: "Campo 1" },
          ];
          updates.orientation = "vertical";
        }
        break;
    }

    handleUpdate(updates);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(question.id);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Estilos personalizados basados en designOptions
  const questionStyle = designOptions ? {
    backgroundColor: designOptions.questionBackgroundColor,
    color: designOptions.questionTextColor,
    borderRadius: designOptions.borderRadius === "md" ? "0.375rem" : 
                 designOptions.borderRadius === "lg" ? "0.5rem" : 
                 designOptions.borderRadius === "xl" ? "0.75rem" : "0.25rem",
    marginBottom: designOptions.questionSpacing === "compact" ? "0.5rem" : 
                 designOptions.questionSpacing === "spacious" ? "1.5rem" : "1rem",
  } : {};

  // Section divider rendering
  if (question.type === "section") {
    return (
      <div className="relative py-2">
        <div className="flex items-center gap-3 group">
          <div className="h-px flex-1 bg-border" style={designOptions ? { backgroundColor: `${designOptions.primaryColor}40` } : {}} />
          {readOnly ? (
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-2"
              style={designOptions ? { color: designOptions.primaryColor } : {}}>
              {question.title || "Sección sin título"}
            </span>
          ) : (
            <input
              type="text"
              value={question.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              placeholder="Nombre de la sección"
              className="text-sm font-semibold uppercase tracking-wider text-center bg-transparent border-none outline-none focus:ring-0 px-2 min-w-[140px] text-muted-foreground placeholder:text-muted-foreground/50"
              style={designOptions ? { color: designOptions.primaryColor } : {}}
            />
          )}
          <div className="h-px flex-1 bg-border" style={designOptions ? { backgroundColor: `${designOptions.primaryColor}40` } : {}} />
          {!readOnly && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onMoveUp && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" disabled={isFirst}
                  onClick={() => onMoveUp(question.id)}>
                  <ArrowUp size={14} />
                </Button>
              )}
              {onMoveDown && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" disabled={isLast}
                  onClick={() => onMoveDown(question.id)}>
                  <ArrowDown size={14} />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}>
                <Trash size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-background rounded-lg shadow-sm border border-border overflow-visible transition-all duration-300"
      style={questionStyle}
    >
      {/* Header - siempre visible */}
      <div 
        className="px-5 py-3 flex items-center justify-between cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!readOnly && (
            <GripVertical size={16} className="text-muted-foreground shrink-0 opacity-40" />
          )}
          <h3 className="font-medium text-foreground truncate">
            {question.title || "Sin título"}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!readOnly && onMoveUp && onMoveDown && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" disabled={isFirst}
                onClick={(e) => { e.stopPropagation(); onMoveUp(question.id); }}>
                <ArrowUp size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" disabled={isLast}
                onClick={(e) => { e.stopPropagation(); onMoveDown(question.id); }}>
                <ArrowDown size={14} />
              </Button>
            </>
          )}
          {onToggleExpand && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          )}
        </div>
      </div>

      {/* Contenido expandido - estilo Google Forms */}
      {isExpanded && (
        <div className="animate-fade-in">
          {!readOnly && (
            <>
              {/* Row: título + tipo de dato (Google Forms style) */}
              <div className="px-5 pb-3 flex items-start gap-3">
                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  placeholder="Pregunta"
                  className="flex-1 p-2 border-b-2 border-muted-foreground/30 focus:border-primary focus:outline-none text-base font-medium bg-muted/30 rounded-t-md"
                />
                <QuestionType
                  selected={question.type}
                  onChange={handleTypeChange}
                />
              </div>

              {/* Content area */}
              <div className="px-5 pb-3">
                <QuestionContent
                  question={question}
                  onUpdate={handleUpdate}
                  readOnly={readOnly}
                />
              </div>

              {/* Bottom bar: layout, duplicar, eliminar, obligatorio */}
              <div className="px-5 py-2 border-t border-border flex items-center justify-between gap-1">
                {/* Layout controls - solo para tipos con opciones */}
                <div className="flex items-center gap-1">
                  {["multiple", "checkbox", "dropdown"].includes(question.type) && (
                    <>
                      <Button
                        variant="ghost" size="sm"
                        className={cn("h-8 px-2 text-xs gap-1", question.optionLayout !== "horizontal" ? "text-primary bg-accent" : "text-muted-foreground")}
                        title="Vertical"
                        onClick={() => handleUpdate({ optionLayout: "vertical", optionColumns: undefined })}
                      >
                        <Rows3 size={14} />
                        <span className="hidden sm:inline">Vertical</span>
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className={cn("h-8 px-2 text-xs gap-1", question.optionLayout === "horizontal" ? "text-primary bg-accent" : "text-muted-foreground")}
                        title="Horizontal"
                        onClick={() => handleUpdate({ optionLayout: "horizontal", optionColumns: question.optionColumns || 2 })}
                      >
                        <Columns3 size={14} />
                        <span className="hidden sm:inline">Horizontal</span>
                      </Button>
                      {question.optionLayout === "horizontal" && (
                        <select
                          value={question.optionColumns || 2}
                          onChange={(e) => handleUpdate({ optionColumns: Number(e.target.value) })}
                          className="h-8 text-xs border border-border rounded-md bg-background text-foreground px-1.5 ml-1"
                        >
                          <option value={2}>2 col</option>
                          <option value={3}>3 col</option>
                        </select>
                      )}
                      <div className="w-px h-5 bg-border mx-1" />
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {onDuplicate && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Duplicar"
                      onClick={() => onDuplicate(question.id)}>
                      <Copy size={16} />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon"
                    className={`h-8 w-8 text-muted-foreground hover:text-destructive ${showDeleteConfirm ? "text-destructive" : ""}`}
                    title="Eliminar"
                    onClick={handleDelete}>
                    <Trash size={16} />
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-sm text-muted-foreground">Obligatorio</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={question.required}
                      onClick={() => handleRequiredChange(!question.required)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
                        question.required ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                    >
                      <span className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform mt-0.5",
                        question.required ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                      )} />
                    </button>
                  </label>
                </div>
              </div>
            </>
          )}

          {readOnly && (
            <div className="px-5 pb-4">
              <QuestionContent
                question={question}
                onUpdate={handleUpdate}
                readOnly={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
