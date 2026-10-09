
import { useState } from "react";
import { ChevronDown, ChevronUp, Trash, ArrowUp, ArrowDown, Copy, GripVertical, Rows3, Columns3, EyeOff, Eye } from "lucide-react";
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
  allQuestions?: QuestionData[];
  /** El campo ya tiene respuestas guardadas: no se borra ni cambia de tipo, solo se desactiva. */
  used?: boolean;
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
  allQuestions,
  used = false,
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

  const locked = !!question.locked;
  const lockedBadge = (
    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary" title="Campo de la historia clínica base: no se puede borrar ni cambiar">
      Campo base
    </span>
  );

  const handleDelete = () => {
    if (locked || used) return;
    if (showDeleteConfirm) {
      onDelete(question.id);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // Section divider rendering
  if (question.type === "section") {
    return (
      <div className="relative pb-0.5 pt-3">
        <div className="flex items-center gap-3 group">
          <div className="h-px flex-1 bg-border" />
          {readOnly || locked ? (
            <span className="px-2 text-xs font-semibold uppercase tracking-wider text-primary">
              {question.title || "Sección sin título"}
            </span>
          ) : (
            <input
              type="text"
              value={question.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              placeholder="Nombre de la sección"
              aria-label="Nombre de la sección"
              className="min-w-[140px] border-none bg-transparent px-2 text-center text-xs font-semibold uppercase tracking-wider text-primary outline-none placeholder:text-muted-foreground/50 focus:ring-0"
            />
          )}
          <div className="h-px flex-1 bg-border" />
          {locked && !readOnly && lockedBadge}
          {!readOnly && !locked && (
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
      className={cn(
        "group overflow-visible rounded-xl border bg-card transition-shadow duration-200",
        isExpanded ? "border-primary/30 shadow-card" : "border-border hover:border-primary/30",
        question.inactive && "opacity-60",
      )}
    >
      {/* Header - siempre visible */}
      <div 
        className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!readOnly && (
            <GripVertical size={16} className="text-muted-foreground shrink-0 opacity-40" />
          )}
          {/* Abierta y editable, el título se edita en su campo: no se repite aquí. */}
          {!(isExpanded && !readOnly && !locked) && (
            <span className={cn("truncate text-[14px] font-medium", question.title ? "text-foreground" : "text-muted-foreground")}>
              {question.title || "Sin título"}
            </span>
          )}
          {locked && !readOnly && lockedBadge}
          {question.inactive && (
            <span className="shrink-0 text-xs font-medium text-muted-foreground" title="No se pide en registros nuevos; los registros anteriores lo conservan">Desactivado</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!readOnly && !locked && onMoveUp && onMoveDown && (
            // Controles secundarios: solo al pasar el mouse o con el teclado.
            <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" disabled={isFirst}
                onClick={(e) => { e.stopPropagation(); onMoveUp(question.id); }}>
                <ArrowUp size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" disabled={isLast}
                onClick={(e) => { e.stopPropagation(); onMoveDown(question.id); }}>
                <ArrowDown size={14} />
              </Button>
            </div>
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
          {!readOnly && locked && (
            <div className="px-4 pb-3">
              <p className="mb-3 text-[13px] text-muted-foreground">
                Campo de la historia clínica base{question.required ? " · obligatorio" : ""}. Puedes agregar preguntas nuevas antes o después.
              </p>
              <QuestionContent question={question} onUpdate={handleUpdate} readOnly allQuestions={allQuestions} />
            </div>
          )}

          {!readOnly && !locked && (
            <>
              {/* Row: título + tipo de dato (Google Forms style) */}
              <div className="flex items-start gap-3 px-4 pb-3">
                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  placeholder="Pregunta"
                  aria-label="Texto de la pregunta"
                  className="flex-1 rounded-t-md border-b-2 border-muted-foreground/30 bg-muted/30 px-2 py-1.5 text-[15px] font-medium focus:border-primary focus:outline-none"
                />
                <QuestionType
                  selected={question.type}
                  onChange={handleTypeChange}
                  disabled={used}
                />
              </div>

              {/* Content area */}
              <div className="px-4 pb-3">
                <QuestionContent
                  question={question}
                  onUpdate={handleUpdate}
                  readOnly={readOnly}
                  allQuestions={allQuestions}
                />
              </div>

              {/* Bottom bar: layout, duplicar, eliminar, obligatorio */}
              <div className="flex items-center justify-between gap-1 border-t border-border px-4 py-1.5">
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
                  {used ? (
                    // Un campo con registros no se borra: se desactiva para los registros nuevos.
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                      title={question.inactive ? "Volver a pedir este campo en registros nuevos" : "Dejar de pedirlo en registros nuevos; los anteriores lo conservan"}
                      onClick={() => handleUpdate({ inactive: !question.inactive })}>
                      {question.inactive ? <Eye size={15} /> : <EyeOff size={15} />}
                      {question.inactive ? "Reactivar" : "Desactivar"}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon"
                      className={`h-8 w-8 text-muted-foreground hover:text-destructive ${showDeleteConfirm ? "text-destructive" : ""}`}
                      title="Eliminar"
                      onClick={handleDelete}>
                      <Trash size={16} />
                    </Button>
                  )}
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
            <div className="px-4 pb-3">
              <QuestionContent
                question={question}
                onUpdate={handleUpdate}
                readOnly={true}
                allQuestions={allQuestions}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
