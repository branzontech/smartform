
import React from 'react';
import { cn } from "@/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function SidebarNav({ className, children, ...props }: SidebarNavProps) {
  return (
    <aside 
      className={cn(
        "flex border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950", 
        className
      )} 
      {...props}
    >
      {children}
    </aside>
  );
}
