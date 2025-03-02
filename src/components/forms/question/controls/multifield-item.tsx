
import { Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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
