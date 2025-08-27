import React from "react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { NotificationCenter as NotificationCenterComponent } from "@/components/notifications/NotificationCenter";

const NotificationCenterPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto p-6">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Centro de Notificaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona los recordatorios de seguimiento médico y mantente al día con tus pacientes
          </p>
        </div>
        
        <NotificationCenterComponent />
      </main>
    </div>
  );
};

export default NotificationCenterPage;