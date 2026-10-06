import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, DollarSign } from "lucide-react";
import { AccionesFila } from "@/components/kit/AccionesFila";
import { BarraTabla, TablaDatos, useTablaDatos, type FiltroTabla, type SegmentoTabla } from "@/components/kit/tabla";
import type { Invoice } from "@/types/billing-types";
import { mockInvoices } from "@/utils/billing-utils";
import { COLUMNAS_FACTURA, claveFactura, metodoPago, porCobrar } from "./facturas";
import { ListaCompactaFacturas } from "./ListaCompactaFacturas";

interface InvoiceListProps {
  limit?: number;
  compact?: boolean;
}

const FILTROS: FiltroTabla<Invoice>[] = [
  { id: "medico", titulo: "Médico", valor: (f) => f.doctorName },
  { id: "paciente", titulo: "Paciente", valor: (f) => f.patientName },
  { id: "metodo", titulo: "Método de pago", valor: metodoPago },
];

const SEGMENTOS: SegmentoTabla<Invoice>[] = [
  { id: "todas", titulo: "Todas", cumple: () => true },
  { id: "pendientes", titulo: "Pendientes", cumple: (f) => f.status === "pending" },
  { id: "vencidas", titulo: "Vencidas", cumple: (f) => f.status === "overdue" },
  { id: "pagadas", titulo: "Pagadas", cumple: (f) => f.status === "paid" },
  { id: "canceladas", titulo: "Canceladas", cumple: (f) => f.status === "cancelled" },
];

/** Más recientes primero, como la lista original. */
const porEmision = (a: Invoice, b: Invoice) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();

/**
 * Facturas emitidas. Los datos son simulados (mockInvoices) hasta que exista
 * la tabla de facturas en la base de datos.
 */
const InvoiceList = ({ limit, compact = false }: InvoiceListProps) => {
  const navigate = useNavigate();
  const facturas = useMemo(() => [...mockInvoices].sort(porEmision), []);
  const t = useTablaDatos({ id: "facturacion.facturas", filas: facturas, columnas: COLUMNAS_FACTURA, claveFila: claveFactura, filtros: FILTROS, segmentos: SEGMENTOS });

  const ver = (f: Invoice) => navigate(`/app/facturacion/${f.id}`);

  if (compact) return <ListaCompactaFacturas facturas={facturas.slice(0, limit ?? 5)} onVer={ver} />;

  return (
    <TablaDatos
      t={t}
      onFilaClick={ver}
      barra={<BarraTabla t={t} nombre={["factura", "facturas"]} placeholder="Buscar por número o paciente" nombreArchivo="facturas" />}
      acciones={(f) => (
        <AccionesFila
          nombre={`factura ${f.invoiceNumber}`}
          onVer={() => ver(f)}
          menu={[
            ...(porCobrar(f) ? [{ titulo: "Registrar pago", icono: DollarSign, onClick: () => navigate(`/app/facturacion/${f.id}?pagar=1`) }] : []),
            { titulo: "Duplicar", icono: Copy, onClick: () => navigate(`/app/facturacion/editar/${f.id}`) },
          ]}
        />
      )}
      vacio="Aún no hay facturas. Crea una con «Nueva factura»."
    />
  );
};

export default InvoiceList;
