import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign } from "lucide-react";
import { AccionesFila } from "@/components/kit/AccionesFila";
import { BarraTabla, TablaDatos, useTablaDatos, type FiltroTabla, type SegmentoTabla } from "@/components/kit/tabla";
import type { Invoice } from "@/types/billing-types";
import { mockInvoices } from "@/utils/billing-utils";
import { COLUMNAS_FACTURA, claveFactura } from "./facturas";
import { ListaCompactaFacturas } from "./ListaCompactaFacturas";

interface PendingPaymentsProps {
  limit?: number;
  compact?: boolean;
}

const FILTROS: FiltroTabla<Invoice>[] = [
  { id: "paciente", titulo: "Paciente", valor: (f) => f.patientName },
  { id: "medico", titulo: "Médico", valor: (f) => f.doctorName },
];

const SEGMENTOS: SegmentoTabla<Invoice>[] = [
  { id: "todas", titulo: "Por cobrar", cumple: () => true },
  { id: "vencidas", titulo: "Vencidas", cumple: (f) => f.status === "overdue" },
  { id: "pendientes", titulo: "Pendientes", cumple: (f) => f.status === "pending" },
];

/** Vencidas primero y luego por fecha de vencimiento, como la lista original. */
const porUrgencia = (a: Invoice, b: Invoice) => {
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
  const pendientes = useMemo(() => mockInvoices.filter((f) => f.status === "pending" || f.status === "overdue").sort(porUrgencia), []);
  const t = useTablaDatos({ id: "facturacion.pendientes", filas: pendientes, columnas: COLUMNAS_FACTURA, claveFila: claveFactura, filtros: FILTROS, segmentos: SEGMENTOS });

  const ver = (f: Invoice) => navigate(`/app/facturacion/${f.id}`);
  const pagar = (f: Invoice) => navigate(`/app/facturacion/${f.id}?pagar=1`);

  if (compact) return <ListaCompactaFacturas facturas={pendientes.slice(0, limit ?? 5)} onVer={ver} vacio="No hay pagos pendientes." />;

  return (
    <TablaDatos
      t={t}
      onFilaClick={ver}
      barra={<BarraTabla t={t} nombre={["factura", "facturas"]} placeholder="Buscar por número o paciente" nombreArchivo="pagos-pendientes" />}
      acciones={(f) => (
        <AccionesFila
          nombre={`factura ${f.invoiceNumber}`}
          onVer={() => ver(f)}
          menu={[{ titulo: "Registrar pago", icono: DollarSign, onClick: () => pagar(f) }]}
        />
      )}
      vacio="No hay pagos pendientes."
    />
  );
};

export default PendingPayments;
