import { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { FolderTabs, type FolderTab } from "@/components/kit/tabs/FolderTabs";
import { oneOf, usePersistentState } from "@/components/kit/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InvoiceList from "@/components/billing/InvoiceList";
import PendingPayments from "@/components/billing/PendingPayments";
import BillingReports from "@/components/billing/BillingReports";
import BillingStats from "@/components/billing/BillingStats";
import InvoiceGenerator from "@/components/billing/InvoiceGenerator";
import ContractsPage from "./ContractsPage";
import PriceLists from "./PriceLists";

/** Resumen del módulo: es la única vista con indicadores (KPI), como un dashboard. */
function BillingSummary() {
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

const VIEWS = {
  invoices: InvoiceList,
  pending: PendingPayments,
  contracts: () => <ContractsPage embedded />,
  priceLists: () => <PriceLists embedded />,
  reports: BillingReports,
  summary: BillingSummary,
  generate: InvoiceGenerator,
} satisfies Record<string, ComponentType>;
type View = keyof typeof VIEWS;

const TABS: FolderTab<View>[] = [
  { id: "invoices", title: "Facturas", pinned: true },
  { id: "pending", title: "Pagos pendientes" },
  { id: "contracts", title: "Convenios" },
  { id: "priceLists", title: "Tarifarios" },
  { id: "reports", title: "Reportes" },
  { id: "summary", title: "Resumen" },
  { id: "generate", title: "Generar" },
];
const IDS = TABS.map((p) => p.id);
const INITIAL_VISIBLE: View[] = ["invoices", "pending", "contracts", "priceLists", "reports"];

/**
 * Facturación con la convención de páginas de módulo: encabezado estándar y
 * vistas en pestañas tipo carpeta que quedan montadas al abrirlas (conservan
 * búsqueda y scroll al volver). Convenios y Tarifarios siguen teniendo su
 * ruta propia (/app/facturacion/convenios y /tarifarios).
 */
const BillingDashboard = () => {
  const navigate = useNavigate();
  const [active, setActive] = usePersistentState<View>("billing.view", "invoices", oneOf(IDS));
  const [opened, setOpened] = useState<Set<View>>(() => new Set([active]));

  useEffect(() => {
    setOpened((prev) => (prev.has(active) ? prev : new Set(prev).add(active)));
  }, [active]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader
        title="Facturación"
        primary={{ title: "Nueva factura", onClick: () => navigate("/app/facturacion/nueva") }}
      />
      <FolderTabs
        id="billing.tabs"
        label="Vistas de facturación"
        tabs={TABS}
        active={active}
        onChange={setActive}
        initialVisible={INITIAL_VISIBLE}
      />
      {[...opened].map((v) => {
        const ViewComponent = VIEWS[v];
        return (
          <div key={v} role="tabpanel" hidden={v !== active}>
            <ViewComponent />
          </div>
        );
      })}
    </div>
  );
};

export default BillingDashboard;
