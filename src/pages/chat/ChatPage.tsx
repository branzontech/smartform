import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { DoctorsList } from "@/components/chat/DoctorsList";
import { ChatInterface } from "@/components/chat/ChatInterface";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  online: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
};

const mockDoctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. María González",
    specialty: "Cardiología",
    online: true,
    lastMessage: "Perfecto, nos vemos mañana a las 10am",
    lastMessageTime: new Date(Date.now() - 300000), // 5 min ago
    unreadCount: 2
  },
  {
    id: "2", 
    name: "Dr. Carlos Rodríguez",
    specialty: "Neurología",
    online: true,
    lastMessage: "¿Has tomado la medicación que te receté?",
    lastMessageTime: new Date(Date.now() - 1800000), // 30 min ago
  },
  {
    id: "3",
    name: "Dra. Ana Martínez",
    specialty: "Pediatría", 
    online: false,
    lastMessage: "Gracias por la consulta, que tengas buen día",
    lastMessageTime: new Date(Date.now() - 7200000), // 2 hours ago
  },
  {
    id: "4",
    name: "Dr. Luis Fernández",
    specialty: "Dermatología",
    online: true,
    lastMessage: "Te envío las indicaciones por este medio",
    lastMessageTime: new Date(Date.now() - 10800000), // 3 hours ago
    unreadCount: 1
  },
  {
    id: "5",
    name: "Dra. Isabel López",
    specialty: "Ginecología",
    online: false,
    lastMessage: "Los resultados están listos",
    lastMessageTime: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: "6",
    name: "Dr. Miguel Torres",
    specialty: "Traumatología",
    online: true,
    lastMessage: "¿Cómo va la recuperación?",
    lastMessageTime: new Date(Date.now() - 172800000), // 2 days ago
  }
];

const ChatPage = () => {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedDoctor(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chat Médico
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Comunícate directamente con tu equipo médico
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="flex h-full">
            {/* Mobile: Show either list or chat */}
            <div className={`md:hidden ${showMobileChat ? 'hidden' : 'block'} w-full`}>
              <DoctorsList
                doctors={mockDoctors}
                selectedDoctor={selectedDoctor}
                onSelectDoctor={handleSelectDoctor}
              />
            </div>

            <div className={`md:hidden ${showMobileChat ? 'block' : 'hidden'} w-full`}>
              <ChatInterface
                selectedDoctor={selectedDoctor}
                onBack={handleBackToList}
              />
            </div>

            {/* Desktop: Show both side by side */}
            <div className="hidden md:block">
              <DoctorsList
                doctors={mockDoctors}
                selectedDoctor={selectedDoctor}
                onSelectDoctor={handleSelectDoctor}
              />
            </div>

            <div className="hidden md:block flex-1">
              <ChatInterface
                selectedDoctor={selectedDoctor}
                onBack={handleBackToList}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;