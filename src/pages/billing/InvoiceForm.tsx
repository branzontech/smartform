
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { BackButton } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FilePlus, Plus, Trash2, Save, X, Calendar as CalendarIcon, SkipForward } from "lucide-react";
import { mockInvoices } from "@/utils/billing-utils";
import { nanoid } from "nanoid";
import { InvoiceStatus, PaymentMethod } from "@/types/billing-types";

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  // Estado para el formulario
  const [invoice, setInvoice] = useState({
    invoiceNumber: "",
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días después
    status: "pending" as InvoiceStatus,
    total: 0,
    subtotal: 0,
    tax: 0,
    discount: 0,
    items: [{ id: nanoid(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
    notes: "",
    paymentMethod: "credit_card" as PaymentMethod
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (isEditing) {
      const foundInvoice = mockInvoices.find(inv => inv.id === id);
      if (foundInvoice) {
        // Ensure all required properties are set with default values if they're missing
        setInvoice({
          ...invoice,
          ...foundInvoice,
          doctorId: foundInvoice.doctorId || "",
          doctorName: foundInvoice.doctorName || "",
          issueDate: new Date(foundInvoice.issueDate),
          dueDate: new Date(foundInvoice.dueDate),
        });
      }
    }
  }, [id, isEditing]);

  // Calcular totales
  const calculateTotals = () => {
    const items = invoice.items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.16; // 16% de IVA
    const total = subtotal + tax - (invoice.discount || 0);
    
    setInvoice(prev => ({
      ...prev,
      items,
      subtotal,
      tax,
      total
    }));
  };

  // Actualizar totales cuando cambian los ítems o el descuento
  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.discount]);

  // Manejar cambios en los ítems
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...invoice.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === "quantity" || field === "unitPrice" ? Number(value) : value
    };
    
    setInvoice(prev => ({
      ...prev,
      items: newItems
    }));
  };

  // Agregar un nuevo ítem
  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: nanoid(), description: "", quantity: 1, unitPrice: 0, total: 0 }
      ]
    }));
  };

  // Eliminar un ítem
  const removeItem = (index: number) => {
    if (invoice.items.length === 1) {
      toast.error("Debe haber al menos un ítem en la factura");
      return;
    }
    
    const newItems = [...invoice.items];
    newItems.splice(index, 1);
    
    setInvoice(prev => ({
      ...prev,
      items: newItems
    }));
  };

  // Guardar la factura
  const handleSaveInvoice = () => {
    // Validaciones básicas
    if (!invoice.patientName || !invoice.invoiceNumber) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }
    
    if (invoice.items.some(item => !item.description || item.quantity <= 0)) {
      toast.error("Todos los ítems deben tener descripción y cantidad mayor a cero");
      return;
    }
    
    toast.success(`Factura ${isEditing ? "actualizada" : "creada"} correctamente`);
    navigate("/app/facturacion");
  };

  return (
    <Layout>
      <div className="container max-w-5xl py-6">
        <BackButton />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FilePlus className="h-8 w-8 text-primary" />
              {isEditing ? "Editar factura" : "Nueva factura"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing 
                ? `Modificando factura #${invoice.invoiceNumber}` 
                : "Complete los datos para generar una nueva factura"}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(true)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveInvoice}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información general</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Número de factura*</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoice.invoiceNumber}
                    onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})}
                    placeholder="FAC-0001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    value={invoice.status}
                    onValueChange={value => setInvoice({...invoice, status: value as InvoiceStatus})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="paid">Pagada</SelectItem>
                      <SelectItem value="overdue">Vencida</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de emisión</Label>
                  <div className="flex items-center">
                    <DatePicker
                      value={invoice.issueDate}
                      onChange={date => setInvoice({...invoice, issueDate: date || new Date()})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Fecha de vencimiento</Label>
                  <div className="flex items-center">
                    <DatePicker
                      value={invoice.dueDate}
                      onChange={date => setInvoice({...invoice, dueDate: date || new Date()})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patientName">Paciente*</Label>
                  <Input
                    id="patientName"
                    value={invoice.patientName}
                    onChange={e => setInvoice({...invoice, patientName: e.target.value})}
                    placeholder="Nombre del paciente"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patientId">ID Paciente</Label>
                  <Input
                    id="patientId"
                    value={invoice.patientId}
                    onChange={e => setInvoice({...invoice, patientId: e.target.value})}
                    placeholder="ID del paciente"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Médico</Label>
                  <Input
                    id="doctorName"
                    value={invoice.doctorName}
                    onChange={e => setInvoice({...invoice, doctorName: e.target.value})}
                    placeholder="Nombre del médico"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de pago</Label>
                  <Select 
                    value={invoice.paymentMethod}
                    onValueChange={value => setInvoice({...invoice, paymentMethod: value as PaymentMethod})}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                      <SelectItem value="bank_transfer">Transferencia bancaria</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="insurance">Seguro médico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles de la factura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio unitario</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              placeholder="Descripción del servicio"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                                className="pl-8 w-28"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ${item.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar ítem
                </Button>
                
                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal:</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">IVA (16%):</span>
                    <span>${invoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Descuento:</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={invoice.discount || ""}
                        onChange={(e) => setInvoice({...invoice, discount: Number(e.target.value)})}
                        className="pl-8 w-28"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-lg font-bold">
                    <span>Total:</span>
                    <span>${invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={invoice.notes}
                  onChange={(e) => setInvoice({...invoice, notes: e.target.value})}
                  placeholder="Información adicional, términos y condiciones, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(true)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveInvoice}>
              <Save className="mr-2 h-4 w-4" />
              Guardar factura
            </Button>
          </div>
        </div>
        
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate("/app/facturacion")}>
                Descartar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default InvoiceForm;
