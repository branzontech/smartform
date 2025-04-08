
import React from "react";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { CustomerHeader } from "@/components/customers/CustomerHeader";
import { CustomerContact } from "@/components/customers/CustomerContact";
import { CustomerHistory } from "@/components/customers/CustomerHistory";
import { CustomerNotifications } from "@/components/customers/CustomerNotifications";
import { CustomerReminders } from "@/components/customers/CustomerReminders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { Customer } from "@/types/customer-types";

// Mock data for a single customer
const mockCustomer: Customer = {
  id: "1",
  name: "Ana García Martínez",
  email: "ana.garcia@example.com",
  phone: "+34 611 234 567",
  whatsapp: "+34 611 234 567",
  status: "Activo",
  frequency: "Frecuente",
  loyalty: "Alta",
  lastContact: new Date(2023, 3, 15),
  nextContactDate: new Date(2023, 5, 1),
  notes: "Cliente muy satisfecha con los servicios. Prefiere comunicación por WhatsApp.",
  createdAt: new Date(2020, 6, 10),
  updatedAt: new Date(2023, 3, 15),
  tags: ["VIP", "Fidelizado", "Referido"],
  appointmentCount: 24,
  totalSpent: 1850,
  lastAppointment: new Date(2023, 3, 12),
  birthday: new Date(1985, 7, 15),
  address: "Calle Principal 23, 28001 Madrid",
  profileImage: "https://i.pravatar.cc/150?img=45"
};

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const customer = mockCustomer; // In real app, fetch customer by id
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6">
        <BackButton />
        
        <CustomerHeader customer={customer} />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-4">
            <CustomerContact customer={customer} />
          </div>
          
          <div className="lg:col-span-8">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="history">Historial</TabsTrigger>
                <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
              </TabsList>
              
              <TabsContent value="history">
                <CustomerHistory customerId={customer.id} />
              </TabsContent>
              
              <TabsContent value="notifications">
                <CustomerNotifications customerId={customer.id} />
              </TabsContent>
              
              <TabsContent value="reminders">
                <CustomerReminders 
                  customerId={customer.id} 
                  customerName={customer.name} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDetail;
