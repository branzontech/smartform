import { StatusCell, type TableColumn, type StatusTone } from "@/components/kit/table";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus, PaymentMethod } from "@/types/billing-types";

/** Montos de facturación: siempre con dos decimales y separadores es-CO. */
const MONEY_FORMAT = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatMoney = (value: number) => `$${MONEY_FORMAT.format(value)}`;

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
export const shortDate = (date: Date | string) => DATE_FORMAT.format(new Date(date));

export const INVOICE_STATUS: Record<InvoiceStatus, { text: string; tone: StatusTone }> = {
  paid: { text: "Pagada", tone: "success" },
  pending: { text: "Pendiente", tone: "warning" },
  overdue: { text: "Vencida", tone: "error" },
  cancelled: { text: "Cancelada", tone: "neutral" },
};

/** Color de texto por tono, para mostrar el estado fuera de una tabla (sin punto ni píldora). */
export const TONE_TEXT_CLASS = {
  success: "text-[hsl(var(--success))]",
  warning: "text-[hsl(var(--warning))]",
  error: "text-destructive",
  info: "text-[hsl(var(--info))]",
  neutral: "text-muted-foreground",
  primary: "text-primary",
} as const;

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  credit_card: "Tarjeta de crédito",
  bank_transfer: "Transferencia bancaria",
  cash: "Efectivo",
  insurance: "Seguro médico",
};

export const paymentMethodOf = (f: Invoice) => (f.paymentMethod ? PAYMENT_METHOD_LABEL[f.paymentMethod] : null);

/** Facturas que aún se deben cobrar. */
export const receivable = (f: Invoice) => f.status === "pending" || f.status === "overdue";

const rightAligned = "text-right tabular-nums";

/** Columnas de una factura en los listados (Facturas y Pagos pendientes). Una celda, un dato. */
export const INVOICE_COLUMNS: TableColumn<Invoice>[] = [
  { id: "number", title: "Nº factura", value: (f) => f.invoiceNumber, className: "font-mono text-xs", alwaysVisible: true },
  { id: "patient", title: "Paciente", value: (f) => f.patientName, primary: true, className: "min-w-[200px]" },
  { id: "doctor", title: "Médico", value: (f) => f.doctorName, hidden: true },
  { id: "issueDate", title: "Emisión", value: (f) => new Date(f.issueDate).getTime(), cell: (f) => shortDate(f.issueDate), className: "tabular-nums" },
  {
    id: "dueDate", title: "Vencimiento", value: (f) => new Date(f.dueDate).getTime(), className: "tabular-nums",
    // Las vencidas se marcan con color, sin texto extra.
    cell: (f) => <span className={f.status === "overdue" ? "font-medium text-destructive" : undefined}>{shortDate(f.dueDate)}</span>,
  },
  { id: "subtotal", title: "Subtotal", value: (f) => f.subtotal, cell: (f) => formatMoney(f.subtotal), className: rightAligned, hidden: true },
  { id: "tax", title: "IVA", value: (f) => f.tax, cell: (f) => formatMoney(f.tax), className: rightAligned, hidden: true },
  { id: "discount", title: "Descuento", value: (f) => f.discount ?? 0, cell: (f) => formatMoney(f.discount ?? 0), className: rightAligned, hidden: true },
  { id: "total", title: "Total", value: (f) => f.total, cell: (f) => formatMoney(f.total), className: cn(rightAligned, "text-foreground") },
  { id: "paymentMethod", title: "Método de pago", value: paymentMethodOf, hidden: true },
  {
    id: "status", title: "Estado", value: (f) => INVOICE_STATUS[f.status].text, flush: true,
    cell: (f) => <StatusCell tone={INVOICE_STATUS[f.status].tone} text={INVOICE_STATUS[f.status].text} />,
  },
];

export const invoiceKey = (f: Invoice) => f.id;
