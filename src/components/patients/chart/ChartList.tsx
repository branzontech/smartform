import { useMemo, useState } from "react";
import type { Order } from "@kerhub/core/ordenes";
import { describeItem, ORDER_TYPE_LABEL } from "@kerhub/core/ordenes";
import type { Cita } from "@/components/agenda/agenda-api";
import type { ClinicalRecord } from "@/components/forms/registros/types";
import { ChartToolbar } from "./ChartToolbar";
import { CitaRow, MonthHeader, OrderRow, RecordRow } from "./ChartRows";
import { EMPTY_FILTER, filterCitas, groupByMonth, type ChartView, type CitaFilter } from "./chart-model";

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const matches = (text: string, term: string) => !term || fold(text).includes(fold(term.trim()));

const NOUN: Record<ChartView, [string, string]> = {
  atenciones: ["atención", "atenciones"],
  registros: ["registro", "registros"],
  ordenes: ["orden", "órdenes"],
};

interface ChartListProps {
  view: ChartView;
  citas: Cita[];
  records: ClinicalRecord[];
  orders: Order[];
  /** «2 formatos · 3 órdenes» de cada atención. */
  summaryOf: (cita: Cita) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Línea de tiempo de la ficha (centro): atenciones, registros u órdenes por
 * mes, de lo más reciente a lo más antiguo, con búsqueda y filtro propios.
 */
export function ChartList({ view, citas, records, orders, summaryOf, selectedId, onSelect }: ChartListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CitaFilter>(EMPTY_FILTER);
  const professionals = useMemo(() => [...new Set(citas.map((c) => c.profesional))].sort((a, b) => a.localeCompare(b, "es")), [citas]);

  const shownCitas = view === "atenciones" ? filterCitas(citas, { ...filter, search }) : [];
  const shownRecords = view === "registros" ? records.filter((r) => matches(`${r.title} ${r.professional} ${r.content}`, search)) : [];
  const shownOrders =
    view === "ordenes"
      ? orders.filter((o) => matches(`${ORDER_TYPE_LABEL[o.tipo]} ${o.numero} ${o.items.map((i) => describeItem(o.tipo, i)).join(" ")}`, search))
      : [];
  const total = view === "atenciones" ? shownCitas.length : view === "registros" ? shownRecords.length : shownOrders.length;
  const [one, many] = NOUN[view];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 px-4">
        <span className="text-[12.5px] tabular-nums text-muted-foreground">
          {total} {total === 1 ? one : many}
        </span>
        <ChartToolbar
          key={view}
          search={search}
          onSearch={setSearch}
          filter={view === "atenciones" ? filter : undefined}
          onFilter={view === "atenciones" ? setFilter : undefined}
          professionals={professionals}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
        {total === 0 && (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {search || filter !== EMPTY_FILTER ? "Nada coincide con la búsqueda o el filtro." : `Este paciente aún no tiene ${many}.`}
          </p>
        )}
        {view === "atenciones" &&
          groupByMonth(shownCitas, (c) => c.inicio).map((g) => (
            <div key={g.month} role="group" aria-label={g.month} className="grid gap-0.5">
              <MonthHeader>{g.month}</MonthHeader>
              {g.items.map((c) => <CitaRow key={c.id} cita={c} summary={summaryOf(c)} selected={c.id === selectedId} onSelect={() => onSelect(c.id)} />)}
            </div>
          ))}
        {view === "registros" &&
          groupByMonth(shownRecords, (r) => r.createdAt.toISOString()).map((g) => (
            <div key={g.month} role="group" aria-label={g.month} className="grid gap-0.5">
              <MonthHeader>{g.month}</MonthHeader>
              {g.items.map((r) => <RecordRow key={r.id} record={r} selected={r.id === selectedId} onSelect={() => onSelect(r.id)} />)}
            </div>
          ))}
        {view === "ordenes" &&
          groupByMonth(shownOrders, (o) => o.fecha).map((g) => (
            <div key={g.month} role="group" aria-label={g.month} className="grid gap-0.5">
              <MonthHeader>{g.month}</MonthHeader>
              {g.items.map((o) => <OrderRow key={o.id} order={o} selected={o.id === selectedId} onSelect={() => onSelect(o.id)} />)}
            </div>
          ))}
      </div>
    </div>
  );
}
