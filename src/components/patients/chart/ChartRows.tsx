import type { ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { describeItem, ORDER_TYPE_LABEL, type Order } from "@kerhub/core/ordenes";
import { MODALITY_LABEL, localDay, localTime, type Cita } from "@/components/agenda/agenda-api";
import { StateText } from "@/components/agenda/StateText";
import type { ClinicalRecord } from "@/components/forms/registros/types";
import { cn } from "@/lib/utils";

const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: "UTC" });

const rowClass = (selected: boolean) =>
  cn(
    "grid w-full items-center gap-3 rounded-[14px] px-2.5 py-2.5 text-left transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    selected ? "bg-primary/10" : "hover:bg-canvas",
  );

export function MonthHeader({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-3 text-[12px] font-semibold text-muted-foreground">{children}</div>;
}

/** Fecha en baldosa: día grande y día de la semana debajo. */
function DateTile({ iso, selected }: { iso: string; selected: boolean }) {
  const day = localDay(iso);
  return (
    <span className={cn("grid h-12 w-11 place-content-center rounded-xl text-center leading-none", selected ? "bg-card" : "bg-canvas")}>
      <span className="text-[17px] font-semibold tabular-nums text-foreground">{Number(day.slice(8))}</span>
      <span className="mt-0.5 text-[11px] text-muted-foreground">{weekday.format(new Date(`${day}T12:00:00Z`)).replace(".", "")}</span>
    </span>
  );
}

export function CitaRow({ cita, summary, selected, onSelect }: { cita: Cita; summary: string; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" aria-current={selected || undefined} onClick={onSelect} className={cn(rowClass(selected), "grid-cols-[44px_minmax(0,1fr)]")}>
      <DateTile iso={cita.inicio} selected={selected} />
      <span className="grid min-w-0 gap-px">
        <span className="truncate text-[13.5px] font-semibold text-foreground">{cita.servicio ?? MODALITY_LABEL[cita.modalidad]}</span>
        <span className="truncate text-[12.5px] text-muted-foreground">{localTime(cita.inicio)} · {cita.profesional}</span>
        <span className="truncate text-[12px]">
          <StateText state={cita.estado} className="text-[12px] font-semibold" />
          {summary && <span className="text-muted-foreground"> · {summary}</span>}
        </span>
      </span>
    </button>
  );
}

export function RecordRow({ record, selected, onSelect }: { record: ClinicalRecord; selected: boolean; onSelect: () => void }) {
  const cancelled = record.state !== "active";
  return (
    <button type="button" aria-current={selected || undefined} onClick={onSelect} className={cn(rowClass(selected), "grid-cols-[minmax(0,1fr)_auto]")}>
      <span className="grid min-w-0 gap-px">
        <span className={cn("truncate text-[13.5px] font-semibold", cancelled ? "text-muted-foreground line-through decoration-1" : "text-foreground")}>{record.title}</span>
        <span className="truncate text-[12.5px] text-muted-foreground">{format(record.createdAt, "d MMM · HH:mm", { locale: es })} · {record.professional}</span>
      </span>
      {record.score && (
        <span className="text-[13px] font-semibold tabular-nums text-foreground">
          {record.score.value}
          {record.score.max ? `/${record.score.max}` : ""}
        </span>
      )}
    </button>
  );
}

export function OrderRow({ order, selected, onSelect }: { order: Order; selected: boolean; onSelect: () => void }) {
  const cancelled = order.estadoRegistro !== "active";
  return (
    <button type="button" aria-current={selected || undefined} onClick={onSelect} className={cn(rowClass(selected), "grid-cols-[minmax(0,1fr)]")}>
      <span className="grid min-w-0 gap-px">
        <span className={cn("truncate text-[13.5px] font-semibold", cancelled ? "text-muted-foreground line-through decoration-1" : "text-foreground")}>
          {ORDER_TYPE_LABEL[order.tipo]} · {order.numero}
        </span>
        <span className="truncate text-[12.5px] text-muted-foreground">{order.items.map((i) => describeItem(order.tipo, i)).join(" · ")}</span>
        <span className="text-[12px] text-muted-foreground">
          {format(new Date(order.fecha), "d MMM yyyy", { locale: es })}
          {cancelled && <span className="font-semibold text-[hsl(var(--warning))]"> · Anulada</span>}
        </span>
      </span>
    </button>
  );
}
