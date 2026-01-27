import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Stethoscope, Moon, Sun, Search, Bell, UserCircle, LogOut } from "lucide-react";
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
  DropdownMenuSeparator,
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
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

interface HeaderProps {
  showCreate?: boolean;
}

export const Header = ({ showCreate = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Cita confirmada",
      message: "Su cita con el Dr. García ha sido confirmada para mañana a las 10:00 AM",
      time: "Hace 5 minutos",
      read: false,
      type: "appointment"
    },
    {
      id: 2,
      title: "Recordatorio de medicación",
      message: "Recuerde tomar su medicación a las 14:00 horas",
      time: "Hace 30 minutos",
      read: false,
      type: "medication"
    },
    {
      id: 3,
      title: "Resultado de laboratorio",
      message: "Sus resultados de laboratorio ya están disponibles",
      time: "Ayer",
      read: true,
      type: "lab"
    }
  ]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

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

  const [user] = useState({
    name: "Dr. Martínez",
    initials: "DM",
    unreadNotifications: unreadNotificationsCount
  });

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    // navigate("/login");
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
    toast({
      title: "Notificación marcada como leída",
      description: "La notificación ha sido marcada como leída",
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    toast({
      title: "Notificaciones",
      description: "Todas las notificaciones han sido marcadas como leídas",
    });
  };

  return (
    <TooltipProvider>
      {/* Background cover to hide scrolling content */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-background z-40" />
      
      <header className="fixed top-4 left-0 right-0 z-50 mx-4">
        <div 
          className="rounded-full shadow-xl border border-white/10"
          style={{ backgroundColor: 'rgba(139, 53, 233, 0.95)' }}
        >
          <div className="container mx-auto flex items-center justify-between h-16 px-8">
          <div className="flex items-center">
            <Link to="/app/home" className="flex items-center space-x-2">
              <Stethoscope className="h-6 w-6 text-white" />
              <span className="text-xl font-semibold text-white">Smart Doctor</span>
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <Button
              variant="outline"
              className="relative h-10 w-full max-w-sm justify-start text-sm text-white/80 sm:pr-12 md:w-40 lg:w-64 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:bg-white/20"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4 opacity-70" />
              <span className="hidden lg:inline-flex">Buscar en la navegación...</span>
              <span className="inline-flex lg:hidden">Buscar...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded-full border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/80 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2 flex items-center gap-2 hover:bg-white/10 text-white group rounded-full">
                  Menú <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 max-h-[70vh] overflow-y-auto bg-white/20 dark:bg-gray-900/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 shadow-lg" 
                align="end"
              >
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  className="p-2 hover:bg-white/10 text-white group relative rounded-full"
                  size="icon"
                >
                  <Bell size={18} className="group-hover:text-white" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Notificaciones</h3>
                  {unreadNotificationsCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleMarkAllAsRead} 
                      className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Marcar todas como leídas
                    </Button>
                  )}
                </div>
                <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 flex hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${notification.read ? '' : 'bg-purple-50/50 dark:bg-purple-900/20'}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">{notification.message}</p>
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleMarkAsRead(notification.id)} 
                              className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mt-2 px-0"
                            >
                              Marcar como leída
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No hay notificaciones
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 p-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-sm text-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Ver todas las notificaciones
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  className="p-1 hover:bg-white/10 text-white group flex items-center gap-2 rounded-full"
                >
                  <Avatar className="h-8 w-8 bg-white/20">
                    <AvatarFallback className="text-sm text-white">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium text-white">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span>Mi perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isMobile ? (
              <Button 
                variant="ghost"
                onClick={toggleTheme}
                className="p-2 hover:bg-white/10 text-white group rounded-full"
                size="icon"
              >
                {theme === "light" ? 
                  <Moon size={18} className="group-hover:text-white" /> : 
                  <Sun size={18} className="group-hover:text-white" />
                }
              </Button>
            ) : (
              <Button 
                variant="ghost"
                onClick={toggleTheme}
                className="p-2 hover:bg-white/10 text-white group rounded-full"
                size="icon"
              >
                {theme === "light" ? 
                  <Moon size={18} className="group-hover:text-white" /> : 
                  <Sun size={18} className="group-hover:text-white" />
                }
              </Button>
            )}

            {isMobile && (
              <button 
                onClick={toggleMobileMenu}
                className="p-2 text-white hover:text-white/80 ml-2 rounded-full hover:bg-white/10"
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          {isMobile && mobileMenuOpen && (
            <MobileMenu 
              isOpen={mobileMenuOpen} 
              theme={theme} 
              toggleTheme={toggleTheme} 
              toggleMobileMenu={toggleMobileMenu} 
            />
          )}
          </div>
        </div>
      </header>

      <CommandDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen}
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
