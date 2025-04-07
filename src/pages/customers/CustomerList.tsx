
import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerStats } from "@/components/customers/CustomerStats";
import { CustomerQuickActions } from "@/components/customers/CustomerQuickActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, BarChart } from "lucide-react";
import { Link } from "react-router-dom";

const CustomerList = () => {
  const [view, setView] = useState<"list" | "stats">("list");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Clientes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Administra, notifica y fideliza a tus clientes
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Link to="/app/clientes/nuevo">
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Nuevo Cliente
              </Button>
            </Link>
            <Link to="/app/clientes/notificaciones/nueva">
              <Button variant="outline" className="flex items-center gap-2">
                <Plus size={16} />
                Nueva Notificación
              </Button>
            </Link>
          </div>
        </div>

        <CustomerQuickActions />

        <Tabs defaultValue="list" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="list" onClick={() => setView("list")} className="flex items-center gap-2">
              <Users size={16} />
              Lista de Clientes
            </TabsTrigger>
            <TabsTrigger value="stats" onClick={() => setView("stats")} className="flex items-center gap-2">
              <BarChart size={16} />
              Estadísticas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-6">
            <CustomerFilters />
            <CustomerTable />
          </TabsContent>
          
          <TabsContent value="stats">
            <CustomerStats />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CustomerList;
