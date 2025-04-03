
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

interface AppSidebarProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const AppSidebar = ({ theme, toggleTheme }: AppSidebarProps) => {
  const location = useLocation();
  
  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/app/home" className="flex items-center space-x-2 px-4 py-2">
          <Stethoscope className="h-6 w-6 text-form-primary" />
          <span className="text-xl font-semibold bg-gradient-to-r from-form-primary to-form-secondary bg-clip-text text-transparent">
            Smart Doctor
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                // Skip the submenu items for now, we'll handle them separately
                if (item.items) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon className="mr-2" size={20} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            {/* Fixed: Removed the 'as' prop and wrapped Link around SidebarMenuSubButton */}
                            <Link to={subItem.path}>
                              <SidebarMenuSubButton
                                isActive={location.pathname === subItem.path}
                              >
                                <subItem.icon className="mr-2" size={18} />
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </Link>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  );
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.path}
                      tooltip={item.title}
                    >
                      <Link to={item.path}>
                        <item.icon className="mr-2" size={20} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
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
      </SidebarFooter>
    </Sidebar>
  );
};
