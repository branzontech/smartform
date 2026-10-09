import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Save, X } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { SimpleTable, toolbarButtonClass, type SimpleColumn } from "@/components/kit/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatMoney } from "@/components/billing/invoices";
import { cn } from "@/lib/utils";
import { mockInvoices } from "@/utils/billing-utils";
import type { InvoiceStatus, PaymentMethod } from "@/types/billing-types";

/** Línea editable de la factura (antes de guardar). */
interface DraftItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const rightAligned = "text-right tabular-nums";

/**
 * Crear o editar una factura. Datos simulados: al editar se cargan de
 * mockInvoices y «Guardar» solo muestra el aviso (aún no persiste).
 */
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
        setInvoice(prev => ({
          ...prev,
          ...foundInvoice,
          doctorId: foundInvoice.doctorId || "",
          doctorName: foundInvoice.doctorName || "",
          issueDate: new Date(foundInvoice.issueDate),
          dueDate: new Date(foundInvoice.dueDate),
        }));
      }
    }
  }, [id, isEditing]);

  // Actualizar totales cuando cambian los ítems o el descuento
  useEffect(() => {
    setInvoice(prev => {
      const items = prev.items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice
      }));
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.16; // 16% de IVA
      const total = subtotal + tax - (prev.discount || 0);
      
      // Sin cambios: se devuelve el mismo estado para no volver a disparar el efecto
      const unchanged =
        subtotal === prev.subtotal &&
        tax === prev.tax &&
        total === prev.total &&
        items.every((item, i) => item.total === prev.items[i].total);
      if (unchanged) return prev;
      
      return {
        ...prev,
        items,
        subtotal,
        tax,
        total
      };
    });
  }, [invoice.items, invoice.discount]);

  // Manejar cambios en los ítems
  const handleItemChange = (index: number, field: "description" | "quantity" | "unitPrice", value: string) => {
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

  const itemColumns: SimpleColumn<DraftItem>[] = [
    {
      id: "description", title: "Descripción", primary: true,
      cell: (item, index) => (
        <Input
          aria-label={`Descripción del ítem ${index + 1}`}
          value={item.description}
          onChange={(e) => handleItemChange(index, "description", e.target.value)}
          placeholder="Descripción del servicio"
          className="h-8 text-[13px]"
        />
      ),
    },
    {
      id: "quantity", title: "Cantidad", className: "w-28",
      cell: (item, index) => (
        <Input
          aria-label={`Cantidad del ítem ${index + 1}`}
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
          className="h-8 text-right text-[13px] tabular-nums"
        />
      ),
    },
    {
      id: "unitPrice", title: "Precio unitario", className: "w-40",
      cell: (item, index) => (
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            aria-label={`Precio unitario del ítem ${index + 1}`}
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
            className="h-8 pl-6 text-right text-[13px] tabular-nums"
          />
        </div>
      ),
    },
    { id: "total", title: "Total", className: cn(rightAligned, "w-36 font-medium text-foreground"), cell: (item) => formatMoney(item.total) },
    {
      // Quitar una línea del borrador (no borra ningún registro guardado).
      id: "remove", title: <span className="sr-only">Quitar</span>, className: "w-px px-2 text-right",
      cell: (_item, index) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Quitar ítem ${index + 1}`}
          title="Quitar ítem"
          onClick={() => removeItem(index)}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const rowClass = "flex items-center justify-between gap-6";
  const totals = (
    <div className="ml-auto w-full max-w-xs space-y-1.5">
      <div className={rowClass}><span>Subtotal</span><span>{formatMoney(invoice.subtotal)}</span></div>
      <div className={rowClass}><span>IVA (16%)</span><span>{formatMoney(invoice.tax)}</span></div>
      <div className={rowClass}>
        <Label htmlFor="discount" className="text-[13px] font-normal">Descuento</Label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="discount"
            type="number"
            min="0"
            step="0.01"
            value={invoice.discount || ""}
            onChange={(e) => setInvoice({ ...invoice, discount: Number(e.target.value) })}
            className="h-8 w-32 pl-6 text-right text-[13px] tabular-nums"
          />
        </div>
      </div>
      <div className={cn(rowClass, "border-t border-border pt-1.5 text-base font-semibold text-foreground")}>
        <span>Total</span><span>{formatMoney(invoice.total)}</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader
        title={isEditing ? `Editar factura ${invoice.invoiceNumber}`.trim() : "Nueva factura"}
        secondary={[{ title: "Cancelar", icon: X, onClick: () => setIsConfirmDialogOpen(true) }]}
        primary={{ title: "Guardar", icon: Save, onClick: handleSaveInvoice }}
      />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de factura*</Label>
              <Input
                id="invoiceNumber"
                value={invoice.invoiceNumber}
                onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                placeholder="FAC-0001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={invoice.status} onValueChange={(value) => setInvoice({ ...invoice, status: value as InvoiceStatus })}>
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
              <DatePicker value={invoice.issueDate} onChange={(date) => setInvoice({ ...invoice, issueDate: date || new Date() })} />
            </div>

            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <DatePicker value={invoice.dueDate} onChange={(date) => setInvoice({ ...invoice, dueDate: date || new Date() })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientName">Paciente*</Label>
              <Input
                id="patientName"
                value={invoice.patientName}
                onChange={(e) => setInvoice({ ...invoice, patientName: e.target.value })}
                placeholder="Nombre del paciente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientId">ID del paciente</Label>
              <Input
                id="patientId"
                value={invoice.patientId}
                onChange={(e) => setInvoice({ ...invoice, patientId: e.target.value })}
                placeholder="ID del paciente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorName">Médico</Label>
              <Input
                id="doctorName"
                value={invoice.doctorName}
                onChange={(e) => setInvoice({ ...invoice, doctorName: e.target.value })}
                placeholder="Nombre del médico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de pago</Label>
              <Select value={invoice.paymentMethod} onValueChange={(value) => setInvoice({ ...invoice, paymentMethod: value as PaymentMethod })}>
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

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Ítems de la factura</h2>
        <SimpleTable
          columns={itemColumns}
          rows={invoice.items}
          rowKey={(item) => item.id}
          toolbar={
            <Button variant="ghost" size="sm" className={toolbarButtonClass} onClick={addItem}>
              <Plus className="h-4 w-4" />
              Agregar ítem
            </Button>
          }
          footer={totals}
        />
      </section>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Información adicional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={invoice.notes}
              onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
              placeholder="Información adicional, términos y condiciones, etc."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(true)}>Cancelar</Button>
        <Button onClick={handleSaveInvoice}>
          <Save className="mr-2 h-4 w-4" />
          Guardar factura
        </Button>
      </div>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/app/facturacion")}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoiceForm;
