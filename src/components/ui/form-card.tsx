
import { useState } from "react";
import { Edit, View, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";

interface FormCardProps {
  id: string;
  title: string;
  lastUpdated: Date;
  responseCount: number;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onResponses: (id: string) => void;
}

export const FormCard = ({ 
  id, 
  title, 
  lastUpdated, 
  responseCount, 
  onEdit, 
  onView, 
  onResponses 
}: FormCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const formattedDate = formatDistance(
    lastUpdated,
    new Date(),
    { addSuffix: true, locale: es }
  );

  return (
    <div 
      className="form-card animate-scale-in group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={cn(
          "h-36 transition-all duration-300 flex flex-col justify-between",
          isHovered ? "h-24" : "h-36"
        )}
      >
        <div className="p-5">
          <h3 className="font-medium text-xl truncate">{title}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <span>Modificado {formattedDate}</span>
            <span className="mx-2">•</span>
            <span>{responseCount} respuesta{responseCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
      
      <div 
        className={cn(
          "flex border-t border-gray-100 transition-all duration-300 overflow-hidden",
          isHovered ? "h-12 opacity-100" : "h-0 opacity-0"
        )}
      >
        <button 
          onClick={() => onEdit(id)}
          className="flex-1 flex items-center justify-center py-3 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
        >
          <Edit size={16} className="mr-2" />
          <span>Editar</span>
        </button>
        
        <div className="w-px bg-gray-100" />
        
        <button 
          onClick={() => onView(id)}
          className="flex-1 flex items-center justify-center py-3 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
        >
          <View size={16} className="mr-2" />
          <span>Ver</span>
        </button>
        
        <div className="w-px bg-gray-100" />
        
        <button 
          onClick={() => onResponses(id)}
          className="flex-1 flex items-center justify-center py-3 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
        >
          <BarChart size={16} className="mr-2" />
          <span>Respuestas</span>
        </button>
      </div>
    </div>
  );
};
