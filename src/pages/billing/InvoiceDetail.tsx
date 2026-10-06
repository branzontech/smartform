import { useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Copy, DollarSign, Download, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { TablaSimple, type ColumnaSimple } from "@/components/kit/tabla";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ESTADO_FACTURA, TONO_TEXTO, fechaCorta, formatoMoneda, porCobrar } from "@/components/billing/facturas";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceItem } from "@/types/billing-types";
import { mockInvoices } from "@/utils/billing-utils";

const derecha = "text-right tabular-nums";

const COLUMNAS_ITEMS: ColumnaSimple<InvoiceItem>[] = [
  { id: "codigo", titulo: "Código", celda: (i) => i.serviceCode ?? "—", className: "w-24 font-mono text-xs" },
  { id: "descripcion", titulo: "Descripción", celda: (i) => i.description, principal: true },
  { id: "cantidad", titulo: "Cantidad", celda: (i) => i.quantity, className: cn(derecha, "w-24") },
  { id: "precio", titulo: "Precio unitario", celda: (i) => formatoMoneda(i.unitPrice), className: cn(derecha, "w-36") },
  { id: "total", titulo: "Total", celda: (i) => formatoMoneda(i.total), className: cn(derecha, "w-36 font-medium text-foreground") },
];

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function Totales({ factura }: { factura: Invoice }) {
  const fila = "flex justify-between gap-6";
  return (
    <div className="ml-auto w-full max-w-xs space-y-1">
      <div className={fila}><span>Subtotal</span><span>{formatoMoneda(factura.subtotal)}</span></div>
      <div className={fila}><span>IVA (16%)</span><span>{formatoMoneda(factura.tax)}</span></div>
      {!!factura.discount && <div className={fila}><span>Descuento</span><span>-{formatoMoneda(factura.discount)}</span></div>}
      <div className={cn(fila, "border-t border-border pt-1 text-base font-semibold text-foreground")}><span>Total</span><span>{formatoMoneda(factura.total)}</span></div>
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(() => params.get("pagar") === "1" && !!invoice && porCobrar(invoice));
  const [paymentAmount, setPaymentAmount] = useState("");

  if (!invoice) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 py-6">
        <EncabezadoModulo titulo="Factura no encontrada" />
        <div className="rounded-2xl border border-border bg-card py-12 text-center">
          <p className="text-muted-foreground">La factura que buscas no existe o ha sido eliminada.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/app/facturacion")}>Volver a facturación</Button>
        </div>
      </div>
    );
  }

  const estado = ESTADO_FACTURA[invoice.status];

  const handleRegisterPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }
    setShowPaymentDialog(false);
    toast.success(`Pago de ${formatoMoneda(amount)} registrado correctamente`);
    setPaymentAmount("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo
        titulo={`Factura ${invoice.invoiceNumber}`}
        secundarias={[
          { titulo: "Imprimir", icono: Printer, onClick: () => toast.success("Preparando impresión...") },
          { titulo: "Enviar", icono: Send, onClick: () => toast.success("Factura enviada al correo del paciente") },
        ]}
        menu={[
          { titulo: "Descargar PDF", icono: Download, onClick: () => toast.success("Descargando factura en PDF...") },
          { titulo: "Duplicar", icono: Copy, onClick: () => navigate(`/app/facturacion/editar/${id}`) },
        ]}
        primaria={porCobrar(invoice) ? { titulo: "Registrar pago", icono: DollarSign, onClick: () => setShowPaymentDialog(true) } : undefined}
      />

      <Card className="rounded-2xl">
        <CardContent className="grid grid-cols-2 gap-5 pt-6 md:grid-cols-3 lg:grid-cols-6">
          <Dato titulo="Paciente">{invoice.patientName}</Dato>
          <Dato titulo="Médico">{invoice.doctorName || "No asignado"}</Dato>
          <Dato titulo="Emisión">{fechaCorta(invoice.issueDate)}</Dato>
          <Dato titulo="Vencimiento">
            <span className={invoice.status === "overdue" ? "text-destructive" : undefined}>{fechaCorta(invoice.dueDate)}</span>
          </Dato>
          <Dato titulo="Estado"><span className={TONO_TEXTO[estado.tono]}>{estado.texto}</span></Dato>
          {invoice.status === "paid" ? (
            <Dato titulo="Pagada">
              <span className="tabular-nums">{formatoMoneda(invoice.paidAmount ?? invoice.total)}</span>
              {invoice.paidDate && <span className="text-muted-foreground"> · {fechaCorta(invoice.paidDate)}</span>}
            </Dato>
          ) : (
            <Dato titulo="Total"><span className="tabular-nums">{formatoMoneda(invoice.total)}</span></Dato>
          )}
        </CardContent>
      </Card>

      <TablaSimple
        columnas={COLUMNAS_ITEMS}
        filas={invoice.items}
        claveFila={(i) => i.id}
        vacio="La factura no tiene ítems."
        pie={<Totales factura={invoice} />}
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
              <span className="font-medium tabular-nums">{formatoMoneda(invoice.total)}</span>
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
