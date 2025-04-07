import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart,
  Pie,
  Cell, 
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  TooltipProps
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  UserPlus, 
  MessageCircle,
  Calendar
} from "lucide-react";
import { CustomerStats as CustomerStatsType } from "@/types/customer-types";

// Mock data for the charts
const customersByStatus = [
  { name: "Activos", value: 156 },
  { name: "Inactivos", value: 48 },
  { name: "Potenciales", value: 32 },
  { name: "Leads", value: 24 },
];

const customersByFrequency = [
  { name: "Frecuentes", value: 92 },
  { name: "Regulares", value: 64 },
  { name: "Esporádicos", value: 48 },
  { name: "Nuevos", value: 56 },
];

// This data now matches our updated type in the interface
const customersByMonth = [
  { month: "Ene", nuevos: 12, activos: 85 },
  { month: "Feb", nuevos: 18, activos: 90 },
  { month: "Mar", nuevos: 14, activos: 95 },
  { month: "Abr", nuevos: 22, activos: 105 },
  { month: "May", nuevos: 16, activos: 115 },
  { month: "Jun", nuevos: 20, activos: 125 },
  { month: "Jul", nuevos: 24, activos: 135 },
  { month: "Ago", nuevos: 18, activos: 145 },
  { month: "Sep", nuevos: 16, activos: 150 },
  { month: "Oct", nuevos: 22, activos: 155 },
  { month: "Nov", nuevos: 28, activos: 165 },
  { month: "Dic", nuevos: 32, activos: 175 },
];

const notificationStats = [
  { month: "Ene", enviadas: 45, abiertas: 38 },
  { month: "Feb", enviadas: 52, abiertas: 42 },
  { month: "Mar", enviadas: 48, abiertas: 40 },
  { month: "Abr", enviadas: 55, abiertas: 45 },
  { month: "May", enviadas: 60, abiertas: 48 },
  { month: "Jun", enviadas: 65, abiertas: 55 },
  { month: "Jul", enviadas: 70, abiertas: 58 },
  { month: "Ago", enviadas: 75, abiertas: 62 },
  { month: "Sep", enviadas: 80, abiertas: 65 },
  { month: "Oct", enviadas: 85, abiertas: 70 },
  { month: "Nov", enviadas: 90, abiertas: 75 },
  { month: "Dic", enviadas: 100, abiertas: 82 },
];

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#22c55e', '#f59e0b'];

// Mock data for the customer stats, matching our updated interface
const mockCustomerStats: CustomerStatsType = {
  totalCustomers: 260,
  activeCustomers: 156,
  newCustomersThisMonth: 24,
  customersByStatus,
  customersByFrequency,
  notificationsSent: 825,
  appointmentsBooked: 486,
  revenueGenerated: 28500,
  customerRetentionRate: 78,
  customersByMonth: customersByMonth,
};

export const CustomerStats = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{mockCustomerStats.totalCustomers}</div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                12%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs. 232 mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nuevos este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserPlus className="h-5 w-5 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{mockCustomerStats.newCustomersThisMonth}</div>
              </div>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                5%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs. 28 mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notificaciones enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{mockCustomerStats.notificationsSent}</div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                18%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tasa de apertura: 82%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Citas agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{mockCustomerStats.appointmentsBooked}</div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                8%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tasa de asistencia: 94%
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Evolución de Clientes</CardTitle>
            <CardDescription>
              Nuevos clientes y clientes activos por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={customersByMonth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="nuevos" 
                    name="Nuevos Clientes" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activos" 
                    name="Clientes Activos" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Estadísticas de Notificaciones</CardTitle>
            <CardDescription>
              Notificaciones enviadas y abiertas por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={notificationStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="enviadas" 
                    name="Notificaciones Enviadas" 
                    fill="#8b5cf6" 
                  />
                  <Bar 
                    dataKey="abiertas" 
                    name="Notificaciones Abiertas" 
                    fill="#06b6d4" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>
              Clientes según su estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {customersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribución por Frecuencia</CardTitle>
            <CardDescription>
              Clientes según su frecuencia de visita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customersByFrequency}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {customersByFrequency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
