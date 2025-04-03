
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Moon, Sun, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainNavItems } from "@/config/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppSidebarProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const AppSidebar = ({ theme, toggleTheme }: AppSidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'w-full' : ''}`}>
      <div className="flex flex-col h-full">
        {/* Header con logo */}
        <div className="px-4 py-3 border-b">
          <Link to="/app/home" className="flex items-center space-x-2">
            <Stethoscope className="h-6 w-6 text-form-primary" />
            <span className="text-xl font-semibold bg-gradient-to-r from-form-primary to-form-secondary bg-clip-text text-transparent">
              Smart Doctor
            </span>
          </Link>
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="space-y-2">
              {mainNavItems.map((item) => {
                // Para elementos con submenús
                if (item.items) {
                  return (
                    <div key={item.title} className="space-y-1">
                      <div className="px-3 py-2 text-sm font-medium flex items-center">
                        <item.icon className="mr-2" size={18} />
                        <span>{item.title}</span>
                      </div>
                      
                      <div className="pl-5 space-y-1">
                        {item.items.map((subItem) => (
                          <Link 
                            key={subItem.title} 
                            to={subItem.path}
                            className={`flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${location.pathname === subItem.path ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : ''}`}
                          >
                            <subItem.icon className="mr-2" size={16} />
                            <span>{subItem.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                // Para elementos sin submenús
                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${location.pathname === item.path ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : ''}`}
                  >
                    <item.icon className="mr-2" size={18} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Footer con botón de tema */}
        <div className="p-4 mt-auto border-t">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start p-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
          >
            {theme === "light" ? (
              <>
                <Moon size={18} className="mr-2 group-hover:text-form-primary" />
                <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  Modo oscuro
                </span>
              </>
            ) : (
              <>
                <Sun size={18} className="mr-2 group-hover:text-form-primary" />
                <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  Modo claro
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
