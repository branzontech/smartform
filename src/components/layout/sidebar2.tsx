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
  Trash2
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

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <div className="bg-card/95 backdrop-blur-sm rounded-full shadow-xl border border-border/20 p-3 w-20">
        <div className="flex flex-col items-center space-y-4">
          {floatingMenuItems.map((item, index) => (
            <div key={item.id}>
              {item.id === "separator" ? (
                <div className="w-8 h-px bg-border my-2" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-12 h-12 rounded-full transition-all duration-200 hover:scale-110",
                    isItemActive(item.path)
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
  );
};