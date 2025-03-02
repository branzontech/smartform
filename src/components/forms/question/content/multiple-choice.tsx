
import React, { useState } from "react";
import { ContentComponentProps, OptionProps } from "../types";
import { Option } from "../controls/option";
import { AddOptionButton } from "../controls/add-option-button";

export const MultipleChoice: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  const [options, setOptions] = useState(question.options || ["", ""]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate({ options: newOptions });
  };

  if (readOnly) {
    return (
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input 
              type="radio" 
              name={`q-${question.id}`} 
              id={`q-${question.id}-${index}`} 
              className="text-form-primary" 
              disabled 
            />
            <label htmlFor={`q-${question.id}-${index}`}>{option || `Opción ${index + 1}`}</label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2">
      {options.map((option, index) => (
        <Option
          key={index}
          value={option}
          onChange={(value) => handleOptionChange(index, value)}
          onRemove={() => removeOption(index)}
          canRemove={options.length > 2}
          isMultiple={false}
        />
      ))}
      <AddOptionButton onClick={addOption} />
    </div>
  );
};
