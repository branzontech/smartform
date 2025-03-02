
import React, { useState } from "react";
import { ContentComponentProps, MultifieldConfig } from "../types";
import { MultifieldItem } from "../controls/multifield-item";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween, Plus } from "lucide-react";

export const Multifield: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  const [multifields, setMultifields] = useState<MultifieldConfig[]>(
    question.multifields || [
      { id: nanoid(), label: "Campo 1" },
      { id: nanoid(), label: "Campo 2" }
    ]
  );
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">(
    question.orientation || "vertical"
  );

  const handleMultifieldLabelChange = (id: string, label: string) => {
    const updatedMultifields = multifields.map(field => 
      field.id === id ? { ...field, label } : field
    );
    setMultifields(updatedMultifields);
    onUpdate({ multifields: updatedMultifields });
  };

  const addMultifield = () => {
    const newMultifields = [
      ...multifields, 
      { id: nanoid(), label: `Campo ${multifields.length + 1}` }
    ];
    setMultifields(newMultifields);
    onUpdate({ multifields: newMultifields });
  };

  const removeMultifield = (id: string) => {
    if (multifields.length <= 2) return;
    const newMultifields = multifields.filter(field => field.id !== id);
    setMultifields(newMultifields);
    onUpdate({ multifields: newMultifields });
  };

  const toggleOrientation = () => {
    const newOrientation = orientation === "vertical" ? "horizontal" : "vertical";
    setOrientation(newOrientation);
    onUpdate({ orientation: newOrientation });
  };

  if (readOnly) {
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
};
