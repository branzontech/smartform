
import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/App";
import InvoiceList from "@/components/billing/InvoiceList";
import PendingPayments from "@/components/billing/PendingPayments";
import BillingReports from "@/components/billing/BillingReports";
import BillingStats from "@/components/billing/BillingStats";
import InvoiceGenerator from "@/components/billing/InvoiceGenerator";
import { CreditCard, FileText, Clock, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BillingDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container max-w-7xl py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <BackButton />
            <h1 className="text-3xl font-bold">Facturación</h1>
            <p className="text-muted-foreground">
              Gestiona facturas, pagos y reportes financieros
            </p>
          </div>
          <Button 
            onClick={() => navigate("/app/facturacion/nueva")}
            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus size={16} />
            Nueva factura
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 md:grid-cols-5 gap-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <CreditCard size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText size={16} />
              <span className="hidden sm:inline">Facturas</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock size={16} />
              <span className="hidden sm:inline">Pendientes</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2 hidden md:flex">
              <Plus size={16} />
              <span className="hidden sm:inline">Generar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <BillingStats />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pagos pendientes recientes</CardTitle>
                  <CardDescription>Últimas facturas pendientes de cobro</CardDescription>
                </CardHeader>
                <CardContent>
                  <PendingPayments limit={5} compact />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Últimas facturas generadas</CardTitle>
                  <CardDescription>Facturas emitidas recientemente</CardDescription>
                </CardHeader>
                <CardContent>
                  <InvoiceList limit={5} compact />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <InvoiceList />
          </TabsContent>

          <TabsContent value="pending">
            <PendingPayments />
          </TabsContent>

          <TabsContent value="reports">
            <BillingReports />
          </TabsContent>

          <TabsContent value="generator">
            <InvoiceGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BillingDashboard;
