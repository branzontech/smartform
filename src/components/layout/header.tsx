
import { Link, useNavigate } from "react-router-dom";
import { Menu, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenu } from "./mobile-menu";
import { DesktopMenu } from "./desktop-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

interface HeaderProps {
  showCreate?: boolean;
}

export const Header = ({ showCreate = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
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
    navigate('/app/home');
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

          {isMobile ? (
            <>
              <button 
                onClick={toggleMobileMenu}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                <Menu size={24} />
              </button>
              
              <MobileMenu 
                isOpen={mobileMenuOpen} 
                theme={theme} 
                toggleTheme={toggleTheme} 
                toggleMobileMenu={toggleMobileMenu} 
              />
            </>
          ) : (
            <DesktopMenu 
              theme={theme} 
              toggleTheme={toggleTheme} 
              goHome={goHome} 
            />
          )}
        </div>
      </header>
    </TooltipProvider>
  );
};
