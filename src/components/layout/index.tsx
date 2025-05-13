
import React from "react";
import { Header } from "./header";
import { TenantStatusBar } from "../tenant/TenantStatusBar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="pb-12">
        <div className="container mx-auto px-4 pt-4">
          <TenantStatusBar />
        </div>
        {children}
      </main>
    </div>
  );
};
