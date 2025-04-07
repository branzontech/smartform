
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { mockInvoices } from "@/utils/billing-utils";
import { PaymentSummary } from "@/types/billing-types";

const BillingStats = () => {
  // Calcular estadísticas
  const calculateStats = (): PaymentSummary => {
    const totalPaid = mockInvoices
      .filter(invoice => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    const totalPending = mockInvoices
      .filter(invoice => invoice.status === "pending")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    const totalOverdue = mockInvoices
      .filter(invoice => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    const pendingCount = mockInvoices.filter(invoice => invoice.status === "pending").length;
    const paidCount = mockInvoices.filter(invoice => invoice.status === "paid").length;
    const overdueCount = mockInvoices.filter(invoice => invoice.status === "overdue").length;

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      pendingCount,
      paidCount,
      overdueCount
    };
  };

  const stats = calculateStats();
  const totalAmount = stats.totalPaid + stats.totalPending + stats.totalOverdue;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total facturado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">
              ${totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center gap-1 text-xs text-green-600">
            <ArrowUpRight className="h-3 w-3" />
            <span>+{(stats.paidCount + stats.pendingCount).toLocaleString()} facturas</span>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pagos recibidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500 h-6 w-6" />
            <div>
              <div className="text-3xl font-bold">
                ${stats.totalPaid.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center gap-1 text-xs text-green-600">
            <ArrowUpRight className="h-3 w-3" />
            <span>{stats.paidCount.toLocaleString()} facturas pagadas</span>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pagos pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="text-amber-500 h-6 w-6" />
            <div>
              <div className="text-3xl font-bold">
                ${stats.totalPending.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Clock className="h-3 w-3" />
            <span>{stats.pendingCount.toLocaleString()} facturas pendientes</span>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pagos vencidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500 h-6 w-6" />
            <div>
              <div className="text-3xl font-bold">
                ${stats.totalOverdue.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{stats.overdueCount.toLocaleString()} facturas vencidas</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BillingStats;
