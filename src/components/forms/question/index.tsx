
import React, { useState } from "react";
import { Trash2, GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionType, QuestionProps } from "./types";
import { QuestionType as QuestionTypeSelector } from "./controls/question-type";
import { QuestionContent } from "./question-content";

export const Question: React.FC<QuestionProps> = ({
  question,
  onUpdate,
  onDelete,
  readOnly = false,
}) => {
  const [questionTitle, setQuestionTitle] = useState(question.title);
  const [questionType, setQuestionType] = useState(question.type);
  const [required, setRequired] = useState(question.required);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestionTitle(e.target.value);
    onUpdate(question.id, { title: e.target.value });
  };

  const handleTypeChange = (type: string) => {
    setQuestionType(type);
    onUpdate(question.id, { type });
  };

  const toggleRequired = () => {
    setRequired(!required);
    onUpdate(question.id, { required: !required });
  };

  const handleContentUpdate = (data: Partial<typeof question>) => {
    onUpdate(question.id, data);
  };

  const renderQuestionInput = () => {
    if (readOnly) {
      return <h3 className="text-lg font-medium mb-4">{questionTitle}</h3>;
    }
    return (
      <input
        type="text"
        value={questionTitle}
        onChange={handleTitleChange}
        placeholder="Escribe la pregunta"
        className="text-lg font-medium w-full border-b border-gray-300 focus:border-form-primary focus:outline-none py-1 px-0 mb-4 bg-transparent"
      />
    );
  };

  return (
    <div className={cn(
      "question-card group",
      !readOnly && "border-l-4 border-transparent hover:border-form-primary"
    )}>
      <div className="flex items-start">
        {!readOnly && (
          <div className="mr-3 mt-2 text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={20} />
          </div>
        )}
        <div className="flex-1">
          {renderQuestionInput()}
          {!readOnly && (
            <QuestionTypeSelector selected={questionType} onChange={handleTypeChange} />
          )}
          <QuestionContent 
            question={question} 
            onUpdate={handleContentUpdate} 
            readOnly={readOnly} 
          />
        </div>

        {!readOnly && (
          <div className="ml-3 flex flex-col items-center space-y-2">
            <button
              onClick={toggleRequired}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                required 
                  ? "bg-form-primary text-white" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              title={required ? "Campo obligatorio" : "Campo opcional"}
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => onDelete(question.id)}
              className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              title="Eliminar pregunta"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export type { QuestionData, QuestionProps } from "./types";
