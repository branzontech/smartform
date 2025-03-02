
import { Option } from "../controls/option";
import { AddOptionButton } from "../controls/add-option-button";

interface MultipleChoiceProps {
  options: string[];
  questionId: string;
  readonly?: boolean;
  handleOptionChange: (index: number, value: string) => void;
  removeOption: (index: number) => void;
  addOption: () => void;
}

export const MultipleChoice = ({
  options,
  questionId,
  readonly = false,
  handleOptionChange,
  removeOption,
  addOption
}: MultipleChoiceProps) => {
  if (readonly) {
    return (
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input type="radio" name={`q-${questionId}`} id={`q-${questionId}-${index}`} className="text-form-primary" disabled />
            <label htmlFor={`q-${questionId}-${index}`}>{option || `Opción ${index + 1}`}</label>
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
