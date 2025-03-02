
import { Plus } from "lucide-react";
import { AddOptionButtonProps } from "../types";

export const AddOptionButton = ({ onClick }: AddOptionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-gray-600 hover:text-form-primary transition-all mt-2"
    >
      <Plus size={16} />
      <span>Agregar opción</span>
    </button>
  );
};
