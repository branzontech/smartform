
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Stethoscope, Moon, Sun, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenu } from "./mobile-menu";
import { DesktopMenu } from "./desktop-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { mainNavItems } from "@/config/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface HeaderProps {
  showCreate?: boolean;
}

export const Header = ({ showCreate = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const goHome = () => {
    navigate('/app/home');
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

  return (
    <TooltipProvider>
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-gradient-to-r from-purple-50/90 via-white/90 to-purple-50/90 dark:from-gray-900/90 dark:via-gray-900/95 dark:to-purple-900/90 backdrop-blur-md z-10 shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/app/home" className="flex items-center space-x-2">
              <Stethoscope className="h-6 w-6 text-form-primary" />
              <span className="text-xl font-semibold bg-gradient-to-r from-form-primary to-form-secondary bg-clip-text text-transparent">Smart Doctor</span>
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <Button
              variant="outline"
              className="relative h-10 w-full max-w-sm justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:border-purple-200 dark:bg-gray-800/20 dark:border-gray-700/30"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4 opacity-50" />
              <span className="hidden lg:inline-flex">Buscar en la navegación...</span>
              <span className="inline-flex lg:hidden">Buscar...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded-full border bg-white/20 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Navigation Toggle Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group">
                  Navegación <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-[70vh] overflow-y-auto">
                <DropdownMenuGroup>
                  {mainNavItems.map((item) => (
                    item.items ? (
                      <DropdownMenu key={item.title}>
                        <DropdownMenuTrigger asChild className="w-full">
                          <DropdownMenuItem className="flex items-center justify-between cursor-default">
                            <div className="flex items-center gap-2">
                              {item.icon && <item.icon className="h-4 w-4" />}
                              <span>{item.title}</span>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                          </DropdownMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          {item.items.map((subItem) => (
                            <DropdownMenuItem key={subItem.title} asChild>
                              <Link to={subItem.path || "#"} className="flex items-center gap-2">
                                {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                <span>{subItem.title}</span>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <DropdownMenuItem key={item.title} asChild>
                        <Link to={item.path || "#"} className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span>{item.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle Button */}
            {isMobile ? (
              <Button 
                variant="ghost"
                onClick={toggleTheme}
                className="p-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
                size="icon"
              >
                {theme === "light" ? 
                  <Moon size={18} className="group-hover:text-form-primary" /> : 
                  <Sun size={18} className="group-hover:text-form-primary" />
                }
              </Button>
            ) : (
              <Button 
                variant="ghost"
                onClick={toggleTheme}
                className="p-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
                size="icon"
              >
                {theme === "light" ? 
                  <Moon size={18} className="group-hover:text-form-primary" /> : 
                  <Sun size={18} className="group-hover:text-form-primary" />
                }
              </Button>
            )}

            {/* Mobile menu button */}
            {isMobile && (
              <button 
                onClick={toggleMobileMenu}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white ml-2"
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          {/* Mobile menu */}
          {isMobile && mobileMenuOpen && (
            <MobileMenu 
              isOpen={mobileMenuOpen} 
              theme={theme} 
              toggleTheme={toggleTheme} 
              toggleMobileMenu={toggleMobileMenu} 
            />
          )}
        </div>
      </header>

      <CommandDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen}
        className="rounded-3xl"  // Add more rounded corners to the dialog
      >
        <CommandInput 
          placeholder="Buscar en toda la navegación..." 
          className="rounded-full border-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700"
        />
        <CommandList className="rounded-b-3xl">
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          {mainNavItems.map((section) => (
            section.items ? (
              <CommandGroup key={section.title} heading={section.title} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/20">
                {section.items.map((item) => (
                  <CommandItem
                    key={item.path}
                    value={`${section.title} ${item.title}`}
                    onSelect={() => handleSelect(item.path)}
                    className="rounded-xl hover:bg-purple-100 dark:hover:bg-purple-800/50 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                      <span className="text-gray-700 dark:text-gray-200">{item.title}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandGroup key={section.title}>
                <CommandItem
                  value={section.title}
                  onSelect={() => handleSelect(section.path)}
                  className="rounded-xl hover:bg-purple-100 dark:hover:bg-purple-800/50 cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    <span className="text-gray-700 dark:text-gray-200">{section.title}</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )
          ))}
        </CommandList>
      </CommandDialog>
    </TooltipProvider>
  );
};
