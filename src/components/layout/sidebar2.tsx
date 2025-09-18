import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Stethoscope, 
  CreditCard, 
  MessageSquare, 
  ClipboardList,
  Cog,
  Plus,
  Database,
  PlusSquare,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Floating menu items (exactamente como en la imagen de referencia)
const floatingMenuItems = [
  { 
    id: "home", 
    icon: <Home size={20} />, 
    path: "/app/home",
    isActive: false 
  },
  { 
    id: "patients", 
    icon: <Users size={20} />, 
    path: "/app/pacientes",
    isActive: false 
  },
  { 
    id: "calendar", 
    icon: <Calendar size={20} />, 
    path: "/app/citas",
    isActive: false 
  },
  { 
    id: "plus", 
    icon: <Plus size={20} />, 
    path: "/app/crear",
    isActive: false 
  },
  { 
    id: "database", 
    icon: <Database size={20} />, 
    path: "/app/pacientes/dashboard",
    isActive: false 
  },
  { 
    id: "briefcase", 
    icon: <PlusSquare size={20} />, 
    path: "/app/admisiones",
    isActive: false 
  },
  // Separador visual
  { 
    id: "separator", 
    icon: null, 
    path: "",
    isActive: false 
  },
  { 
    id: "cog", 
    icon: <Cog size={20} />, 
    path: "/app/configuracion",
    isActive: false 
  },
  { 
    id: "trash", 
    icon: <Trash2 size={20} />, 
    path: "",
    isActive: false 
  },
];

export const Sidebar2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isVisible, setIsVisible] = useState(true);

  // Función para determinar si un item está activo
  const isItemActive = (path: string) => {
    if (path === "/app/home") {
      return currentPath === path || currentPath === "/app";
    }
    return currentPath.startsWith(path) && path !== "";
  };

  // Función para manejar clicks
  const handleItemClick = (item: typeof floatingMenuItems[0]) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Sidebar principal */}
      <div 
        className={`fixed left-6 top-1/2 -translate-y-1/2 z-50 transition-all duration-500 ease-in-out ${
          isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : '-translate-x-20 opacity-0 scale-95'
        }`}
      >
        <div 
          className="backdrop-blur-sm rounded-full shadow-xl border border-border/20 p-3 w-20"
          style={{ backgroundColor: '#8b35e9' }}
        >
          <div className="flex flex-col items-center space-y-4">
            {floatingMenuItems.map((item, index) => (
              <div key={item.id}>
                {item.id === "separator" ? (
                  <div className="w-8 h-px bg-white/30 my-2" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 text-white",
                      isItemActive(item.path)
                        ? "bg-white/20 text-white shadow-md" 
                        : "hover:bg-white/10 text-white hover:text-white"
                    )}
                    onClick={() => handleItemClick(item)}
                  >
                    {item.icon}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botón toggle - siempre visible */}
      <div className="fixed left-2 top-1/2 -translate-y-1/2 z-50">
        <Button
          onClick={toggleVisibility}
          size="icon"
          className={`w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 ${
            isVisible 
              ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20' 
              : 'bg-primary hover:bg-primary/90 text-white shadow-lg'
          }`}
          style={{ 
            backgroundColor: isVisible ? 'rgba(139, 53, 233, 0.3)' : '#8b35e9'
          }}
        >
          {isVisible ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>
    </>
  );
};