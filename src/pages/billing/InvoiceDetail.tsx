import { useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Copy, DollarSign, Download, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { SimpleTable, type SimpleColumn } from "@/components/kit/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INVOICE_STATUS, TONE_TEXT_CLASS, shortDate, formatMoney, receivable } from "@/components/billing/invoices";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceItem } from "@/types/billing-types";
import { mockInvoices } from "@/utils/billing-utils";

const rightAligned = "text-right tabular-nums";

const ITEM_COLUMNS: SimpleColumn<InvoiceItem>[] = [
  { id: "code", title: "Código", cell: (i) => i.serviceCode ?? "—", className: "w-24 font-mono text-xs" },
  { id: "description", title: "Descripción", cell: (i) => i.description, primary: true },
  { id: "quantity", title: "Cantidad", cell: (i) => i.quantity, className: cn(rightAligned, "w-24") },
  { id: "unitPrice", title: "Precio unitario", cell: (i) => formatMoney(i.unitPrice), className: cn(rightAligned, "w-36") },
  { id: "total", title: "Total", cell: (i) => formatMoney(i.total), className: cn(rightAligned, "w-36 font-medium text-foreground") },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function Totals({ invoice }: { invoice: Invoice }) {
  const rowClass = "flex justify-between gap-6";
  return (
    <div className="ml-auto w-full max-w-xs space-y-1">
      <div className={rowClass}><span>Subtotal</span><span>{formatMoney(invoice.subtotal)}</span></div>
      <div className={rowClass}><span>IVA (16%)</span><span>{formatMoney(invoice.tax)}</span></div>
      {!!invoice.discount && <div className={rowClass}><span>Descuento</span><span>-{formatMoney(invoice.discount)}</span></div>}
      <div className={cn(rowClass, "border-t border-border pt-1 text-base font-semibold text-foreground")}><span>Total</span><span>{formatMoney(invoice.total)}</span></div>
    </div>
  );
}

/**
 * Detalle de una factura. Datos simulados (mockInvoices): imprimir, enviar,
 * descargar y registrar pago solo muestran el aviso, aún no persisten nada.
 */
const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invoice: Invoice | undefined = mockInvoices.find((inv) => inv.id === id);
  // Llegada desde «Registrar pago» en la lista: el diálogo se abre de una vez.
  const [showPaymentDialog, setShowPaymentDialog] = useState(() => params.get("pay") === "1" && !!invoice && receivable(invoice));
  const [paymentAmount, setPaymentAmount] = useState("");

  if (!invoice) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 py-6">
        <ModuleHeader title="Factura no encontrada" />
        <div className="rounded-2xl border border-border bg-card py-12 text-center">
          <p className="text-muted-foreground">La factura que buscas no existe o ha sido eliminada.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/app/facturacion")}>Volver a facturación</Button>
        </div>
      </div>
    );
  }

  const status = INVOICE_STATUS[invoice.status];

  const handleRegisterPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }
    setShowPaymentDialog(false);
    toast.success(`Pago de ${formatMoney(amount)} registrado correctamente`);
    setPaymentAmount("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader
        title={`Factura ${invoice.invoiceNumber}`}
        secondary={[
          { title: "Imprimir", icon: Printer, onClick: () => toast.success("Preparando impresión...") },
          { title: "Enviar", icon: Send, onClick: () => toast.success("Factura enviada al correo del paciente") },
        ]}
        menu={[
          { title: "Descargar PDF", icon: Download, onClick: () => toast.success("Descargando factura en PDF...") },
          { title: "Duplicar", icon: Copy, onClick: () => navigate(`/app/facturacion/editar/${id}`) },
        ]}
        primary={receivable(invoice) ? { title: "Registrar pago", icon: DollarSign, onClick: () => setShowPaymentDialog(true) } : undefined}
      />

      <Card className="rounded-2xl">
        <CardContent className="grid grid-cols-2 gap-5 pt-6 md:grid-cols-3 lg:grid-cols-6">
          <Field label="Paciente">{invoice.patientName}</Field>
          <Field label="Médico">{invoice.doctorName || "No asignado"}</Field>
          <Field label="Emisión">{shortDate(invoice.issueDate)}</Field>
          <Field label="Vencimiento">
            <span className={invoice.status === "overdue" ? "text-destructive" : undefined}>{shortDate(invoice.dueDate)}</span>
          </Field>
          <Field label="Estado"><span className={TONE_TEXT_CLASS[status.tone]}>{status.text}</span></Field>
          {invoice.status === "paid" ? (
            <Field label="Pagada">
              <span className="tabular-nums">{formatMoney(invoice.paidAmount ?? invoice.total)}</span>
              {invoice.paidDate && <span className="text-muted-foreground"> · {shortDate(invoice.paidDate)}</span>}
            </Field>
          ) : (
            <Field label="Total"><span className="tabular-nums">{formatMoney(invoice.total)}</span></Field>
          )}
        </CardContent>
      </Card>

      <SimpleTable
        columns={ITEM_COLUMNS}
        rows={invoice.items}
        rowKey={(i) => i.id}
        empty="La factura no tiene ítems."
        footer={<Totals invoice={invoice} />}
      />

      {invoice.notes && (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <h3 className="mb-2 text-sm font-medium">Notas</h3>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>Ingresa el monto recibido para la factura {invoice.invoiceNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
              <span>Total de la factura</span>
              <span className="font-medium tabular-nums">{formatMoney(invoice.total)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
            <Button onClick={handleRegisterPayment}>Registrar pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceDetail;
