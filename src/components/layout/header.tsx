
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FileText, Menu, Moon, Sun, Home, Users, BarChart, Settings as SettingsIcon } from "lucide-react";
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

  const isPatientRoute = location.pathname.startsWith('/pacientes');

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-background/80 backdrop-blur-md z-10">
      <div className="container mx-auto flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-form-primary" />
            <span className="text-xl font-semibold">Smart Forms</span>
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
              <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg animate-slide-down">
                <div className="p-4 space-y-3">
                  <Button 
                    variant="ghost"
                    onClick={goHome} 
                    className="w-full justify-start"
                  >
                    <Home size={16} className="mr-2" />
                    Inicio
                  </Button>
                  
                  <Link to="/pacientes" className="w-full block">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Users size={16} className="mr-2" />
                      Pacientes
                    </Button>
                  </Link>
                  
                  {isPatientRoute && (
                    <Link to="/pacientes/dashboard" className="w-full block">
                      <Button 
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <BarChart size={16} className="mr-2" />
                        Estadísticas
                      </Button>
                    </Link>
                  )}
                  
                  <Link to="/configuracion" className="w-full block">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <SettingsIcon size={16} className="mr-2" />
                      Configuración
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    onClick={toggleTheme}
                    className="w-full justify-start"
                  >
                    {theme === "light" ? (
                      <>
                        <Moon size={16} className="mr-2" />
                        Modo oscuro
                      </>
                    ) : (
                      <>
                        <Sun size={16} className="mr-2" />
                        Modo claro
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
              className="p-2 flex items-center gap-2"
            >
              <Home size={18} />
              Inicio
            </Button>
            
            <Link to="/pacientes">
              <Button 
                variant="ghost"
                className="p-2 flex items-center gap-2"
              >
                <Users size={18} />
                Pacientes
              </Button>
            </Link>
            
            {isPatientRoute && (
              <Link to="/pacientes/dashboard">
                <Button 
                  variant="ghost"
                  className="p-2 flex items-center gap-2"
                >
                  <BarChart size={18} />
                  Estadísticas
                </Button>
              </Link>
            )}
            
            <Link to="/configuracion">
              <Button 
                variant="ghost"
                className="p-2 flex items-center gap-2"
                size="icon"
              >
                <SettingsIcon size={18} />
              </Button>
            </Link>
            
            <Button 
              variant="ghost"
              onClick={toggleTheme}
              className="p-2"
              size="icon"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
