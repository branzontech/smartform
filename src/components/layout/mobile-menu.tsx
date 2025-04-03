
import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { NavItem } from "./nav-item";
import { NavSubmenu } from "./nav-submenu";
import { mainNavItems } from "@/config/navigation";

type MobileMenuProps = {
  isOpen: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  toggleMobileMenu: () => void;
};

export const MobileMenu = ({ isOpen, theme, toggleTheme, toggleMobileMenu }: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 shadow-lg animate-slide-down backdrop-blur-sm">
      <div className="p-4 space-y-3">
        {mainNavItems.map((item) => (
          item.items ? (
            <NavSubmenu 
              key={item.title} 
              item={item} 
              isMobile={true}
              onClick={toggleMobileMenu}
            />
          ) : (
            <div key={item.title} className="w-full block">
              <NavItem item={item} onClick={toggleMobileMenu} />
            </div>
          )
        ))}
        
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
  );
};
