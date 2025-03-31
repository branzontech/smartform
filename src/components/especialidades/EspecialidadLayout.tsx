
import React, { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EspecialidadLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

export function EspecialidadLayout({ title, description, icon, children }: EspecialidadLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto p-6">
        <BackButton />
        
        <div className="mb-8 flex items-center gap-2">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
        
        {children}
      </main>
    </div>
  );
}
