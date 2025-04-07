
import React from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { CustomerHeader } from "@/components/customers/CustomerHeader";
import { CustomerContact } from "@/components/customers/CustomerContact";
import { CustomerHistory } from "@/components/customers/CustomerHistory";
import { CustomerNotifications } from "@/components/customers/CustomerNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MessageCircle, History, BadgeInfo } from "lucide-react";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // In a real app, you would fetch customer data here
  const customer = {
    id: id || "1",
    name: "Ana García Martínez",
    email: "ana.garcia@example.com",
    phone: "+34 612 345 678",
    whatsapp: "+34 612 345 678",
    status: "Activo" as const,
    frequency: "Frecuente" as const,
    loyalty: "Alta" as const,
    lastContact: new Date(2023, 2, 15),
    nextContactDate: new Date(2023, 4, 1),
    notes: "Cliente habitual desde 2020. Prefiere citas por la tarde.",
    createdAt: new Date(2020, 5, 10),
    appointmentCount: 24,
    totalSpent: 1850,
    lastAppointment: new Date(2023, 3, 20),
    birthday: new Date(1985, 8, 15),
    profileImage: "https://i.pravatar.cc/150?img=29",
    tags: ["VIP", "Tratamiento mensual", "Pago anticipado"]
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto p-6">
        <BackButton />
        
        <CustomerHeader customer={customer} />
        
        <Tabs defaultValue="info" className="mt-8">
          <TabsList className="mb-6">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <BadgeInfo size={16} />
              Información
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History size={16} />
              Historial
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <MessageCircle size={16} />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Clock size={16} />
              Citas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <CustomerContact customer={customer} />
          </TabsContent>
          
          <TabsContent value="history">
            <CustomerHistory customerId={customer.id} />
          </TabsContent>
          
          <TabsContent value="notifications">
            <CustomerNotifications customerId={customer.id} />
          </TabsContent>
          
          <TabsContent value="appointments">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Historial de Citas</h3>
              <p className="text-muted-foreground">Próximamente: historial de citas del cliente.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CustomerDetail;
