
import { cn } from "@/lib/utils";
import { QuestionTypeProps } from "../types";
import { questionTypes } from "@/components/ui/question-types";

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
