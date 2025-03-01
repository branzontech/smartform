
import { useState } from "react";
import { Trash2, GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionType, Option, AddOptionButton, DiagnosisList, Diagnosis } from "./question-types";

// Lista de diagnósticos predeterminados para demostración
const predefinedDiagnoses: Diagnosis[] = [
  { id: "1", code: "E11", name: "Diabetes tipo 2" },
  { id: "2", code: "I10", name: "Hipertensión esencial (primaria)" },
  { id: "3", code: "J45", name: "Asma" },
  { id: "4", code: "K29.7", name: "Gastritis, no especificada" },
  { id: "5", code: "M54.5", name: "Dolor lumbar" },
  { id: "6", code: "G43", name: "Migraña" },
  { id: "7", code: "F41.1", name: "Trastorno de ansiedad generalizada" },
  { id: "8", code: "F32", name: "Episodio depresivo" },
  { id: "9", code: "J03", name: "Amigdalitis aguda" },
  { id: "10", code: "B01", name: "Varicela" },
  { id: "11", code: "A09", name: "Diarrea y gastroenteritis de presunto origen infeccioso" },
  { id: "12", code: "N39.0", name: "Infección de vías urinarias, sitio no especificado" },
  { id: "13", code: "H10", name: "Conjuntivitis" },
  { id: "14", code: "J01", name: "Sinusitis aguda" },
  { id: "15", code: "L20", name: "Dermatitis atópica" }
];

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
  diagnoses?: Diagnosis[];
  vitalType?: string; // Tipo de signo vital (TA, FC, FR, etc.)
  sysMin?: number; // Para tensión arterial: mínimo sistólica
  sysMax?: number; // Para tensión arterial: máximo sistólica
  diaMin?: number; // Para tensión arterial: mínimo diastólica
  diaMax?: number; // Para tensión arterial: máximo diastólica
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
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Diagnosis[]>(question.diagnoses || []);
  const [vitalType, setVitalType] = useState(question.vitalType || "general");
  const [sysMin, setSysMin] = useState(question.sysMin || 90);
  const [sysMax, setSysMax] = useState(question.sysMax || 140);
  const [diaMin, setDiaMin] = useState(question.diaMin || 60);
  const [diaMax, setDiaMax] = useState(question.diaMax || 90);

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
      data.vitalType = vitalType;
      
      if (vitalType === "TA") {
        data.sysMin = sysMin;
        data.sysMax = sysMax;
        data.diaMin = diaMin;
        data.diaMax = diaMax;
        data.units = "mmHg";
      } else {
        data.min = min;
        data.max = max;
        data.units = units;
      }
    }

    if (questionType === "diagnosis") {
      data.diagnoses = selectedDiagnoses;
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

  const handleVitalTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVitalType = e.target.value;
    setVitalType(newVitalType);
    
    // Actualizar unidades predeterminadas según el tipo de vital
    let newUnits = "";
    if (newVitalType === "TA") newUnits = "mmHg";
    else if (newVitalType === "FC") newUnits = "lpm";
    else if (newVitalType === "FR") newUnits = "rpm";
    else if (newVitalType === "temperatura") newUnits = "°C";
    else if (newVitalType === "saturacion") newUnits = "%";
    else if (newVitalType === "estatura") newUnits = "cm";
    else if (newVitalType === "peso") newUnits = "kg";
    else if (newVitalType === "IMC") newUnits = "kg/m²";
    
    setUnits(newUnits);
    
    onUpdate(question.id, { 
      vitalType: newVitalType,
      units: newUnits
    });
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

  const handleSysMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSysMin(value);
    onUpdate(question.id, { sysMin: value });
  };

  const handleSysMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSysMax(value);
    onUpdate(question.id, { sysMax: value });
  };

  const handleDiaMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDiaMin(value);
    onUpdate(question.id, { diaMin: value });
  };

  const handleDiaMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDiaMax(value);
    onUpdate(question.id, { diaMax: value });
  };

  const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnits(e.target.value);
    onUpdate(question.id, { units: e.target.value });
  };

  const handleDiagnosisSelect = (diagnosis: Diagnosis) => {
    const newSelectedDiagnoses = [...selectedDiagnoses, diagnosis];
    setSelectedDiagnoses(newSelectedDiagnoses);
    onUpdate(question.id, { diagnoses: newSelectedDiagnoses });
  };

  const handleDiagnosisRemove = (id: string) => {
    const newSelectedDiagnoses = selectedDiagnoses.filter(d => d.id !== id);
    setSelectedDiagnoses(newSelectedDiagnoses);
    onUpdate(question.id, { diagnoses: newSelectedDiagnoses });
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
          if (question.vitalType === "TA") {
            return (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Tensión Arterial (T/A): {question.sysMin || 90}-{question.sysMax || 140}/{question.diaMin || 60}-{question.diaMax || 90} {question.units || "mmHg"}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input type="number" disabled placeholder="Sistólica" className="w-1/2 border border-gray-300 rounded-md p-2 bg-transparent" />
                  <span className="text-lg">/</span>
                  <input type="number" disabled placeholder="Diastólica" className="w-1/2 border border-gray-300 rounded-md p-2 bg-transparent" />
                </div>
              </div>
            );
          } else if (question.vitalType === "IMC") {
            return (
              <div>
                <p className="text-sm text-gray-500 mb-2">Índice de Masa Corporal (IMC)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Peso (kg)</label>
                    <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Altura (cm)</label>
                    <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">IMC</label>
                    <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent bg-gray-50" />
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Rango: {question.min || 0} - {question.max || 100} {question.units || ''}</span>
                </div>
                <input type="number" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
              </div>
            );
          }
        case 'diagnosis':
          return (
            <div className="border border-gray-300 rounded-md p-2">
              {selectedDiagnoses.length > 0 ? (
                <div className="space-y-2">
                  {selectedDiagnoses.map(diagnosis => (
                    <div key={diagnosis.id} className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md">
                      <span className="font-medium text-blue-700">{diagnosis.code}</span>
                      <span>-</span>
                      <span>{diagnosis.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center p-2">
                  No se han seleccionado diagnósticos
                </div>
              )}
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
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo de signo vital:</label>
            <select
              value={vitalType}
              onChange={handleVitalTypeChange}
              onBlur={updateQuestion}
              className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
            >
              <option value="general">General</option>
              <option value="TA">Tensión Arterial (T/A)</option>
              <option value="FC">Frecuencia Cardíaca (FC)</option>
              <option value="FR">Frecuencia Respiratoria (FR)</option>
              <option value="temperatura">Temperatura</option>
              <option value="saturacion">Saturación de Oxígeno</option>
              <option value="estatura">Estatura</option>
              <option value="peso">Peso</option>
              <option value="IMC">Índice de Masa Corporal (IMC)</option>
            </select>
          </div>

          {vitalType === "TA" ? (
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Sistólica mínima:</label>
                  <input
                    type="number"
                    value={sysMin}
                    onChange={handleSysMinChange}
                    onBlur={updateQuestion}
                    className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Sistólica máxima:</label>
                  <input
                    type="number"
                    value={sysMax}
                    onChange={handleSysMaxChange}
                    onBlur={updateQuestion}
                    className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Diastólica mínima:</label>
                  <input
                    type="number"
                    value={diaMin}
                    onChange={handleDiaMinChange}
                    onBlur={updateQuestion}
                    className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Diastólica máxima:</label>
                  <input
                    type="number"
                    value={diaMax}
                    onChange={handleDiaMaxChange}
                    onBlur={updateQuestion}
                    className="w-full border border-gray-300 rounded-md p-2 focus:border-form-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : vitalType === "IMC" ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                El IMC se calculará automáticamente a partir del peso y la altura.
              </p>
            </div>
          ) : (
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
          )}

          {vitalType !== "TA" && vitalType !== "IMC" && (
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
          )}
        </div>
      );
    }

    if (questionType === "diagnosis") {
      return (
        <DiagnosisList 
          diagnoses={predefinedDiagnoses}
          selectedDiagnoses={selectedDiagnoses}
          onSelect={handleDiagnosisSelect}
          onRemove={handleDiagnosisRemove}
        />
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
