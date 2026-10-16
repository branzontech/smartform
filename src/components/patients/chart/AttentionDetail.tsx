import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Printer } from "lucide-react";
import { describeItem, ORDER_TYPE_LABEL, PRIORITY_LABEL, type Order } from "@kerhub/core/ordenes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MODALITY_LABEL, formatLongDay, localDay, localTime, type Cita } from "@/components/agenda/agenda-api";
import { capitalizeFirst } from "@/components/agenda/agenda-ui";
import { StateText } from "@/components/agenda/StateText";
import { RecordBody } from "@/components/forms/registros/RecordBody";
import { printRecords } from "@/components/forms/registros/print";
import { STATE_LABEL, STATE_TEXT, type ClinicalRecord } from "@/components/forms/registros/types";
import { cn } from "@/lib/utils";

const ghost = "h-8 gap-1.5 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:text-foreground";
const WITH_RECORDS = new Set(["en_atencion", "atendida"]);

export function OrderBlock({ order }: { order: Order }) {
  const cancelled = order.estadoRegistro !== "active";
  return (
    <div className="grid gap-1 py-2.5 [&:not(:last-child)]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
      <p className="flex flex-wrap items-baseline gap-x-2.5 text-[13px] text-muted-foreground">
        <span className={cn("text-sm font-semibold", cancelled ? "text-muted-foreground line-through decoration-1" : "text-foreground")}>
          {ORDER_TYPE_LABEL[order.tipo]} · {order.numero}
        </span>
        <span>{PRIORITY_LABEL[order.prioridad]}</span>
        <span>{order.medicoNombre}</span>
        {cancelled && <span className="font-semibold text-[hsl(var(--warning))]">Anulada</span>}
      </p>
      {order.items.map((it, i) => (
        <p key={i} className={cn("text-[15px]", cancelled ? "text-muted-foreground" : "text-foreground")}>{describeItem(order.tipo, it)}</p>
      ))}
      {order.indicaciones && <p className="text-[13px] text-muted-foreground">{order.indicaciones}</p>}
    </div>
  );
}

interface AttentionDetailProps {
  cita: Cita;
  patientId: string;
  records: ClinicalRecord[];
  orders: Order[];
  recordsLoading: boolean;
  /** Abrir directamente en las órdenes (al llegar desde la pestaña Órdenes). */
  focusOrders?: boolean;
  onBack: () => void;
}

/**
 * Una atención tal como quedó: encabezado fijo, índice para saltar a cada
 * formato o a las órdenes sin desplazarse a ciegas, y cada formato con su
 * estructura (secciones, signos en baldosas, textos largos recortados).
 */
export function AttentionDetail({ cita, patientId, records, orders, recordsLoading, focusOrders, onBack }: AttentionDetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const jumpTo = (id: string) => scrollRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  useEffect(() => {
    if (focusOrders) requestAnimationFrame(() => jumpTo("atencion-ordenes"));
  }, [focusOrders, cita.id]);

  const jumps = [...records.map((r) => ({ id: `registro-${r.id}`, label: r.title })), ...(orders.length ? [{ id: "atencion-ordenes", label: `Órdenes (${orders.length})` }] : [])];
  const empty = !cita.admisionId
    ? "Esta cita no tiene atención asociada."
    : WITH_RECORDS.has(cita.estado)
      ? "Aún no hay formatos guardados en esta atención."
      : "La atención no se ha iniciado. Aquí aparecerá lo que se diligencie desde la app o la web.";

  return (
    <article aria-label="Atención" className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-6 pt-4">
        <Button variant="ghost" size="sm" onClick={onBack} className={cn(ghost, "-ml-2 mb-1 md:hidden")}>
          <ArrowLeft className="h-4 w-4" />Atenciones
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {capitalizeFirst(formatLongDay(localDay(cita.inicio)))}, {localTime(cita.inicio)} – {localTime(cita.fin)}
            </h2>
            <p className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] text-muted-foreground">
              <span>{cita.profesional}</span>·<span>{cita.servicio ?? "Sin servicio"}</span>·<span>{MODALITY_LABEL[cita.modalidad]}</span>·<StateText state={cita.estado} />
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <Button asChild variant="ghost" size="sm" className={ghost}>
              <Link to={`/app/citas/${cita.id}`}>Ver cita</Link>
            </Button>
            {records.length > 0 && (
              <Button variant="ghost" size="sm" className={ghost} onClick={() => void printRecords(records, { patientId })}>
                <Printer className="h-4 w-4" />Imprimir
              </Button>
            )}
          </div>
        </div>
        {jumps.length > 1 && (
          <nav aria-label="Ir a" className="-mx-2.5 mt-2 flex gap-0.5 overflow-x-auto pb-2 shadow-[inset_0_-1px_0_hsl(var(--border))] [scrollbar-width:none]">
            {jumps.map((j) => (
              <button key={j.id} type="button" onClick={() => jumpTo(j.id)} className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-canvas hover:text-foreground">
                {j.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 [scrollbar-width:thin]">
        {recordsLoading ? (
          <Skeleton className="mt-5 h-48 rounded-tile" />
        ) : records.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          records.map((r) => (
            <section key={r.id} id={`registro-${r.id}`} aria-label={r.title} className="grid scroll-mt-2 gap-4 pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h3 className={cn("text-base font-semibold", r.state === "active" ? "text-foreground" : "text-muted-foreground line-through decoration-1")}>{r.title}</h3>
                <span className="text-[12.5px] text-muted-foreground">
                  Guardado {format(r.createdAt, "HH:mm")} · {r.professional}
                  {r.state !== "active" && <span className={cn("ml-2 font-semibold", STATE_TEXT[r.state])}>{STATE_LABEL[r.state]}</span>}
                </span>
              </div>
              <div className={cn(r.state !== "active" && "opacity-70")}>
                <RecordBody questions={r.questions} data={r.data} score={r.score} layout="stacked" />
              </div>
            </section>
          ))
        )}
        {orders.length > 0 && (
          <section id="atencion-ordenes" aria-label="Órdenes" className="grid scroll-mt-2 gap-1 pt-7">
            <h3 className="mb-1 text-base font-semibold text-foreground">Órdenes</h3>
            {orders.map((o) => <OrderBlock key={o.id} order={o} />)}
          </section>
        )}
      </div>
    </article>
  );
}
