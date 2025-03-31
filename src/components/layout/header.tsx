
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FileText, Menu, Moon, Sun, Home, Users, BarChart, Settings as SettingsIcon, Calendar, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

interface HeaderProps {
  showCreate?: boolean;
}

export const Header = ({ showCreate = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
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
    navigate('/');
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-gradient-to-r from-purple-50/90 via-white/90 to-purple-50/90 dark:from-gray-900/90 dark:via-gray-900/95 dark:to-purple-900/90 backdrop-blur-md z-10 shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Stethoscope className="h-6 w-6 text-form-primary" />
            <span className="text-xl font-semibold bg-gradient-to-r from-form-primary to-form-secondary bg-clip-text text-transparent">Smart Doctor</span>
          </Link>
        </div>

        {isMobile ? (
          <>
            <button 
              onClick={toggleMobileMenu}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              <Menu size={24} />
            </button>
            
            {mobileMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 shadow-lg animate-slide-down backdrop-blur-sm">
                <div className="p-4 space-y-3">
                  <Button 
                    variant="ghost"
                    onClick={goHome} 
                    className="w-full justify-start hover:bg-violet-400/30 dark:hover:bg-violet-500/30 group"
                  >
                    <Home size={16} className="mr-2 group-hover:text-form-primary" />
                    <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Inicio</span>
                  </Button>
                  
                  <Link to="/pacientes" className="w-full block">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start hover:bg-violet-400/30 dark:hover:bg-violet-500/30 group"
                    >
                      <Users size={16} className="mr-2 group-hover:text-form-primary" />
                      <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Pacientes</span>
                    </Button>
                  </Link>
                  
                  <Link to="/citas" className="w-full block">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start hover:bg-violet-400/30 dark:hover:bg-violet-500/30 group"
                    >
                      <Calendar size={16} className="mr-2 group-hover:text-form-primary" />
                      <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Citas</span>
                    </Button>
                  </Link>
                  
                  <Link to="/pacientes/dashboard" className="w-full block">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start hover:bg-violet-400/30 dark:hover:bg-violet-500/30 group"
                    >
                      <BarChart size={16} className="mr-2 group-hover:text-form-primary" />
                      <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Estadísticas</span>
                    </Button>
                  </Link>
                  
                  <Link to="/configuracion" className="w-full block">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start hover:bg-violet-400/30 dark:hover:bg-violet-500/30 group"
                    >
                      <SettingsIcon size={16} className="mr-2 group-hover:text-form-primary" />
                      <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Configuración</span>
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    onClick={toggleTheme}
                    className="w-full justify-start hover:bg-violet-400/30 dark:hover:bg-violet-500/30 group"
                  >
                    {theme === "light" ? (
                      <>
                        <Moon size={16} className="mr-2 group-hover:text-form-primary" />
                        <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Modo oscuro</span>
                      </>
                    ) : (
                      <>
                        <Sun size={16} className="mr-2 group-hover:text-form-primary" />
                        <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Modo claro</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              onClick={goHome}
              className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
            >
              <Home size={18} className="group-hover:text-form-primary" />
              <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Inicio</span>
            </Button>
            
            <Link to="/pacientes">
              <Button 
                variant="ghost"
                className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
              >
                <Users size={18} className="group-hover:text-form-primary" />
                <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Pacientes</span>
              </Button>
            </Link>
            
            <Link to="/citas">
              <Button 
                variant="ghost"
                className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
              >
                <Calendar size={18} className="group-hover:text-form-primary" />
                <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Citas</span>
              </Button>
            </Link>
            
            <Link to="/pacientes/dashboard">
              <Button 
                variant="ghost"
                className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
              >
                <BarChart size={18} className="group-hover:text-form-primary" />
                <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Estadísticas</span>
              </Button>
            </Link>
            
            <Link to="/configuracion">
              <Button 
                variant="ghost"
                className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
              >
                <SettingsIcon size={18} className="group-hover:text-form-primary" />
                <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Configuración</span>
              </Button>
            </Link>
            
            <Button 
              variant="ghost"
              onClick={toggleTheme}
              className="p-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
              size="icon"
            >
              {theme === "light" ? <Moon size={18} className="group-hover:text-form-primary" /> : <Sun size={18} className="group-hover:text-form-primary" />}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
