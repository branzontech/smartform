import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { RowActions } from "@/components/kit/RowActions";
import {
  DataTable, StatusCell, TableToolbar, useDataTable,
  type TableColumn, type TableFilter, type TableSegment,
} from "@/components/kit/table";
import { useAuth } from "@/contexts/AuthContext";
import { COMPANIES_PATH, LICENSE_TONE, formatDay } from "@/components/tenancy/company-format";
import {
  COUNTRY_LABEL, LICENSE_LABEL, fetchPlatformCompanies, type PlatformCompany,
} from "@/components/tenancy/tenancy-api";

const seatsText = (c: PlatformCompany) => (c.sillas ? `${c.sillasUsadas} de ${c.sillas}` : `${c.sillasUsadas} · sin tope`);

const COLUMNS: TableColumn<PlatformCompany>[] = [
  { id: "name", title: "Empresa", value: (c) => c.nombre, primary: true, alwaysVisible: true, className: "min-w-[220px]" },
  { id: "nit", title: "NIT", value: (c) => c.nit, className: "font-mono text-xs" },
  { id: "plan", title: "Plan", value: (c) => c.plan },
  { id: "seats", title: "Sillas", value: (c) => c.sillasUsadas, cell: seatsText, className: "tabular-nums" },
  { id: "end", title: "Licencia hasta", value: (c) => c.licenciaFin, cell: (c) => formatDay(c.licenciaFin), className: "tabular-nums" },
  { id: "country", title: "País", value: (c) => COUNTRY_LABEL[c.pais] ?? c.pais, hidden: true },
  { id: "contact", title: "Contacto", value: (c) => c.contactoEmail, hidden: true },
  {
    id: "status", title: "Estado", value: (c) => LICENSE_LABEL[c.licencia.estado], flush: true,
    cell: (c) => <StatusCell tone={LICENSE_TONE[c.licencia.estado]} text={LICENSE_LABEL[c.licencia.estado]} />,
  },
];

const FILTERS: TableFilter<PlatformCompany>[] = [
  { id: "plan", title: "Plan", value: (c) => c.plan },
  { id: "country", title: "País", value: (c) => COUNTRY_LABEL[c.pais] ?? c.pais },
];

const SEGMENTS: TableSegment<PlatformCompany>[] = [
  { id: "all", title: "Todas", match: () => true },
  { id: "access", title: "Con acceso", match: (c) => c.licencia.acceso },
  { id: "attention", title: "Por vencer o en gracia", match: (c) => c.licencia.estado === "por_vencer" || c.licencia.estado === "en_gracia" },
  { id: "pending", title: "Sin activar", match: (c) => c.licencia.estado === "pendiente" },
  { id: "blocked", title: "Suspendidas o vencidas", match: (c) => c.licencia.estado === "suspendida" || c.licencia.estado === "vencida" },
];

/** Plataforma › Empresas: licencias de cada cliente. Solo dueños de Doctor Ker. */
export default function PlatformCompaniesPage() {
  const navigate = useNavigate();
  const { isPlatformAdmin, isLoading: sessionLoading } = useAuth();
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["platform-companies"],
    queryFn: fetchPlatformCompanies,
    enabled: isPlatformAdmin,
  });
  const t = useDataTable({ id: "platform.companies.v2", rows, columns: COLUMNS, rowKey: (c) => c.id, filters: FILTERS, segments: SEGMENTS });

  if (!sessionLoading && !isPlatformAdmin) return <Navigate to="/app/home" replace />;

  const open = (c: PlatformCompany) => navigate(`${COMPANIES_PATH}/${c.id}`);

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader title="Empresas" primary={{ title: "Nueva empresa", onClick: () => navigate(`${COMPANIES_PATH}/nueva`) }} />
      <DataTable
        t={t}
        loading={isLoading || sessionLoading}
        onRowClick={open}
        toolbar={<TableToolbar t={t} name={["empresa", "empresas"]} placeholder="Buscar por empresa, NIT o plan" fileName="empresas" />}
        actions={(c) => <RowActions name={c.nombre} onView={() => open(c)} />}
        empty={error ? `No se pudieron cargar las empresas: ${(error as Error).message}` : "Aún no hay empresas. Crea la primera con «Nueva empresa»."}
      />
    </div>
  );
}
