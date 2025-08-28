
import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { NavItem } from "./nav-item";
import { EnhancedNavMenu } from "./enhanced-nav-menu";
import { mainNavItems } from "@/config/navigation";

type DesktopMenuProps = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  goHome: () => void;
};

export const DesktopMenu = ({ theme, toggleTheme, goHome }: DesktopMenuProps) => {
  return (
    <div className="flex items-center space-x-4">
      {mainNavItems.map((item, index) => {
        if (index === 0) { // Home button with onClick instead of Link
          return (
            <Button 
              key={item.title}
              variant="ghost"
              onClick={goHome}
              className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
            >
              <item.icon size={18} className="group-hover:text-form-primary" />
              <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {item.title}
              </span>
            </Button>
          );
        }
        
        return item.items ? (
          <EnhancedNavMenu key={item.title} item={item} />
        ) : (
          <NavItem key={item.title} item={item} />
        );
      })}
      
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
    </div>
  );
};
