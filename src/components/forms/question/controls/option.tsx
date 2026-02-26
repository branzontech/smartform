
import { cn } from "@/lib/utils";
import { Minus } from "lucide-react";
import { OptionProps } from "../types";

export const Option = ({
  value,
  onChange,
  onRemove,
  onAddNext,
  canRemove,
}: OptionProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddNext?.();
    }
  };

  return (
    <div className="flex items-center gap-1.5 mb-1.5 animate-fade-in min-w-0">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Opción"
        className="flex-1 min-w-0 border-b border-border focus:border-primary focus:outline-none py-1 px-0 bg-transparent text-sm"
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className={cn(
          "shrink-0 p-0.5 rounded-full transition-all",
          canRemove 
            ? "text-muted-foreground hover:bg-muted" 
            : "text-muted-foreground/30 cursor-not-allowed"
        )}
      >
        <Minus size={14} />
      </button>
    </div>
  );
};
