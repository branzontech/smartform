import { useMemo } from "react";
import { TableToolbar, DataTable, useDataTable, type TableColumn, type TableFilter } from "@/components/kit/table";
import type { ChartConfig, ReportVariable } from "@/types/report-types";

interface ReportDataTableProps {
  chart: ChartConfig;
  variables: ReportVariable[];
}

type ReportRow = Record<string, string | number>;

// DATOS SIMULADOS: la vista previa aún no consulta los datos reales del informe.
const SERIES_DATA: ReportRow[] = [
  { period: "Enero 2024", value: 120, category: "Tipo A", percent: 15 },
  { period: "Febrero 2024", value: 190, category: "Tipo B", percent: 23 },
  { period: "Marzo 2024", value: 300, category: "Tipo A", percent: 37 },
  { period: "Abril 2024", value: 170, category: "Tipo C", percent: 21 },
  { period: "Mayo 2024", value: 250, category: "Tipo B", percent: 31 },
  { period: "Junio 2024", value: 180, category: "Tipo A", percent: 22 },
];
const PIE_DATA: ReportRow[] = [
  { category: "Masculino", quantity: 156, percent: 60, total: 260 },
  { category: "Femenino", quantity: 91, percent: 35, total: 260 },
  { category: "Otro", quantity: 13, percent: 5, total: 260 },
];

const numberFormat = new Intl.NumberFormat("es-CO");
const rightAligned = "text-right tabular-nums";

const textColumn = (id: string, title: string, primary = false): TableColumn<ReportRow> => ({
  id, title, primary, value: (f) => f[id],
});
const numberColumn = (id: string, title: string, suffix = ""): TableColumn<ReportRow> => ({
  id, title, className: rightAligned, value: (f) => f[id],
  cell: (f) => (typeof f[id] === "number" ? `${numberFormat.format(f[id] as number)}${suffix}` : f[id]),
});

const SERIES_COLUMNS: TableColumn<ReportRow>[] = [
  { ...textColumn("period", "Período", true), alwaysVisible: true },
  numberColumn("value", "Valor"),
  textColumn("category", "Categoría"),
  numberColumn("percent", "Porcentaje", " %"),
];
const PIE_COLUMNS: TableColumn<ReportRow>[] = [
  { ...textColumn("category", "Categoría", true), alwaysVisible: true },
  numberColumn("quantity", "Cantidad"),
  numberColumn("percent", "Porcentaje", " %"),
  numberColumn("total", "Total"),
];

const SERIES_FILTERS: TableFilter<ReportRow>[] = [{ id: "category", title: "Categoría", value: (f) => String(f.category) }];
const NO_FILTERS: TableFilter<ReportRow>[] = [];

const rowKey = (f: ReportRow) => String(f.period ?? f.category);

/**
 * Tabla de datos de un gráfico de informe: envoltorio de DataTable que
 * conserva las props anteriores ({ chart, variables }).
 */
export const ReportDataTable = ({ chart, variables }: ReportDataTableProps) => {
  const isPie = chart.type === "pie";
  const rows = isPie ? PIE_DATA : SERIES_DATA;
  const columns = isPie ? PIE_COLUMNS : SERIES_COLUMNS;
  const filters = isPie ? NO_FILTERS : SERIES_FILTERS;

  const t = useDataTable({ id: `reports.data.${chart.id}.${isPie ? "pie" : "series"}`, rows, columns, rowKey, filters });

  const axes = useMemo(() => {
    const name = (id: string) => variables.find((v) => v.id === id)?.displayName || id;
    return [chart.xAxis && `Eje X: ${name(chart.xAxis)}`, chart.yAxis && `Eje Y: ${name(chart.yAxis)}`].filter(Boolean).join(" · ");
  }, [chart.xAxis, chart.yAxis, variables]);

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">Datos: {chart.title}</h3>
        {axes && <p className="text-[13px] text-muted-foreground">{axes}</p>}
      </div>
      <DataTable
        t={t}
        toolbar={<TableToolbar t={t} name={["registro", "registros"]} placeholder="Buscar en los datos" fileName={`datos-${chart.title || "grafico"}`} />}
        empty="Este gráfico aún no tiene datos."
      />
    </div>
  );
};
