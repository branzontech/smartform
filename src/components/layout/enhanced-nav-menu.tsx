import React from "react";
import { Link } from "react-router-dom";
import { SubmenuItem } from "@/config/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

type EnhancedNavMenuProps = {
  item: SubmenuItem;
  onClick?: () => void;
};

const menuGroups = {
  "Gestión de Turnos": "Gestión de Tiempo",
  "Facturación": "Gestión Financiera", 
  "Informes": "Análisis y Reportes",
  "Inventario": "Gestión de Recursos",
  "Consultorios": "Instalaciones",
  "Comunicación": "Comunicación",
  "Recursos": "Recursos y Contenido",
  "Personal": "Recursos Humanos"
};

export const EnhancedNavMenu = ({ item, onClick }: EnhancedNavMenuProps) => {
  const Icon = item.icon;
  const groupTitle = menuGroups[item.title as keyof typeof menuGroups] || item.title;

  if (!item.items) return null;

  // Group items into columns (max 3 columns)
  const itemsPerColumn = Math.ceil(item.items.length / 3);
  const columns = [];
  for (let i = 0; i < item.items.length; i += itemsPerColumn) {
    columns.push(item.items.slice(i, i + itemsPerColumn));
  }

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
            <div className="flex items-center gap-2">
              <Icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </span>
            </div>
          </NavigationMenuTrigger>
          
          <NavigationMenuContent className="p-0 border-0 shadow-2xl">
            <div className="glassmorphism rounded-xl border border-border/20 shadow-xl backdrop-blur-xl bg-background/80 min-w-[640px] max-w-4xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{groupTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.items.length} opciones disponibles
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-6">
                <div className={`grid gap-6 ${columns.length === 1 ? 'grid-cols-1' : columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {columns.map((columnItems, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {columnItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={onClick}
                            className="group block p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 border border-transparent hover:border-border/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                                <SubIcon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                  {subItem.title}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {getItemDescription(subItem.title)}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

function getItemDescription(title: string): string {
  const descriptions: Record<string, string> = {
    "Asignar Turnos": "Gestiona y asigna turnos",
    "Consultar Turnos": "Ver turnos programados",
    "Modificar Turnos": "Editar turnos existentes",
    "Dashboard": "Panel de control",
    "Facturas": "Gestión de facturas",
    "Pagos Pendientes": "Pagos por cobrar",
    "Reportes": "Informes financieros",
    "Generar Factura": "Crear nueva factura",
    "Crear Informe": "Nuevo informe",
    "Informes Guardados": "Informes existentes",
    "Plantillas": "Plantillas de informes",
    "Artículos": "Gestión de inventario",
    "Nuevo Artículo": "Agregar artículo",
    "Buscar": "Buscar en inventario",
    "Sedes": "Gestión de sedes",
    "Consultorios": "Gestión de consultorios",
    "Mapa de Instalaciones": "Vista de ubicaciones",
    "Mensajes": "Comunicación interna",
    "Notificaciones": "Alertas del sistema",
    "Foros": "Discusiones grupales",
    "Videos": "Contenido audiovisual",
    "Enlaces": "Enlaces útiles",
    "Médicos": "Personal médico",
    "Enfermeros": "Personal de enfermería",
    "Administrativos": "Personal administrativo"
  };
  
  return descriptions[title] || "Acceder a funcionalidad";
}