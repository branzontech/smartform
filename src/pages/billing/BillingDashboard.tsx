import { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { PestanasCarpeta, type PestanaCarpeta } from "@/components/kit/pestanas/PestanasCarpeta";
import { unaDe, useEstadoPersistente } from "@/components/kit/tabla";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InvoiceList from "@/components/billing/InvoiceList";
import PendingPayments from "@/components/billing/PendingPayments";
import BillingReports from "@/components/billing/BillingReports";
import BillingStats from "@/components/billing/BillingStats";
import InvoiceGenerator from "@/components/billing/InvoiceGenerator";
import ContractsPage from "./ContractsPage";
import PriceLists from "./PriceLists";

/** Resumen del módulo: es la única vista con indicadores (KPI), como un dashboard. */
function ResumenFacturacion() {
  return (
    <div className="space-y-6">
      <BillingStats />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pagos pendientes recientes</CardTitle>
            <CardDescription>Últimas facturas pendientes de cobro</CardDescription>
          </CardHeader>
          <CardContent>
            <PendingPayments limit={5} compact />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Últimas facturas generadas</CardTitle>
            <CardDescription>Facturas emitidas recientemente</CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceList limit={5} compact />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const VISTAS = {
  facturas: InvoiceList,
  pendientes: PendingPayments,
  convenios: () => <ContractsPage embebido />,
  tarifarios: () => <PriceLists embebido />,
  reportes: BillingReports,
  resumen: ResumenFacturacion,
  generar: InvoiceGenerator,
} satisfies Record<string, ComponentType>;
type Vista = keyof typeof VISTAS;

const PESTANAS: PestanaCarpeta<Vista>[] = [
  { id: "facturas", titulo: "Facturas", fija: true },
  { id: "pendientes", titulo: "Pagos pendientes" },
  { id: "convenios", titulo: "Convenios" },
  { id: "tarifarios", titulo: "Tarifarios" },
  { id: "reportes", titulo: "Reportes" },
  { id: "resumen", titulo: "Resumen" },
  { id: "generar", titulo: "Generar" },
];
const IDS = PESTANAS.map((p) => p.id);
const VISIBLES_INICIALES: Vista[] = ["facturas", "pendientes", "convenios", "tarifarios", "reportes"];

/**
 * Facturación con la convención de páginas de módulo: encabezado estándar y
 * vistas en pestañas tipo carpeta que quedan montadas al abrirlas (conservan
 * búsqueda y scroll al volver). Convenios y Tarifarios siguen teniendo su
 * ruta propia (/app/facturacion/convenios y /tarifarios).
 */
const BillingDashboard = () => {
  const navigate = useNavigate();
  const [activa, setActiva] = useEstadoPersistente<Vista>("facturacion.vista", "facturas", unaDe(IDS));
  const [abiertas, setAbiertas] = useState<Set<Vista>>(() => new Set([activa]));

  useEffect(() => {
    setAbiertas((prev) => (prev.has(activa) ? prev : new Set(prev).add(activa)));
  }, [activa]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo
        titulo="Facturación"
        primaria={{ titulo: "Nueva factura", onClick: () => navigate("/app/facturacion/nueva") }}
      />
      <PestanasCarpeta
        id="facturacion.pestanas"
        etiqueta="Vistas de facturación"
        pestanas={PESTANAS}
        activa={activa}
        onCambio={setActiva}
        visiblesIniciales={VISIBLES_INICIALES}
      />
      {[...abiertas].map((v) => {
        const Vista = VISTAS[v];
        return (
          <div key={v} role="tabpanel" hidden={v !== activa}>
            <Vista />
          </div>
        );
      })}
    </div>
  );
};

export default BillingDashboard;
