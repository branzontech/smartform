
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ContentComponentProps } from "../types";
import { Option } from "../controls/option";
import { AddOptionButton } from "../controls/add-option-button";

export const Dropdown: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  const [options, setOptions] = useState(question.options || ["", ""]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusIndex !== null && containerRef.current) {
      const inputs = containerRef.current.querySelectorAll<HTMLInputElement>("input[type='text']");
      inputs[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex, options.length]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onUpdate({ options: newOptions });
  };

  const addOptionAfter = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index + 1, 0, "");
    setOptions(newOptions);
    onUpdate({ options: newOptions });
    setFocusIndex(index + 1);
  };

  const addOption = () => {
    const newOptions = [...options, ""];
    setOptions(newOptions);
    onUpdate({ options: newOptions });
    setFocusIndex(newOptions.length - 1);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate({ options: newOptions });
  };

  const isHorizontal = question.optionLayout === "horizontal";
  const columns = Math.min(question.optionColumns || 2, 3);

  if (readOnly) {
    return (
      <select disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent">
        <option value="" disabled selected>Seleccionar</option>
        {options.map((option, index) => (
          option ? <option key={index} value={option}>{option}</option> : null
        ))}
      </select>
    );
  }

  return (
    <div className="mt-2" ref={containerRef}>
      <div
        className={cn(
          isHorizontal ? "grid gap-1" : ""
        )}
        style={isHorizontal ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      >
        {options.map((option, index) => (
          <Option
            key={index}
            value={option}
            onChange={(value) => handleOptionChange(index, value)}
            onRemove={() => removeOption(index)}
            onAddNext={() => addOptionAfter(index)}
            canRemove={options.length > 2}
            isMultiple={false}
          />
        ))}
      </div>
      <AddOptionButton onClick={addOption} />
    </div>
  );
};
