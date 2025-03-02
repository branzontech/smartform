
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FormTitleProps {
  defaultTitle?: string;
  defaultDescription?: string;
  readOnly?: boolean;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  className?: string;
}

export const FormTitle = ({
  defaultTitle = "Formulario sin título",
  defaultDescription = "",
  readOnly = false,
  onTitleChange,
  onDescriptionChange,
  className,
}: FormTitleProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (onTitleChange) onTitleChange(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    if (onDescriptionChange) onDescriptionChange(e.target.value);
  };

  return (
    <div className={cn("form-header p-6 border-b border-gray-200", className)}>
      {readOnly ? (
        <>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {description && <p className="mt-2 text-gray-600">{description}</p>}
        </>
      ) : (
        <>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Título del formulario"
            className="text-2xl font-bold w-full bg-transparent border-none hover:border-b hover:border-gray-300 focus:border-form-primary focus:outline-none transition-all duration-200 px-0 py-1 text-gray-800"
          />
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Descripción del formulario (opcional)"
            className="mt-2 text-gray-600 w-full bg-transparent resize-none border-none hover:border-b hover:border-gray-300 focus:border-form-primary focus:outline-none transition-all duration-200 px-0 py-1"
            rows={2}
          />
        </>
      )}
    </div>
  );
};
