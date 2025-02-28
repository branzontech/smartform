
import { CheckSquare, Circle, List, MessageSquare, Minus, Plus, Type } from "lucide-react";
import { cn } from "@/lib/utils";

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
