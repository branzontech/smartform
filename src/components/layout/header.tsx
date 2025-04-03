
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Stethoscope } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeaderProps {
  showCreate?: boolean;
}

export const Header = ({ showCreate = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex min-h-svh w-full">
          <AppSidebar theme={theme} toggleTheme={toggleTheme} />
          
          <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-gradient-to-r from-purple-50/90 via-white/90 to-purple-50/90 dark:from-gray-900/90 dark:via-gray-900/95 dark:to-purple-900/90 backdrop-blur-md z-10 shadow-sm w-full">
            <div className="container mx-auto flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                
                {isMobile && (
                  <Link to="/app/home" className="flex items-center space-x-2">
                    <Stethoscope className="h-6 w-6 text-form-primary" />
                    <span className="text-xl font-semibold bg-gradient-to-r from-form-primary to-form-secondary bg-clip-text text-transparent">
                      Smart Doctor
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </header>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};
