
import { useState } from "react";
import { Trash2, GripVertical, Check, FileUp, Plus, AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionType, Option, AddOptionButton, DiagnosisList, Diagnosis, MultifieldItem, MultifieldConfig } from "./question-types";
import { nanoid } from "nanoid";

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
  vitalType?: string;
  sysMin?: number;
  sysMax?: number;
  diaMin?: number;
  diaMax?: number;
  fileTypes?: string[];
  maxFileSize?: number;
  multifields?: MultifieldConfig[];
  orientation?: "vertical" | "horizontal";
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
  const [fileTypes, setFileTypes] = useState<string[]>(question.fileTypes || ["application/pdf", "image/jpeg", "image/png"]);
  const [maxFileSize, setMaxFileSize] = useState<number>(question.maxFileSize || 2);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  
  const [multifields, setMultifields] = useState<MultifieldConfig[]>(
    question.multifields || [
      { id: nanoid(), label: "Campo 1" },
      { id: nanoid(), label: "Campo 2" }
    ]
  );
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">(
    question.orientation || "vertical"
  );

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

    if (questionType === "multifield") {
      data.multifields = multifields;
      data.orientation = orientation;
    }
    
    if (questionType === "file") {
      data.fileTypes = fileTypes;
      data.maxFileSize = maxFileSize;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");
    
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setFileError("Tipo de archivo no permitido. Solo se aceptan PDF, JPG o PNG.");
      e.target.value = "";
      return;
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      setFileError(`El archivo excede el tamaño máximo de ${maxFileSize}MB.`);
      e.target.value = "";
      return;
    }
    
    setSelectedFile(file);
  };

  const handleMultifieldLabelChange = (id: string, label: string) => {
    const updatedMultifields = multifields.map(field => 
      field.id === id ? { ...field, label } : field
    );
    setMultifields(updatedMultifields);
    onUpdate(question.id, { multifields: updatedMultifields });
  };

  const addMultifield = () => {
    const newMultifields = [
      ...multifields, 
      { id: nanoid(), label: `Campo ${multifields.length + 1}` }
    ];
    setMultifields(newMultifields);
    onUpdate(question.id, { multifields: newMultifields });
  };

  const removeMultifield = (id: string) => {
    if (multifields.length <= 2) return;
    const newMultifields = multifields.filter(field => field.id !== id);
    setMultifields(newMultifields);
    onUpdate(question.id, { multifields: newMultifields });
  };

  const toggleOrientation = () => {
    const newOrientation = orientation === "vertical" ? "horizontal" : "vertical";
    setOrientation(newOrientation);
    onUpdate(question.id, { orientation: newOrientation });
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
        case 'signature':
          return (
            <div className="border border-gray-300 rounded-md h-32 bg-gray-50 flex items-center justify-center text-gray-400">
              Área para firma
            </div>
          );
        case 'file':
          return (
            <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <FileUp size={24} className="mb-2" />
                <p>Clic para adjuntar archivo</p>
                <p className="text-xs mt-1">PDF, JPG o PNG (máx. {question.maxFileSize || 2}MB)</p>
              </div>
            </div>
          );
        
        case "multifield": {
          return (
            <div className={cn(
              "space-y-2",
              orientation === "horizontal" && "sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4"
            )}>
              {multifields.map((field) => (
                <div key={field.id} className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type="text" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
                </div>
              ))}
            </div>
          );
        }
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

    if (questionType === "file") {
      return (
        <div className="mt-4 space-y-3">
          <div className="border border-dashed border-gray-300 hover:border-gray-400 transition-colors rounded-md p-6 cursor-pointer bg-gray-50 text-center">
            <label htmlFor={`file-upload-${question.id}`} className="cursor-pointer flex flex-col items-center">
              <FileUp size={24} className="mb-2 text-gray-500" />
              <span className="text-sm text-gray-700 mb-1">
                Clic para seleccionar un archivo
              </span>
              <span className="text-xs text-gray-500">
                PDF, JPG o PNG (máx. {maxFileSize}MB)
              </span>
              <input
                id={`file-upload-${question.id}`}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
            {selectedFile && (
              <div className="mt-3 text-sm text-left flex items-center justify-between bg-blue-50 p-2 rounded">
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
                </span>
              </div>
            )}
            {fileError && (
              <div className="mt-2 text-xs text-red-500">{fileError}</div>
            )}
          </div>
          <div className="flex items-center">
            <span className="mr-3 text-sm text-gray-600">Tamaño máximo (MB):</span>
            <input
              type="number"
              value={maxFileSize}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setMaxFileSize(value > 0 ? value : 1);
                onUpdate(question.id, { maxFileSize: value > 0 ? value : 1 });
              }}
              min="1"
              max="10"
              className="w-20 border border-gray-300 rounded-md p-1 text-sm"
            />
          </div>
        </div>
      );
    }

    if (questionType === "multifield") {
      return (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Campos de texto</h4>
            <button
              onClick={toggleOrientation}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-form-primary transition-colors p-1 rounded"
            >
              {orientation === "vertical" ? (
                <>
                  <AlignVerticalSpaceBetween size={16} />
                  <span>Vertical</span>
                </>
              ) : (
                <>
                  <AlignHorizontalSpaceBetween size={16} />
                  <span>Horizontal</span>
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-2">
            {multifields.map((field) => (
              <MultifieldItem
                key={field.id}
                id={field.id}
                label={field.label}
                onLabelChange={handleMultifieldLabelChange}
                onRemove={removeMultifield}
                canRemove={multifields.length > 2}
              />
            ))}
            
            <button
              onClick={addMultifield}
              className="flex items-center gap-2 text-gray-600 hover:text-form-primary transition-all mt-2"
            >
              <Plus size={16} />
              <span>Agregar campo</span>
            </button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">Vista previa:</p>
            <div className={cn(
              "mt-2 space-y-3",
              orientation === "horizontal" && "sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4"
            )}>
              {multifields.map((field) => (
                <div key={field.id} className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type="text" disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent" />
                </div>
              ))}
            </div>
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
