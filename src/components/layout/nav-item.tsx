
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/config/navigation";

type NavItemProps = {
  item: MenuItem;
  onClick?: () => void;
};

export const NavItem = ({ item, onClick }: NavItemProps) => {
  const Icon = item.icon;

  return (
    <Link to={item.path} onClick={onClick}>
      <Button 
        variant="ghost"
        className="p-2 flex items-center gap-2 hover:bg-violet-400/20 dark:hover:bg-violet-500/30 group"
      >
        <Icon size={18} className="group-hover:text-form-primary" />
        <span className="group-hover:bg-gradient-to-r group-hover:from-form-primary group-hover:to-form-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {item.title}
        </span>
      </Button>
    </Link>
  );
};
