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

  if (!item.items) return null;

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
            <Icon size={16} className="mr-2" />
            {item.title}
          </NavigationMenuTrigger>
          
          <NavigationMenuContent>
            <div className="w-[800px] p-8 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-8">
                {/* Primera columna */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Gestión Principal
                  </h4>
                  {item.items.slice(0, Math.ceil(item.items.length / 3)).map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        onClick={onClick}
                        className="group block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                            <SubIcon size={16} className="text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400">
                              {subItem.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getItemDescription(subItem.title)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Segunda columna */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Funciones Avanzadas
                  </h4>
                  {item.items.slice(Math.ceil(item.items.length / 3), Math.ceil(item.items.length * 2 / 3)).map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        onClick={onClick}
                        className="group block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <SubIcon size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {subItem.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getItemDescription(subItem.title)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Tercera columna */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Herramientas
                  </h4>
                  {item.items.slice(Math.ceil(item.items.length * 2 / 3)).map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        onClick={onClick}
                        className="group block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <SubIcon size={16} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-green-600 dark:group-hover:text-green-400">
                              {subItem.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getItemDescription(subItem.title)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
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