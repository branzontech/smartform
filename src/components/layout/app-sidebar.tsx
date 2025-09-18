import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Stethoscope, UserCircle, LogOut, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mainNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const isActive = (path: string) => currentPath === path;
  
  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  };

  const user = {
    name: "Dr. Martínez",
    initials: "DM",
    email: "dr.martinez@smartdoctor.com"
  };

  const handleLogout = () => {
    console.log("Cerrando sesión...");
  };

  return (
    <Sidebar className="border-r border-sidebar-border text-white shadow-2xl" style={{ backgroundColor: '#5644e5' }}>
      <SidebarHeader className="p-4 border-b border-white/10">
        <div className={`flex items-center gap-3 transition-all duration-300 ${state === "collapsed" ? "justify-center" : ""}`}>
          <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Smart Doctor</span>
              <span className="text-xs text-white/70">Sistema Médico Inteligente</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => {
                const hasSubItems = item.items && item.items.length > 0;
                const isGroupOpen = openGroups.includes(item.title);
                const hasActiveSubItem = hasSubItems && item.items!.some(subItem => isActive(subItem.path));

                if (hasSubItems) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Collapsible open={isGroupOpen} onOpenChange={() => toggleGroup(item.title)}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            className={`w-full group hover:bg-white/10 transition-all duration-200 rounded-xl ${
                              hasActiveSubItem ? "bg-primary/20 text-white shadow-md border border-primary/30" : "text-white/90"
                            }`}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-shrink-0">
                                <item.icon className="h-5 w-5" />
                              </div>
                              {state !== "collapsed" && (
                                <>
                                  <span className="flex-1 text-left font-medium">{item.title}</span>
                                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`} />
                                </>
                              )}
                            </div>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {state !== "collapsed" && (
                          <CollapsibleContent className="ml-2">
                            <SidebarMenuSub className="mt-2 space-y-1">
                              {item.items!.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton 
                                    asChild
                                    className={`rounded-lg transition-all duration-200 ${
                                      isActive(subItem.path) 
                                        ? "bg-primary/30 text-white shadow-sm border border-primary/40" 
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                    }`}
                                  >
                                    <NavLink to={subItem.path} className="flex items-center gap-3 w-full">
                                      <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                      <span className="font-medium">{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      className={`group hover:bg-white/10 transition-all duration-200 rounded-xl ${
                        isActive(item.path) 
                          ? "bg-primary/20 text-white shadow-md border border-primary/30" 
                          : "text-white/90"
                      }`}
                    >
                      <NavLink to={item.path} className="flex items-center gap-3 w-full">
                        <div className="flex-shrink-0">
                          <item.icon className="h-5 w-5" />
                        </div>
                        {state !== "collapsed" && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 hover:bg-white/10 text-white transition-all duration-200 rounded-xl ${
                state === "collapsed" ? "px-2" : ""
              }`}
            >
              <Avatar className="h-8 w-8 bg-primary/20 border-2 border-primary/30">
                <AvatarFallback className="text-sm font-bold text-white bg-transparent">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              {state !== "collapsed" && (
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-white">{user.name}</span>
                  <span className="text-xs text-white/70">{user.email}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={state === "collapsed" ? "center" : "start"}
            side="right"
            className="w-56 bg-background/95 backdrop-blur-md border border-border shadow-lg"
          >
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <UserCircle className="h-4 w-4" />
              <span>Ver Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}