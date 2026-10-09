import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, DollarSign } from "lucide-react";
import { RowActions } from "@/components/kit/RowActions";
import { TableToolbar, DataTable, useDataTable, type TableFilter, type TableSegment } from "@/components/kit/table";
import type { Invoice } from "@/types/billing-types";
import { mockInvoices } from "@/utils/billing-utils";
import { INVOICE_COLUMNS, invoiceKey, paymentMethodOf, receivable } from "./invoices";
import { CompactInvoiceList } from "./CompactInvoiceList";

interface InvoiceListProps {
  limit?: number;
  compact?: boolean;
}

const FILTERS: TableFilter<Invoice>[] = [
  { id: "doctor", title: "Médico", value: (f) => f.doctorName },
  { id: "patient", title: "Paciente", value: (f) => f.patientName },
  { id: "paymentMethod", title: "Método de pago", value: paymentMethodOf },
];

const SEGMENTS: TableSegment<Invoice>[] = [
  { id: "all", title: "Todas", match: () => true },
  { id: "pending", title: "Pendientes", match: (f) => f.status === "pending" },
  { id: "overdue", title: "Vencidas", match: (f) => f.status === "overdue" },
  { id: "paid", title: "Pagadas", match: (f) => f.status === "paid" },
  { id: "cancelled", title: "Canceladas", match: (f) => f.status === "cancelled" },
];

/** Más recientes primero, como la lista original. */
const byIssueDateDesc = (a: Invoice, b: Invoice) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();

/**
 * Facturas emitidas. Los datos son simulados (mockInvoices) hasta que exista
 * la tabla de facturas en la base de datos.
 */
const InvoiceList = ({ limit, compact = false }: InvoiceListProps) => {
  const navigate = useNavigate();
  const invoices = useMemo(() => [...mockInvoices].sort(byIssueDateDesc), []);
  const t = useDataTable({ id: "billing.invoices", rows: invoices, columns: INVOICE_COLUMNS, rowKey: invoiceKey, filters: FILTERS, segments: SEGMENTS });

  const view = (f: Invoice) => navigate(`/app/facturacion/${f.id}`);

  if (compact) return <CompactInvoiceList invoices={invoices.slice(0, limit ?? 5)} onView={view} />;

  return (
    <DataTable
      t={t}
      onRowClick={view}
      toolbar={<TableToolbar t={t} name={["factura", "facturas"]} placeholder="Buscar por número o paciente" fileName="facturas" />}
      actions={(f) => (
        <RowActions
          name={`factura ${f.invoiceNumber}`}
          onView={() => view(f)}
          menu={[
            ...(receivable(f) ? [{ title: "Registrar pago", icon: DollarSign, onClick: () => navigate(`/app/facturacion/${f.id}?pay=1`) }] : []),
            { title: "Duplicar", icon: Copy, onClick: () => navigate(`/app/facturacion/editar/${f.id}`) },
          ]}
        />
      )}
      empty="Aún no hay facturas. Crea una con «Nueva factura»."
    />
  );
};

export default InvoiceList;
