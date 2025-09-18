
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { TenantStatusBar } from "../tenant/TenantStatusBar";
import { FloatingChatButton } from "./floating-chat-button";
import { Button } from "@/components/ui/button";
import { Stethoscope, Search, Bell, Moon, Sun, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-foreground hover:bg-accent/80 transition-colors duration-200" />
                <Link to="/app/home" className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Smart Doctor
                  </span>
                </Link>
              </div>

              <div className="flex-1 flex items-center justify-center px-4">
                <Button
                  variant="outline"
                  className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 rounded-full bg-background/60 backdrop-blur-sm border-border/60 hover:border-border transition-all duration-200"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4 opacity-50" />
                  <span className="hidden lg:inline-flex">Buscar...</span>
                  <span className="inline-flex lg:hidden">Buscar...</span>
                  <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-accent/80 transition-colors duration-200"
                >
                  <Bell className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 hover:bg-accent/80 transition-colors duration-200"
                >
                  {theme === "light" ? 
                    <Moon className="h-4 w-4" /> : 
                    <Sun className="h-4 w-4" />
                  }
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost"
                      className="h-9 px-2 hover:bg-accent/80 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Avatar className="h-7 w-7 bg-primary/10">
                        <AvatarFallback className="text-xs text-primary font-medium">
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span>Mi perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      onClick={handleLogout}
                    >
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-4">
              <TenantStatusBar />
            </div>
            {children}
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
