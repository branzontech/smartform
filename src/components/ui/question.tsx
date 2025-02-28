
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
  formula?: string;
  min?: number;
  max?: number;
  units?: string;
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
  const [formula, setFormula] = useState(question.formula || "");
  const [min, setMin] = useState(question.min || 0);
  const [max, setMax] = useState(question.max || 100);
  const [units, setUnits] = useState(question.units || "");

  const updateQuestion = () => {
    const data: Partial<QuestionData> = {
      title: questionTitle,
      type: questionType,
      required,
    };

    if (questionType === "multiple" || questionType === "checkbox" || questionType === "dropdown") {
      data.options = options.filter(opt => opt.trim() !== "");
    }

    if (questionType === "calculation") {
      data.formula = formula;
    }

    if (questionType === "vitals") {
      data.min = min;
      data.max = max;
      data.units = units;
    }

    onUpdate(question.id, data);
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

  const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormula(e.target.value);
    onUpdate(question.id, { formula: e.target.value });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMin(value);
    onUpdate(question.id, { min: value });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMax(value);
    onUpdate(question.id, { max: value });
  };

  const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnits(e.target.value);
    onUpdate(question.id, { units: e.target.value });
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
        case 'calculation':
          return (
            <div>
              <p className="text-sm text-gray-500">Campo calculable: {formula}</p>
              <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
            </div>
          );
        case 'vitals':
          return (
            <div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Rango: {min} - {max} {units}</span>
              </div>
              <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
            </div>
          );
        case 'diagnosis':
          return (
            <div className="border border-gray-300 rounded-md p-2">
              <input type="text" placeholder="Diagnóstico" disabled className="w-full bg-transparent" />
              <textarea placeholder="Detalles del diagnóstico" disabled className="w-full mt-2 bg-transparent" rows={2} />
            </div>
          );
        case 'clinical':
          return (
            <div className="border border-gray-300 rounded-md p-2">
              <input type="text" placeholder="Datos clínicos" disabled className="w-full bg-transparent" />
              <textarea placeholder="Información detallada" disabled className="w-full mt-2 bg-transparent" rows={2} />
            </div>
          );
        default:
          return null;
      }
    }

    if (["multiple", "checkbox", "dropdown"].includes(questionType)) {
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
    }

    if (questionType === "calculation") {
      return (
        <div className="mt-4">
          <label className="block text-sm text-gray-600 mb-1">Fórmula de cálculo:</label>
          <input
            type="text"
            value={formula}
            onChange={handleFormulaChange}
            onBlur={updateQuestion}
            placeholder="Ej: [Peso] / ([Altura] * [Altura])"
            className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Usa [NombreCampo] para referenciar otros campos en la fórmula
          </p>
        </div>
      );
    }

    if (questionType === "vitals") {
      return (
        <div className="mt-4 space-y-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Valor mínimo:</label>
              <input
                type="number"
                value={min}
                onChange={handleMinChange}
                onBlur={updateQuestion}
                className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Valor máximo:</label>
              <input
                type="number"
                value={max}
                onChange={handleMaxChange}
                onBlur={updateQuestion}
                className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Unidades:</label>
            <input
              type="text"
              value={units}
              onChange={handleUnitsChange}
              onBlur={updateQuestion}
              placeholder="mmHg, bpm, kg, etc."
              className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
            />
          </div>
        </div>
      );
    }

    return null;
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
