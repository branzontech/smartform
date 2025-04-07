
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, FileText, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Invoice } from "@/types/billing-types";
import { mockInvoices } from "@/utils/billing-utils";

interface PendingPaymentsProps {
  limit?: number;
  compact?: boolean;
}

const PendingPayments = ({ limit, compact = false }: PendingPaymentsProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = limit || 10;
  
  // Filtrar facturas pendientes y vencidas
  const pendingInvoices = mockInvoices
    .filter(invoice => 
      (invoice.status === "pending" || invoice.status === "overdue") &&
      (invoice.patientName.toLowerCase().includes(search.toLowerCase()) ||
       invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      // Ordenar primero por vencidas, luego por fecha de vencimiento
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  
  // Paginación
  const totalPages = Math.ceil(pendingInvoices.length / itemsPerPage);
  const paginatedInvoices = pendingInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date();
  };

  const handleViewInvoice = (id: string) => {
    navigate(`/app/facturacion/${id}`);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {paginatedInvoices.map((invoice) => (
          <div 
            key={invoice.id}
            className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => handleViewInvoice(invoice.id)}
          >
            <div className="flex items-center gap-3">
              {invoice.status === "overdue" ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <FileText className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">{invoice.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">{invoice.patientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">${invoice.total.toFixed(2)}</p>
              <Badge className={invoice.status === "overdue" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}>
                {invoice.status === "overdue" ? "Vencida" : "Pendiente"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Pagos pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar pagos pendientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Factura</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Fecha emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell>{format(new Date(invoice.issueDate), "dd/MM/yyyy")}</TableCell>
                    <TableCell className={invoice.status === "overdue" ? "text-red-500 font-medium" : ""}>
                      {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">${invoice.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={invoice.status === "overdue" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}>
                        {invoice.status === "overdue" ? "Vencida" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="flex items-center gap-1"
                      >
                        <DollarSign className="h-4 w-4" />
                        Pagar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay pagos pendientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingPayments;
