
import React from 'react';
import { cn } from "@/lib/utils";
import { Stethoscope } from "lucide-react";

interface SiteHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SiteHeader({ className, ...props }: SiteHeaderProps) {
  return (
    <header className={cn("flex items-center p-4", className)} {...props}>
      <div className="flex items-center space-x-2">
        <Stethoscope className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        <span className="font-semibold text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Smart Doctor
        </span>
      </div>
    </header>
  );
}
