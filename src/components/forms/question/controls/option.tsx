
import { cn } from "@/lib/utils";
import { CheckSquare, Circle, Minus } from "lucide-react";
import { OptionProps } from "../types";

export const Option = ({
  value,
  onChange,
  onRemove,
  onAddNext,
  canRemove,
  isMultiple = false,
}: OptionProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddNext?.();
    }
  };

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
        onKeyDown={handleKeyDown}
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
