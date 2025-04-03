
import React from "react";
import { Link } from "react-router-dom";
import { SubmenuItem } from "@/config/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

type NavSubmenuProps = {
  item: SubmenuItem;
  isMobile?: boolean;
  onClick?: () => void;
};

export const NavSubmenu = ({ item, isMobile = false, onClick }: NavSubmenuProps) => {
  const Icon = item.icon;
  const navMenuItemClass = "p-2 block rounded hover:bg-violet-400/30 dark:hover:bg-violet-500/30 hover:text-form-primary";

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          {isMobile ? (
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-violet-400/30 dark:hover:bg-violet-500/30 group"
              asChild
            >
              <NavigationMenuTrigger>
                <Icon size={16} className="mr-2 group-hover:text-form-primary" />
                <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {item.title}
                </span>
              </NavigationMenuTrigger>
            </Button>
          ) : (
            <NavigationMenuTrigger className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group">
              <Icon size={18} className="group-hover:text-form-primary" />
              <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {item.title}
              </span>
            </NavigationMenuTrigger>
          )}
          
          <NavigationMenuContent className={`bg-white dark:bg-gray-900 ${isMobile ? "p-2" : ""}`}>
            <div className={isMobile ? "w-full min-w-[200px]" : "p-2 w-[220px]"}>
              {item.items?.map((subItem) => {
                const SubIcon = subItem.icon;
                return (
                  <Link 
                    key={subItem.path} 
                    to={subItem.path} 
                    className={navMenuItemClass}
                    onClick={onClick}
                  >
                    <div className="flex items-center">
                      <SubIcon size={16} className="mr-2" />
                      <span>{subItem.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

import { Button } from "@/components/ui/button";
