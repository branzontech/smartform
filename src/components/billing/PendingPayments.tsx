import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign } from "lucide-react";
import { RowActions } from "@/components/kit/RowActions";
import { TableToolbar, DataTable, useDataTable, type TableFilter, type TableSegment } from "@/components/kit/table";
import type { Invoice } from "@/types/billing-types";
import { mockInvoices } from "@/utils/billing-utils";
import { INVOICE_COLUMNS, invoiceKey } from "./invoices";
import { CompactInvoiceList } from "./CompactInvoiceList";

interface PendingPaymentsProps {
  limit?: number;
  compact?: boolean;
}

const FILTERS: TableFilter<Invoice>[] = [
  { id: "patient", title: "Paciente", value: (f) => f.patientName },
  { id: "doctor", title: "Médico", value: (f) => f.doctorName },
];

const SEGMENTS: TableSegment<Invoice>[] = [
  { id: "all", title: "Por cobrar", match: () => true },
  { id: "overdue", title: "Vencidas", match: (f) => f.status === "overdue" },
  { id: "pending", title: "Pendientes", match: (f) => f.status === "pending" },
];

/** Vencidas primero y luego por fecha de vencimiento, como la lista original. */
const byUrgency = (a: Invoice, b: Invoice) => {
  if (a.status === "overdue" && b.status !== "overdue") return -1;
  if (a.status !== "overdue" && b.status === "overdue") return 1;
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
};

/**
 * Facturas por cobrar (pendientes y vencidas). Datos simulados (mockInvoices)
 * hasta que exista la tabla de facturas en la base de datos.
 */
const PendingPayments = ({ limit, compact = false }: PendingPaymentsProps) => {
  const navigate = useNavigate();
  const receivables = useMemo(() => mockInvoices.filter((f) => f.status === "pending" || f.status === "overdue").sort(byUrgency), []);
  const t = useDataTable({ id: "billing.pending", rows: receivables, columns: INVOICE_COLUMNS, rowKey: invoiceKey, filters: FILTERS, segments: SEGMENTS });

  const view = (f: Invoice) => navigate(`/app/facturacion/${f.id}`);
  const pay = (f: Invoice) => navigate(`/app/facturacion/${f.id}?pay=1`);

  if (compact) return <CompactInvoiceList invoices={receivables.slice(0, limit ?? 5)} onView={view} empty="No hay pagos pendientes." />;

  return (
    <DataTable
      t={t}
      onRowClick={view}
      toolbar={<TableToolbar t={t} name={["factura", "facturas"]} placeholder="Buscar por número o paciente" fileName="pagos-pendientes" />}
      actions={(f) => (
        <RowActions
          name={`factura ${f.invoiceNumber}`}
          onView={() => view(f)}
          menu={[{ title: "Registrar pago", icon: DollarSign, onClick: () => pay(f) }]}
        />
      )}
      empty="No hay pagos pendientes."
    />
  );
};

export default PendingPayments;
