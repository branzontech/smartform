import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { db } from "@/integrations/data/client";
import { Button } from "@/components/ui/button";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { RowActions } from "@/components/kit/RowActions";
import {
  TableToolbar, StatusCell, DataTable, primaryButtonClass, useDataTable,
  type TableColumn, type TableFilter, type TableSegment, type StatusTone,
} from "@/components/kit/table";
import {
  displayStatus, MODALITY_LABEL, PAYER_TYPE_LABEL, parseDay, STATUS_LABEL, STATUS_TONE,
  type DisplayStatus, type Modality, type PayerType, type StoredStatus,
} from "@/components/contracts/contract-model";

interface ContractListRow {
  id: string;
  nombre_convenio: string;
  numero_contrato: string | null;
  codigo: string | null;
  tipo_contratacion: Modality;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: StoredStatus;
  valor_contrato: number | null;
  regimen: string | null;
  created_at: string;
  pagador: { nombre: string; tipo_pagador: PayerType; numero_identificacion: string | null } | null;
  status: DisplayStatus;
}

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
/** Tono de la celda de estado del kit para cada estado del contrato. */
const TONE: Record<string, StatusTone> = { success: "success", warning: "warning", danger: "error", info: "info", neutral: "neutral" };
const toneOf = (s: DisplayStatus) => TONE[STATUS_TONE[s]] ?? "neutral";

async function fetchContracts(): Promise<ContractListRow[]> {
  const { data, error } = await db
    .from("contratos")
    .select("id, nombre_convenio, numero_contrato, codigo, tipo_contratacion, fecha_inicio, fecha_fin, estado, valor_contrato, regimen, created_at, pagador:pagadores(nombre, tipo_pagador, numero_identificacion)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Omit<ContractListRow, "status">[]).map((c) => ({ ...c, status: displayStatus(c) }));
}

const COLUMNS: TableColumn<ContractListRow>[] = [
  { id: "contract", title: "Convenio", value: (c) => c.nombre_convenio, primary: true, alwaysVisible: true, className: "min-w-[220px]" },
  { id: "number", title: "Número", value: (c) => c.numero_contrato, className: "font-mono text-xs" },
  { id: "payer", title: "Pagador", value: (c) => c.pagador?.nombre },
  { id: "payerType", title: "Tipo de pagador", value: (c) => (c.pagador ? PAYER_TYPE_LABEL[c.pagador.tipo_pagador] : null), hidden: true },
  { id: "modality", title: "Modalidad", value: (c) => MODALITY_LABEL[c.tipo_contratacion] ?? c.tipo_contratacion },
  { id: "start", title: "Inicio", value: (c) => c.fecha_inicio, cell: (c) => shortDate.format(parseDay(c.fecha_inicio)), className: "tabular-nums" },
  { id: "end", title: "Fin", value: (c) => c.fecha_fin, cell: (c) => (c.fecha_fin ? shortDate.format(parseDay(c.fecha_fin)) : "—"), className: "tabular-nums" },
  { id: "value", title: "Valor", value: (c) => c.valor_contrato, cell: (c) => (c.valor_contrato ? money.format(c.valor_contrato) : "—"), className: "tabular-nums text-right" },
  { id: "code", title: "Código", value: (c) => c.codigo, className: "font-mono text-xs", hidden: true },
  { id: "createdAt", title: "Registrado", value: (c) => c.created_at, cell: (c) => shortDate.format(new Date(c.created_at)), hidden: true },
  {
    id: "status", title: "Estado", value: (c) => STATUS_LABEL[c.status], flush: true,
    cell: (c) => <StatusCell tone={toneOf(c.status)} text={STATUS_LABEL[c.status]} />,
  },
];

const FILTERS: TableFilter<ContractListRow>[] = [
  { id: "modality", title: "Modalidad", value: (c) => MODALITY_LABEL[c.tipo_contratacion] ?? c.tipo_contratacion },
  { id: "payer", title: "Pagador", value: (c) => c.pagador?.nombre },
  { id: "payerType", title: "Tipo de pagador", value: (c) => (c.pagador ? PAYER_TYPE_LABEL[c.pagador.tipo_pagador] : null) },
];

const SEGMENTS: TableSegment<ContractListRow>[] = [
  { id: "all", title: "Todos", match: () => true },
  { id: "valid", title: "Vigentes", match: (c) => c.status === "vigente" || c.status === "por_iniciar" },
  { id: "expiring", title: "Por vencer", match: (c) => c.status === "por_vencer" },
  { id: "expired", title: "Vencidos", match: (c) => c.status === "vencido" },
  { id: "draft", title: "Borradores", match: (c) => c.status === "borrador" },
  { id: "closed", title: "Cerrados", match: (c) => ["bloqueado", "terminado", "liquidado"].includes(c.status) },
];

const rowKey = (c: ContractListRow) => c.id;
const EDITOR_PATH = "/app/facturacion/convenios";

interface ContractsPageProps {
  /** Dentro de las pestañas de Facturación: sin encabezado propio; «Nuevo contrato» va en la barra de la tabla. */
  embedded?: boolean;
}

const ContractsPage = ({ embedded = false }: ContractsPageProps) => {
  const navigate = useNavigate();
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["contracts"], queryFn: fetchContracts });
  const t = useDataTable({ id: "billing.contracts.v2", rows, columns: COLUMNS, rowKey, filters: FILTERS, segments: SEGMENTS });
  const open = (c: ContractListRow) => navigate(`${EDITOR_PATH}/${c.id}`);
  const create = () => navigate(`${EDITOR_PATH}/nuevo`);

  const table = (
    <DataTable
      t={t}
      loading={isLoading}
      onRowClick={open}
      toolbar={
        <TableToolbar
          t={t}
          name={["contrato", "contratos"]}
          placeholder="Buscar por convenio, número o pagador"
          fileName="contratos"
          actions={embedded ? (
            <Button size="sm" className={primaryButtonClass} onClick={create}>
              <Plus className="h-4 w-4" />
              Nuevo contrato
            </Button>
          ) : undefined}
        />
      }
      actions={(c) => <RowActions name={c.nombre_convenio} onView={() => open(c)} />}
      empty={error ? `No se pudieron cargar los contratos: ${(error as Error).message}` : "Aún no hay contratos. Crea uno con «Nuevo contrato»."}
    />
  );

  return embedded ? table : (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader title="Contratos" primary={{ title: "Nuevo contrato", onClick: create }} />
      {table}
    </div>
  );
};

export default ContractsPage;
