
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockInvoices } from "@/utils/billing-utils";
import { format, subMonths, isWithinInterval, startOfMonth } from "date-fns";

const BillingReports = () => {
  const [period, setPeriod] = useState("6");
  
  // Datos para los últimos 6/12 meses
  const generateMonthlyData = () => {
    const currentDate = new Date();
    const months = parseInt(period);
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(currentDate, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthInvoices = mockInvoices.filter(invoice => 
        isWithinInterval(new Date(invoice.issueDate), { start: monthStart, end: monthEnd })
      );
      
      const totalAmount = monthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      const paidAmount = monthInvoices
        .filter(invoice => invoice.status === "paid")
        .reduce((sum, invoice) => sum + invoice.total, 0);
      
      data.push({
        name: format(monthDate, "MMM yy"),
        total: totalAmount,
        pagado: paidAmount,
        pendiente: totalAmount - paidAmount
      });
    }
    
    return data;
  };
  
  // Datos para métodos de pago
  const generatePaymentMethodData = () => {
    const paymentMethods: Record<string, { count: number, amount: number, name: string }> = {
      credit_card: { count: 0, amount: 0, name: "Tarjeta de crédito" },
      bank_transfer: { count: 0, amount: 0, name: "Transferencia bancaria" },
      cash: { count: 0, amount: 0, name: "Efectivo" },
      insurance: { count: 0, amount: 0, name: "Seguro médico" }
    };
    
    mockInvoices
      .filter(invoice => invoice.status === "paid")
      .forEach(invoice => {
        const method = invoice.paymentMethod || "credit_card";
        if (paymentMethods[method]) {
          paymentMethods[method].count += 1;
          paymentMethods[method].amount += invoice.total;
        }
      });
    
    return Object.values(paymentMethods).filter(method => method.count > 0);
  };
  
  // Datos para distribución de estados
  const generateStatusData = () => {
    const statusCounts: Record<string, number> = {
      paid: 0,
      pending: 0,
      overdue: 0,
      cancelled: 0
    };
    
    mockInvoices.forEach(invoice => {
      statusCounts[invoice.status] += 1;
    });
    
    return [
      { name: "Pagadas", value: statusCounts.paid },
      { name: "Pendientes", value: statusCounts.pending },
      { name: "Vencidas", value: statusCounts.overdue },
      { name: "Canceladas", value: statusCounts.cancelled }
    ];
  };
  
  const revenueData = generateMonthlyData();
  const paymentMethodData = generatePaymentMethodData();
  const statusData = generateStatusData();
  
  const COLORS = ["#8b5cf6", "#f97316", "#16a34a", "#64748b"];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Reportes financieros</CardTitle>
            <CardDescription>Análisis de ingresos y estado de pagos</CardDescription>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Ingresos</TabsTrigger>
            <TabsTrigger value="payment-methods">Métodos de pago</TabsTrigger>
            <TabsTrigger value="status">Estado de facturas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, ""]}
                    labelFormatter={(value) => `Periodo: ${value}`}
                  />
                  <Legend />
                  <Bar dataKey="pagado" name="Pagado" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendiente" name="Pendiente" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total del periodo</p>
                    <p className="text-2xl font-bold">
                      ${revenueData.reduce((sum, item) => sum + item.total, 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pagado</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${revenueData.reduce((sum, item) => sum + item.pagado, 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pendiente</p>
                    <p className="text-2xl font-bold text-orange-500">
                      ${revenueData.reduce((sum, item) => sum + item.pendiente, 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment-methods">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="name"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip 
                          formatter={(value) => [`$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Desglose por método de pago</h3>
                  <div className="space-y-4">
                    {paymentMethodData.map((method, index) => (
                      <div key={method.name} className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span>{method.name}</span>
                        </div>
                        <div>
                          <div className="text-right font-medium">
                            ${method.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {method.count} transacciones
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="status">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Estado de facturas</h3>
                  <div className="space-y-4">
                    {statusData.map((status, index) => (
                      <div key={status.name} className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span>{status.name}</span>
                        </div>
                        <div>
                          <div className="text-right font-medium">
                            {status.value} facturas
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {((status.value / statusData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BillingReports;
