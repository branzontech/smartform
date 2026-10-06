import { CeldaEstado, type ColumnaTabla, type TonoEstado } from "@/components/kit/tabla";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus, PaymentMethod } from "@/types/billing-types";

/** Montos de facturación: siempre con dos decimales y separadores es-CO. */
const MONEDA = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatoMoneda = (valor: number) => `$${MONEDA.format(valor)}`;

const FECHA = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
export const fechaCorta = (fecha: Date | string) => FECHA.format(new Date(fecha));

export const ESTADO_FACTURA: Record<InvoiceStatus, { texto: string; tono: TonoEstado }> = {
  paid: { texto: "Pagada", tono: "exito" },
  pending: { texto: "Pendiente", tono: "aviso" },
  overdue: { texto: "Vencida", tono: "error" },
  cancelled: { texto: "Cancelada", tono: "neutro" },
};

/** Color de texto por tono, para mostrar el estado fuera de una tabla (sin punto ni píldora). */
export const TONO_TEXTO = {
  exito: "text-[hsl(var(--success))]",
  aviso: "text-[hsl(var(--warning))]",
  error: "text-destructive",
  info: "text-[hsl(var(--info))]",
  neutro: "text-muted-foreground",
  primario: "text-primary",
} as const;

export const METODO_PAGO: Record<PaymentMethod, string> = {
  credit_card: "Tarjeta de crédito",
  bank_transfer: "Transferencia bancaria",
  cash: "Efectivo",
  insurance: "Seguro médico",
};

export const metodoPago = (f: Invoice) => (f.paymentMethod ? METODO_PAGO[f.paymentMethod] : null);

/** Facturas que aún se deben cobrar. */
export const porCobrar = (f: Invoice) => f.status === "pending" || f.status === "overdue";

const derecha = "text-right tabular-nums";

/** Columnas de una factura en los listados (Facturas y Pagos pendientes). Una celda, un dato. */
export const COLUMNAS_FACTURA: ColumnaTabla<Invoice>[] = [
  { id: "numero", titulo: "Nº factura", valor: (f) => f.invoiceNumber, className: "font-mono text-xs", fija: true },
  { id: "paciente", titulo: "Paciente", valor: (f) => f.patientName, principal: true, className: "min-w-[200px]" },
  { id: "medico", titulo: "Médico", valor: (f) => f.doctorName, oculta: true },
  { id: "emision", titulo: "Emisión", valor: (f) => new Date(f.issueDate).getTime(), celda: (f) => fechaCorta(f.issueDate), className: "tabular-nums" },
  {
    id: "vencimiento", titulo: "Vencimiento", valor: (f) => new Date(f.dueDate).getTime(), className: "tabular-nums",
    // Las vencidas se marcan con color, sin texto extra.
    celda: (f) => <span className={f.status === "overdue" ? "font-medium text-destructive" : undefined}>{fechaCorta(f.dueDate)}</span>,
  },
  { id: "subtotal", titulo: "Subtotal", valor: (f) => f.subtotal, celda: (f) => formatoMoneda(f.subtotal), className: derecha, oculta: true },
  { id: "iva", titulo: "IVA", valor: (f) => f.tax, celda: (f) => formatoMoneda(f.tax), className: derecha, oculta: true },
  { id: "descuento", titulo: "Descuento", valor: (f) => f.discount ?? 0, celda: (f) => formatoMoneda(f.discount ?? 0), className: derecha, oculta: true },
  { id: "total", titulo: "Total", valor: (f) => f.total, celda: (f) => formatoMoneda(f.total), className: cn(derecha, "text-foreground") },
  { id: "metodo", titulo: "Método de pago", valor: metodoPago, oculta: true },
  {
    id: "estado", titulo: "Estado", valor: (f) => ESTADO_FACTURA[f.status].texto, sinPadding: true,
    celda: (f) => <CeldaEstado tono={ESTADO_FACTURA[f.status].tono} texto={ESTADO_FACTURA[f.status].texto} />,
  },
];

export const claveFactura = (f: Invoice) => f.id;
