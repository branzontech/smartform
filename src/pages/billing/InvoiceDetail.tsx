
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { BackButton } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Printer, Send, Download, DollarSign, Copy, Clock } from "lucide-react";
import { mockInvoices } from "@/utils/billing-utils";
import { Invoice, InvoiceStatus } from "@/types/billing-types";
import { format } from "date-fns";

const getStatusColor = (status: InvoiceStatus) => {
  switch (status) {
    case "paid":
      return "bg-green-500 hover:bg-green-600";
    case "pending":
      return "bg-amber-500 hover:bg-amber-600";
    case "overdue":
      return "bg-red-500 hover:bg-red-600";
    case "cancelled":
      return "bg-gray-500 hover:bg-gray-600";
    default:
      return "bg-blue-500 hover:bg-blue-600";
  }
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  // En un caso real, esta información vendría de una API
  const invoice: Invoice | undefined = mockInvoices.find(
    (inv) => inv.id === id
  );

  if (!invoice) {
    return (
      <Layout>
        <div className="container py-8">
          <BackButton />
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Factura no encontrada</h2>
            <p className="text-gray-500 mt-2">
              La factura que buscas no existe o ha sido eliminada.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate("/app/facturacion")}
            >
              Volver a facturación
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handlePrintInvoice = () => {
    toast.success("Preparando impresión...");
    // Implementación real: window.print() o alguna biblioteca de impresión
  };

  const handleSendInvoice = () => {
    toast.success("Factura enviada al correo del paciente");
  };

  const handleDownloadInvoice = () => {
    toast.success("Descargando factura en PDF...");
  };

  const handleRegisterPayment = () => {
    setShowPaymentDialog(false);
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }
    
    toast.success(`Pago de $${amount.toFixed(2)} registrado correctamente`);
    setPaymentAmount("");
  };

  return (
    <Layout>
      <div className="container max-w-5xl py-6">
        <BackButton />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Factura #{invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              Emitida el {format(new Date(invoice.issueDate), "dd/MM/yyyy")}
            </p>
          </div>
          
          <Badge className={`${getStatusColor(invoice.status)} text-white px-3 py-1.5`}>
            {invoice.status === "paid" && "Pagada"}
            {invoice.status === "pending" && "Pendiente"}
            {invoice.status === "overdue" && "Vencida"}
            {invoice.status === "cancelled" && "Cancelada"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Paciente</h3>
              <p className="font-medium">{invoice.patientName}</p>
              <p className="text-sm">ID: {invoice.patientId}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Médico</h3>
              <p className="font-medium">{invoice.doctorName || "No asignado"}</p>
              {invoice.doctorId && <p className="text-sm">ID: {invoice.doctorId}</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Fechas</h3>
              <div className="flex justify-between text-sm">
                <span>Emitida:</span>
                <span>{format(new Date(invoice.issueDate), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Vencimiento:</span>
                <span className={invoice.status === "overdue" ? "text-red-500 font-medium" : ""}>
                  {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Detalles</h2>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio unitario</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          {item.serviceCode && (
                            <p className="text-xs text-muted-foreground">Código: {item.serviceCode}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                    <TableCell className="text-right">${invoice.subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">IVA (16%)</TableCell>
                    <TableCell className="text-right">${invoice.tax.toFixed(2)}</TableCell>
                  </TableRow>
                  {invoice.discount && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">Descuento</TableCell>
                      <TableCell className="text-right">-${invoice.discount.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold text-lg">${invoice.total.toFixed(2)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

        {invoice.notes && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Notas</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handlePrintInvoice}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleSendInvoice}>
              <Send className="mr-2 h-4 w-4" />
              Enviar
            </Button>
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            <Button variant="outline" onClick={() => navigate(`/app/facturacion/editar/${id}`)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </Button>
          </div>
          
          {["pending", "overdue"].includes(invoice.status) && (
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowPaymentDialog(true)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Registrar pago
            </Button>
          )}
          
          {invoice.status === "paid" && (
            <div className="flex items-center text-green-600 font-medium">
              <span className="mr-2">Pagada:</span>
              <span>${invoice.paidAmount?.toFixed(2) || invoice.total.toFixed(2)}</span>
              {invoice.paidDate && (
                <span className="ml-2 text-sm text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {format(new Date(invoice.paidDate), "dd/MM/yyyy")}
                </span>
              )}
            </div>
          )}
        </div>
        
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar pago</DialogTitle>
              <DialogDescription>
                Ingresa el monto recibido para la factura #{invoice.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-8"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Total de la factura:</span>
                <span className="font-medium">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegisterPayment}>
                Registrar pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default InvoiceDetail;
