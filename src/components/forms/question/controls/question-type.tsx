
import { cn } from "@/lib/utils";
import { CheckSquare, Circle, List, MessageSquare, Type, Calculator, Activity, Stethoscope, FileText, Edit3, FileUp, AlignVerticalSpaceBetween } from "lucide-react";

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

interface QuestionTypeProps {
  selected: string;
  onChange: (type: string) => void;
}

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
