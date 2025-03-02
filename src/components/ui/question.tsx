
import { useState } from "react";
import { ChevronDown, ChevronUp, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "./button";
import { QuestionData } from "../forms/question/types";
import { QuestionType } from "./question-types";
import { QuestionContent } from "../forms/question/question-content";

interface QuestionProps {
  question: QuestionData;
  onUpdate: (id: string, data: Partial<QuestionData>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  designOptions?: any; // Añadimos opciones de diseño
}

export const Question = ({
  question,
  onUpdate,
  onDelete,
  readOnly = false,
  isExpanded = false,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  designOptions,
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

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300"
      style={questionStyle}
    >
      {/* Header - siempre visible */}
      <div 
        className="px-5 py-4 flex items-center justify-between cursor-pointer border-b border-gray-100"
        onClick={onToggleExpand}
        style={designOptions ? { borderColor: `${designOptions.primaryColor}20` } : {}}
      >
        <div className="flex-1 truncate">
          <h3 className="font-medium text-gray-900" style={designOptions ? { color: designOptions.questionTextColor } : {}}>
            {question.title || "Nueva pregunta"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && onMoveUp && onMoveDown && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(question.id);
                }}
                disabled={isFirst}
                className="text-gray-400 hover:text-blue-500 disabled:opacity-30"
                style={designOptions ? { color: isFirst ? undefined : designOptions.primaryColor } : {}}
              >
                <ArrowUp size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(question.id);
                }}
                disabled={isLast}
                className="text-gray-400 hover:text-blue-500 disabled:opacity-30"
                style={designOptions ? { color: isLast ? undefined : designOptions.primaryColor } : {}}
              >
                <ArrowDown size={16} />
              </Button>
            </>
          )}
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className={`text-gray-400 hover:text-red-500 ${
                showDeleteConfirm ? "text-red-500" : ""
              }`}
            >
              <Trash size={16} />
            </Button>
          )}
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="text-gray-400"
              style={designOptions ? { color: designOptions.primaryColor } : {}}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Button>
          )}
        </div>
      </div>

      {/* Contenido - visible solo cuando está expandido */}
      {isExpanded && (
        <div className="px-5 py-4 space-y-4 animate-fade-in">
          {!readOnly && (
            <>
              <div className="flex flex-col space-y-4">
                <div>
                  <input
                    type="text"
                    value={question.title}
                    onChange={(e) => handleUpdate({ title: e.target.value })}
                    placeholder="Título de la pregunta"
                    className="w-full p-2 border-b border-gray-200 focus:border-form-primary focus:outline-none text-base font-medium"
                    style={designOptions ? { 
                      borderColor: `${designOptions.primaryColor}50`,
                      color: designOptions.questionTextColor,
                      fontFamily: designOptions.fontFamily
                    } : {}}
                  />
                </div>

                <div>
                  <QuestionType
                    selected={question.type}
                    onChange={handleTypeChange}
                  />
                </div>
              </div>

              <QuestionContent
                question={question}
                onUpdate={handleUpdate}
                readOnly={readOnly}
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`required-${question.id}`}
                    checked={question.required}
                    onChange={(e) => handleRequiredChange(e.target.checked)}
                    className="rounded text-form-primary focus:ring-form-primary"
                    style={designOptions ? { color: designOptions.primaryColor } : {}}
                  />
                  <label
                    htmlFor={`required-${question.id}`}
                    className="text-sm text-gray-600"
                    style={designOptions ? { color: designOptions.questionTextColor } : {}}
                  >
                    Obligatorio
                  </label>
                </div>
              </div>
            </>
          )}

          {readOnly && (
            <QuestionContent
              question={question}
              onUpdate={handleUpdate}
              readOnly={true}
            />
          )}
        </div>
      )}
    </div>
  );
};
