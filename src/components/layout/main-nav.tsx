
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  routes: {
    path: string;
    icon: React.ReactNode;
    label: string;
  }[];
}

export function MainNav({ className, routes, ...props }: MainNavProps) {
  const location = useLocation();
  
  return (
    <nav className={cn("flex flex-col space-y-1", className)} {...props}>
      {routes.map((route) => {
        const isActive = location.pathname.includes(`/app${route.path}`);
        
        return (
          <Link
            key={route.path}
            to={`/app${route.path}`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive 
                ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20",
              "justify-start"
            )}
          >
            {route.icon}
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
