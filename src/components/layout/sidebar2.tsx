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

// Floating menu items con submenús agrupados
const floatingMenuItems = [
  { 
    id: "dashboard", 
    icon: <Home size={20} />, 
    path: "/app/home",
    label: "Dashboard",
    isActive: false,
    items: []
  },
  { 
    id: "patients", 
    icon: <Users size={20} />, 
    path: "",
    label: "Pacientes",
    isActive: false,
    items: [
      { id: "patient-list", icon: <Users size={18} />, path: "/app/pacientes", label: "Lista de Pacientes" },
      { id: "new-patient", icon: <Plus size={18} />, path: "/app/pacientes/nueva-consulta", label: "Nuevo Paciente" },
      { id: "patient-dashboard", icon: <Database size={18} />, path: "/app/pacientes/dashboard", label: "Dashboard Pacientes" },
    ]
  },
  { 
    id: "appointments", 
    icon: <Calendar size={20} />, 
    path: "",
    label: "Citas Médicas",
    isActive: false,
    items: [
      { id: "calendar", icon: <Calendar size={18} />, path: "/app/citas", label: "Agenda" },
      { id: "new-appointment", icon: <Plus size={18} />, path: "/app/citas/nueva", label: "Nueva Cita" },
      { id: "shifts", icon: <Calendar size={18} />, path: "/app/turnos", label: "Turnos" },
    ]
  },
  { 
    id: "communication", 
    icon: <MessageSquare size={20} />, 
    path: "",
    label: "Comunicación",
    isActive: false,
    items: [
      { id: "chat", icon: <MessageSquare size={18} />, path: "/app/chat", label: "Chat Médico" },
      { id: "telemedicine", icon: <FileText size={18} />, path: "/app/telemedicina", label: "Telemedicina" },
      { id: "notifications", icon: <FileText size={18} />, path: "/app/notificaciones/centro", label: "Notificaciones" },
    ]
  },
  { 
    id: "clinical", 
    icon: <ClipboardList size={20} />, 
    path: "",
    label: "Gestión Clínica",
    isActive: false,
    items: [
      { id: "clinical-history", icon: <ClipboardList size={18} />, path: "/app/crear", label: "Historias Clínicas" },
      { id: "admissions", icon: <PlusSquare size={18} />, path: "/app/admisiones", label: "Admisiones" },
      { id: "user-portal", icon: <FileText size={18} />, path: "/app/portal-usuario", label: "Portal Usuario" },
    ]
  },
  { 
    id: "admin", 
    icon: <Stethoscope size={20} />, 
    path: "",
    label: "Personal & Admin",
    isActive: false,
    items: [
      { id: "doctors", icon: <Stethoscope size={18} />, path: "/app/medicos", label: "Médicos" },
      { id: "inventory", icon: <Database size={18} />, path: "/app/inventario/articulos", label: "Inventario" },
      { id: "offices", icon: <FileText size={18} />, path: "/app/locations/sites", label: "Consultorios" },
    ]
  },
  // Separador visual
  { 
    id: "separator", 
    icon: null, 
    path: "",
    label: "",
    isActive: false,
    items: []
  },
  { 
    id: "billing", 
    icon: <CreditCard size={20} />, 
    path: "",
    label: "Facturación",
    isActive: false,
    items: [
      { id: "billing-dashboard", icon: <CreditCard size={18} />, path: "/app/facturacion", label: "Dashboard" },
      { id: "new-invoice", icon: <Plus size={18} />, path: "/app/facturacion/nueva", label: "Nueva Factura" },
      { id: "reports", icon: <FileText size={18} />, path: "/app/informes", label: "Reportes" },
    ]
  },
  { 
    id: "settings", 
    icon: <Cog size={20} />, 
    path: "/app/configuracion",
    label: "Configuración",
    isActive: false,
    items: []
  },
];

export const Sidebar2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isVisible, setIsVisible] = useState(true);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Función para determinar si un item está activo
  const isItemActive = (path: string) => {
    if (path === "/app/home") {
      return currentPath === path || currentPath === "/app";
    }
    return currentPath.startsWith(path) && path !== "";
  };

  // Función para verificar si un grupo tiene un item activo
  const hasActiveSubItem = (items: any[]) => {
    return items.some(item => isItemActive(item.path));
  };

  // Función para manejar clicks
  const handleItemClick = (item: any) => {
    if (item.items && item.items.length > 0) {
      // Si tiene subitems, toggle submenu
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else if (item.path) {
      // Si no tiene subitems, navegar directamente
      navigate(item.path);
      setActiveSubmenu(null);
    }
  };

  // Función para manejar clicks en subitems
  const handleSubItemClick = (path: string) => {
    navigate(path);
    setActiveSubmenu(null);
  };

  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    setActiveSubmenu(null);
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
          className="backdrop-blur-md rounded-full shadow-2xl border border-white/20 p-3 w-20 glassmorphism-sidebar"
          style={{ 
            background: 'linear-gradient(135deg, rgba(139, 53, 233, 0.15), rgba(139, 53, 233, 0.25))',
            backdropFilter: 'blur(20px)',
            borderRadius: '50px'
          }}
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
                      (isItemActive(item.path) || hasActiveSubItem(item.items || []) || activeSubmenu === item.id)
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

      {/* Submenu flotante */}
      {activeSubmenu && isVisible && (
        <div className="fixed left-28 top-1/2 -translate-y-1/2 z-40">
          <div 
            className="backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-4 w-56 animate-slide-in-right glassmorphism-submenu"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 53, 233, 0.15), rgba(139, 53, 233, 0.25))',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="space-y-2">
              {floatingMenuItems
                .find(item => item.id === activeSubmenu)
                ?.items?.map((subItem: any) => (
                <Button
                  key={subItem.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-10 rounded-xl transition-all duration-200 text-white",
                    isItemActive(subItem.path)
                      ? "bg-white/20 text-white shadow-sm" 
                      : "hover:bg-white/10 text-white hover:text-white"
                  )}
                  onClick={() => handleSubItemClick(subItem.path)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      {subItem.icon}
                    </div>
                    <span className="text-sm font-medium truncate">{subItem.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            backgroundColor: isVisible ? 'rgba(139, 53, 233, 0.2)' : '#8b35e9',
            backdropFilter: 'blur(10px)'
          }}
        >
          {isVisible ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>
    </>
  );
};