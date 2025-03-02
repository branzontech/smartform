
import { Option } from "../controls/option";
import { AddOptionButton } from "../controls/add-option-button";

interface DropdownProps {
  options: string[];
  readonly?: boolean;
  handleOptionChange: (index: number, value: string) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
}

export const Dropdown = ({
  options,
  readonly = false,
  handleOptionChange,
  removeOption,
  addOption
}: DropdownProps) => {
  if (readonly) {
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
