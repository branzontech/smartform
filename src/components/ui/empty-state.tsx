
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const EmptyState = ({
  title,
  description,
  buttonText,
  onClick,
  icon = <FileText size={48} className="text-gray-300" />,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 animate-fade-in">
      <div className="mb-6">{icon}</div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      <Button onClick={onClick} className="bg-form-primary hover:bg-form-primary/90">
        <Plus className="mr-2" size={16} />
        {buttonText}
      </Button>
    </div>
  );
};
