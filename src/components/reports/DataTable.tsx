import { useMemo } from "react";
import { BarraTabla, TablaDatos, useTablaDatos, type ColumnaTabla, type FiltroTabla } from "@/components/kit/tabla";
import type { ChartConfig, ReportVariable } from "@/types/report-types";

interface DataTableProps {
  chart: ChartConfig;
  variables: ReportVariable[];
}

type FilaReporte = Record<string, string | number>;

// DATOS SIMULADOS: la vista previa aún no consulta los datos reales del informe.
const DATOS_SERIE: FilaReporte[] = [
  { periodo: "Enero 2024", valor: 120, categoria: "Tipo A", porcentaje: 15 },
  { periodo: "Febrero 2024", valor: 190, categoria: "Tipo B", porcentaje: 23 },
  { periodo: "Marzo 2024", valor: 300, categoria: "Tipo A", porcentaje: 37 },
  { periodo: "Abril 2024", valor: 170, categoria: "Tipo C", porcentaje: 21 },
  { periodo: "Mayo 2024", valor: 250, categoria: "Tipo B", porcentaje: 31 },
  { periodo: "Junio 2024", valor: 180, categoria: "Tipo A", porcentaje: 22 },
];
const DATOS_TORTA: FilaReporte[] = [
  { categoria: "Masculino", cantidad: 156, porcentaje: 60, total: 260 },
  { categoria: "Femenino", cantidad: 91, porcentaje: 35, total: 260 },
  { categoria: "Otro", cantidad: 13, porcentaje: 5, total: 260 },
];

const numero = new Intl.NumberFormat("es-CO");
const derecha = "text-right tabular-nums";

const colTexto = (id: string, titulo: string, principal = false): ColumnaTabla<FilaReporte> => ({
  id, titulo, principal, valor: (f) => f[id],
});
const colNumero = (id: string, titulo: string, sufijo = ""): ColumnaTabla<FilaReporte> => ({
  id, titulo, className: derecha, valor: (f) => f[id],
  celda: (f) => (typeof f[id] === "number" ? `${numero.format(f[id] as number)}${sufijo}` : f[id]),
});

const COLUMNAS_SERIE: ColumnaTabla<FilaReporte>[] = [
  { ...colTexto("periodo", "Período", true), fija: true },
  colNumero("valor", "Valor"),
  colTexto("categoria", "Categoría"),
  colNumero("porcentaje", "Porcentaje", " %"),
];
const COLUMNAS_TORTA: ColumnaTabla<FilaReporte>[] = [
  { ...colTexto("categoria", "Categoría", true), fija: true },
  colNumero("cantidad", "Cantidad"),
  colNumero("porcentaje", "Porcentaje", " %"),
  colNumero("total", "Total"),
];

const FILTROS_SERIE: FiltroTabla<FilaReporte>[] = [{ id: "categoria", titulo: "Categoría", valor: (f) => String(f.categoria) }];
const SIN_FILTROS: FiltroTabla<FilaReporte>[] = [];

const claveFila = (f: FilaReporte) => String(f.periodo ?? f.categoria);

/**
 * Tabla de datos de un gráfico de informe: envoltorio de TablaDatos que
 * conserva las props anteriores ({ chart, variables }).
 */
export const DataTable = ({ chart, variables }: DataTableProps) => {
  const torta = chart.type === "pie";
  const filas = torta ? DATOS_TORTA : DATOS_SERIE;
  const columnas = torta ? COLUMNAS_TORTA : COLUMNAS_SERIE;
  const filtros = torta ? SIN_FILTROS : FILTROS_SERIE;

  const t = useTablaDatos({ id: `reportes.datos.${chart.id}.${torta ? "torta" : "serie"}`, filas, columnas, claveFila, filtros });

  const ejes = useMemo(() => {
    const nombre = (id: string) => variables.find((v) => v.id === id)?.displayName || id;
    return [chart.xAxis && `Eje X: ${nombre(chart.xAxis)}`, chart.yAxis && `Eje Y: ${nombre(chart.yAxis)}`].filter(Boolean).join(" · ");
  }, [chart.xAxis, chart.yAxis, variables]);

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">Datos: {chart.title}</h3>
        {ejes && <p className="text-[13px] text-muted-foreground">{ejes}</p>}
      </div>
      <TablaDatos
        t={t}
        barra={<BarraTabla t={t} nombre={["registro", "registros"]} placeholder="Buscar en los datos" nombreArchivo={`datos-${chart.title || "grafico"}`} />}
        vacio="Este gráfico aún no tiene datos."
      />
    </div>
  );
};
