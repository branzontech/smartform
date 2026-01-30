
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { TenantStatusBar } from "../tenant/TenantStatusBar";
import { FloatingChatButton } from "./floating-chat-button";
import { Button } from "@/components/ui/button";
import { Stethoscope, Search, Bell, Moon, Sun, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./page-transition";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { mainNavItems } from "@/config/navigation";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = {
    name: "Dr. Martínez",
    initials: "DM",
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const getAllNavigationItems = () => {
    const items: Array<{ title: string; path: string; icon: React.ElementType; group?: string }> = [];
    
    mainNavItems.forEach((item) => {
      if (item.items) {
        item.items.forEach((subItem) => {
          items.push({
            ...subItem,
            group: item.title
          });
        });
      } else {
        items.push(item);
      }
    });
    
    return items;
  };

  const handleSelect = (path: string) => {
    setSearchOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    // navigate("/login");
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 pt-20 px-6">
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-4">
              <TenantStatusBar />
            </div>
            {(() => {
              console.log(`[Layout] Renderizando contenido para ruta: ${location.pathname}`);
              console.log(`[Layout] Timestamp: ${new Date().toISOString()}`);
              return null;
            })()}
            <AnimatePresence 
              mode="wait"
              onExitComplete={() => {
                console.log(`[Layout] AnimatePresence: Exit animation completada`);
              }}
            >
              <PageTransition key={location.pathname}>
                {children}
              </PageTransition>
            </AnimatePresence>
          </main>

        <FloatingChatButton />
        </div>
      </div>

      {/* Search Dialog */}
      <CommandDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen}
      >
        <CommandInput 
          placeholder="Buscar en toda la navegación..." 
          className="border-none focus:ring-2 focus:ring-primary/20"
        />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          {mainNavItems.map((section) => (
            section.items ? (
              <CommandGroup key={section.title} heading={section.title}>
                {section.items.map((item) => (
                  <CommandItem
                    key={item.path}
                    value={`${section.title} ${item.title}`}
                    onSelect={() => handleSelect(item.path)}
                    className="cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span>{item.title}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandGroup key={section.title}>
                <CommandItem
                  value={section.title}
                  onSelect={() => handleSelect(section.path)}
                  className="cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="h-4 w-4 text-primary" />
                    <span>{section.title}</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )
          ))}
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
};
