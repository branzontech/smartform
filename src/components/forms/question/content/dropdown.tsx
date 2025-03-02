
import React, { useState } from "react";
import { ContentComponentProps } from "../types";
import { Option } from "../controls/option";
import { AddOptionButton } from "../controls/add-option-button";

export const Dropdown: React.FC<ContentComponentProps> = ({ 
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
      <select disabled className="w-full border border-gray-300 rounded-md p-2 bg-transparent">
        <option value="" disabled selected>Seleccionar</option>
        {options.map((option, index) => (
          option ? <option key={index} value={option}>{option}</option> : null
        ))}
      </select>
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
