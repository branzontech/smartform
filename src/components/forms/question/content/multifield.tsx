
import { cn } from "@/lib/utils";
import { Plus, AlignVerticalSpaceBetween, AlignHorizontalSpaceBetween } from "lucide-react";
import { MultifieldItem } from "../controls/multifield-item";
import { MultifieldConfig } from "../types";

interface MultifieldProps {
  multifields: MultifieldConfig[];
  orientation: "vertical" | "horizontal";
  readonly?: boolean;
  handleLabelChange: (id: string, label: string) => void;
  removeMultifield: (id: string) => void;
  addMultifield: () => void;
  toggleOrientation: () => void;
}

export const Multifield = ({
  multifields,
  orientation,
  readonly = false,
  handleLabelChange,
  removeMultifield,
  addMultifield,
  toggleOrientation
}: MultifieldProps) => {
  if (readonly) {
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
            onLabelChange={handleLabelChange}
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
};
