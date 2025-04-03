
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Stethoscope, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
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

          <div className="flex items-center space-x-4">
            {/* Navigation Toggle Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group">
                  Navegación <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuGroup>
                  {mainNavItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <Link to={item.path || "#"} className="flex items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </Link>
                    </DropdownMenuItem>
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

            {/* Mobile menu button (only for legacy support) */}
            {isMobile && (
              <button 
                onClick={toggleMobileMenu}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white ml-2"
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          {/* Only render the mobile menu if it's actually open */}
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
    </TooltipProvider>
  );
};
