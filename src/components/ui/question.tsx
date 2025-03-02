
import { useState } from "react";
import { ChevronDown, ChevronUp, Trash } from "lucide-react";
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
}

export const Question = ({
  question,
  onUpdate,
  onDelete,
  readOnly = false,
  isExpanded = false,
  onToggleExpand,
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
      {/* Header - siempre visible */}
      <div 
        className="px-5 py-4 flex items-center justify-between cursor-pointer border-b border-gray-100"
        onClick={onToggleExpand}
      >
        <div className="flex-1 truncate">
          <h3 className="font-medium text-gray-900">
            {question.title || "Nueva pregunta"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
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
                  />
                  <label
                    htmlFor={`required-${question.id}`}
                    className="text-sm text-gray-600"
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
