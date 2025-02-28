
import { useState } from "react";
import { Trash2, GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionType, Option, AddOptionButton } from "./question-types";

export interface QuestionData {
  id: string;
  type: string;
  title: string;
  required: boolean;
  options?: string[];
}

interface QuestionProps {
  question: QuestionData;
  onUpdate: (id: string, data: Partial<QuestionData>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export const Question = ({
  question,
  onUpdate,
  onDelete,
  readOnly = false,
}: QuestionProps) => {
  const [questionTitle, setQuestionTitle] = useState(question.title);
  const [questionType, setQuestionType] = useState(question.type);
  const [options, setOptions] = useState(question.options || ["", ""]);
  const [required, setRequired] = useState(question.required);

  const updateQuestion = () => {
    onUpdate(question.id, {
      title: questionTitle,
      type: questionType,
      required,
      options: questionType === "multiple" || questionType === "checkbox" || questionType === "dropdown" 
        ? options.filter(opt => opt.trim() !== "") 
        : undefined
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestionTitle(e.target.value);
    onUpdate(question.id, { title: e.target.value });
  };

  const handleTypeChange = (type: string) => {
    setQuestionType(type);
    onUpdate(question.id, { type });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onUpdate(question.id, { options: newOptions });
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate(question.id, { options: newOptions });
  };

  const toggleRequired = () => {
    setRequired(!required);
    onUpdate(question.id, { required: !required });
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
        onBlur={updateQuestion}
        placeholder="Escribe la pregunta"
        className="text-lg font-medium w-full border-b border-gray-300 focus:border-form-primary focus:outline-none py-1 px-0 mb-4 bg-transparent"
      />
    );
  };

  const renderQuestionContent = () => {
    if (readOnly) {
      switch (questionType) {
        case 'short':
          return <input type="text" placeholder="Respuesta corta" disabled className="w-full border-b border-gray-300 py-1 px-0 bg-transparent" />;
        case 'paragraph':
          return <textarea placeholder="Respuesta larga" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" rows={3} />;
        case 'multiple':
          return (
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="radio" name={`q-${question.id}`} id={`q-${question.id}-${index}`} className="text-form-primary" disabled />
                  <label htmlFor={`q-${question.id}-${index}`}>{option || `Opción ${index + 1}`}</label>
                </div>
              ))}
            </div>
          );
        case 'checkbox':
          return (
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="checkbox" id={`q-${question.id}-${index}`} className="text-form-primary" disabled />
                  <label htmlFor={`q-${question.id}-${index}`}>{option || `Opción ${index + 1}`}</label>
                </div>
              ))}
            </div>
          );
        case 'dropdown':
          return (
            <select disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent">
              <option value="" disabled selected>Seleccionar</option>
              {options.map((option, index) => (
                option ? <option key={index} value={option}>{option}</option> : null
              ))}
            </select>
          );
        default:
          return null;
      }
    }

    if (!["multiple", "checkbox", "dropdown"].includes(questionType)) {
      return null;
    }

    return (
      <div className="mt-2">
        {options.map((option, index) => (
          <Option
            key={index}
            value={option}
            onChange={(value) => handleOptionChange(index, value)}
            onRemove={() => removeOption(index)}
            canRemove={options.length > 2}
            isMultiple={questionType === "checkbox"}
          />
        ))}
        <AddOptionButton onClick={addOption} />
      </div>
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
            <QuestionType selected={questionType} onChange={handleTypeChange} />
          )}
          {renderQuestionContent()}
        </div>

        {!readOnly && (
          <div className="ml-3 flex flex-col items-center space-y-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onDelete(question.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={toggleRequired}
              className={cn(
                "rounded-full p-1 transition-colors",
                required 
                  ? "bg-form-primary text-white" 
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
              )}
              title={required ? "Pregunta requerida" : "Pregunta opcional"}
            >
              <Check size={16} />
            </button>
          </div>
        )}
      </div>
      
      {readOnly && required && (
        <div className="mt-2 text-sm text-red-500">* Requerido</div>
      )}
    </div>
  );
};
