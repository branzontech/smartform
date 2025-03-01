import { CheckSquare, Circle, List, MessageSquare, Minus, Plus, Type, Calculator, Activity, Stethoscope, FileText, Search, Check, Edit3, FileUp, AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SignaturePad } from "./signature-pad";

interface QuestionTypeProps {
  selected: string;
  onChange: (type: string) => void;
}

export const questionTypes = [
  { id: "short", label: "Respuesta corta", icon: Type },
  { id: "paragraph", label: "Párrafo", icon: MessageSquare },
  { id: "multiple", label: "Selección múltiple", icon: Circle },
  { id: "checkbox", label: "Casillas", icon: CheckSquare },
  { id: "dropdown", label: "Desplegable", icon: List },
  { id: "calculation", label: "Campo calculable", icon: Calculator },
  { id: "vitals", label: "Signos vitales", icon: Activity },
  { id: "diagnosis", label: "Diagnóstico", icon: Stethoscope },
  { id: "clinical", label: "Datos clínicos", icon: FileText },
  { id: "multifield", label: "Campos múltiples", icon: AlignVerticalSpaceBetween },
  { id: "signature", label: "Firma", icon: Edit3 },
  { id: "file", label: "Adjuntar archivo", icon: FileUp },
];

export const QuestionType = ({ selected, onChange }: QuestionTypeProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {questionTypes.map((type) => {
        const isSelected = selected === type.id;
        return (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200",
              isSelected 
                ? "bg-form-primary text-white shadow-md" 
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            )}
          >
            <type.icon size={16} />
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
};

interface OptionProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  isMultiple?: boolean;
}

export const Option = ({
  value,
  onChange,
  onRemove,
  canRemove,
  isMultiple = false,
}: OptionProps) => {
  return (
    <div className="flex items-center gap-3 mb-2 animate-fade-in">
      {isMultiple ? (
        <CheckSquare size={18} className="text-gray-400" />
      ) : (
        <Circle size={18} className="text-gray-400" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Opción"
        className="flex-1 border-b border-gray-300 focus:border-form-primary focus:outline-none py-1 px-0 bg-transparent"
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className={cn(
          "p-1 rounded-full transition-all",
          canRemove 
            ? "text-gray-500 hover:bg-gray-100" 
            : "text-gray-300 cursor-not-allowed"
        )}
      >
        <Minus size={16} />
      </button>
    </div>
  );
};

interface AddOptionButtonProps {
  onClick: () => void;
}

export const AddOptionButton = ({ onClick }: AddOptionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-gray-600 hover:text-form-primary transition-all mt-2"
    >
      <Plus size={16} />
      <span>Agregar opción</span>
    </button>
  );
};

export type QuestionType = 
  | "short" 
  | "paragraph" 
  | "multiple" 
  | "checkbox" 
  | "dropdown" 
  | "calculation" 
  | "vitals" 
  | "diagnosis" 
  | "clinical" 
  | "multifield"
  | "signature"
  | "file";

interface Diagnosis {
  id: string;
  code: string;
  name: string;
}

interface DiagnosisListProps {
  diagnoses: Diagnosis[];
  selectedDiagnoses: Diagnosis[];
  onSelect: (diagnosis: Diagnosis) => void;
  onRemove: (id: string) => void;
}

export const DiagnosisList = ({ diagnoses, selectedDiagnoses, onSelect, onRemove }: DiagnosisListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredDiagnoses = diagnoses.filter(
    (diagnosis) => 
      diagnosis.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      diagnosis.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-4">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-form-primary focus:border-form-primary"
          placeholder="Buscar diagnóstico por código o nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {selectedDiagnoses.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Diagnósticos seleccionados:</h4>
          <div className="space-y-2">
            {selectedDiagnoses.map(diagnosis => (
              <div 
                key={diagnosis.id} 
                className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md"
              >
                <div>
                  <span className="font-medium text-blue-700">{diagnosis.code}</span>
                  <span className="mx-2">-</span>
                  <span>{diagnosis.name}</span>
                </div>
                <button
                  onClick={() => onRemove(diagnosis.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Minus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
        {filteredDiagnoses.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredDiagnoses.map(diagnosis => {
              const isSelected = selectedDiagnoses.some(d => d.id === diagnosis.id);
              return (
                <li 
                  key={diagnosis.id}
                  className={cn(
                    "px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50",
                    isSelected && "bg-blue-50"
                  )}
                  onClick={() => !isSelected && onSelect(diagnosis)}
                >
                  <div>
                    <span className="font-medium">{diagnosis.code}</span>
                    <span className="mx-2">-</span>
                    <span>{diagnosis.name}</span>
                  </div>
                  {isSelected && <Check size={16} className="text-blue-600" />}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No se encontraron diagnósticos" : "Lista de diagnósticos disponibles"}
          </div>
        )}
      </div>
    </div>
  );
};

interface MultifieldItemProps {
  id: string;
  label: string;
  onLabelChange: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export const MultifieldItem = ({
  id,
  label,
  onLabelChange,
  onRemove,
  canRemove,
}: MultifieldItemProps) => {
  return (
    <div className="flex items-center gap-3 mb-2 animate-fade-in">
      <input
        type="text"
        value={label}
        onChange={(e) => onLabelChange(id, e.target.value)}
        placeholder="Etiqueta del campo"
        className="flex-1 border-b border-gray-300 focus:border-form-primary focus:outline-none py-1 px-0 bg-transparent"
      />
      <button
        onClick={() => onRemove(id)}
        disabled={!canRemove}
        className={cn(
          "p-1 rounded-full transition-all",
          canRemove 
            ? "text-gray-500 hover:bg-gray-100" 
            : "text-gray-300 cursor-not-allowed"
        )}
      >
        <Minus size={16} />
      </button>
    </div>
  );
};

export interface MultifieldConfig {
  id: string;
  label: string;
}
