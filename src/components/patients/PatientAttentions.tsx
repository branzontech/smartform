import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/integrations/api/client";
import { createOrdersApi, describeItem, ORDER_TYPE_LABEL, PRIORITY_LABEL, type Order } from "@kerhub/core/ordenes";
import { MODALITY_LABEL, formatLongDay, localDay, localTime, type Cita } from "@/components/agenda/agenda-api";
import { capitalizeFirst, errorMessage } from "@/components/agenda/agenda-ui";
import { StateText } from "@/components/agenda/StateText";
import { RecordBody } from "@/components/forms/registros/RecordBody";
import { STATE_LABEL, STATE_TEXT, type ClinicalRecord } from "@/components/forms/registros/types";
import { cn } from "@/lib/utils";

const { fetchAdmissionOrders } = createOrdersApi(apiFetch);

/** Estados en que la cita ya tiene algo diligenciado (o se está diligenciando). */
const WITH_RECORDS = new Set(["en_atencion", "atendida"]);

const dayOf = (cita: Cita) => capitalizeFirst(formatLongDay(localDay(cita.inicio)));

/** La atención que se abre primero: la más reciente con registros; si no hay, la más reciente. */
const defaultCita = (citas: Cita[]) => citas.find((c) => WITH_RECORDS.has(c.estado)) ?? citas[0] ?? null;

function CitaRow({ cita, selected, onSelect }: { cita: Cita; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "grid w-full gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        selected ? "bg-primary/10" : "hover:bg-[hsl(var(--field))]",
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-semibold text-foreground">{dayOf(cita)}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{localTime(cita.inicio)}</span>
      </span>
      <span className="truncate text-xs text-muted-foreground">{cita.servicio ?? MODALITY_LABEL[cita.modalidad]}</span>
      <span className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{cita.profesional}</span>
        <StateText state={cita.estado} className="shrink-0 text-xs" />
      </span>
    </button>
  );
}

/** Un formato diligenciado en la atención, con la misma estructura con que se llenó. */
function FormatRecord({ record }: { record: ClinicalRecord }) {
  const isActive = record.state === "active";
  return (
    <section aria-label={record.title} className="grid gap-3 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h4 className={cn("text-base font-semibold text-foreground", !isActive && "text-muted-foreground line-through decoration-1")}>{record.title}</h4>
        <p className="text-[13px] text-muted-foreground">
          {record.professional} · {format(record.createdAt, "HH:mm")}
          {!isActive && <span className={cn("ml-2 font-semibold", STATE_TEXT[record.state])}>{STATE_LABEL[record.state]}</span>}
        </p>
      </header>
      <div className={cn(!isActive && "opacity-70")}>
        <RecordBody questions={record.questions} data={record.data} score={record.score} />
      </div>
    </section>
  );
}

function OrderRow({ order }: { order: Order }) {
  const cancelled = order.estadoRegistro !== "active";
  return (
    <li className="grid gap-1 border-t border-border py-3 first:border-t-0 first:pt-0">
      <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-muted-foreground">
        <span className={cn("font-semibold text-foreground", cancelled && "text-muted-foreground line-through decoration-1")}>
          {ORDER_TYPE_LABEL[order.tipo]} · {order.numero}
        </span>
        <span>{PRIORITY_LABEL[order.prioridad]}</span>
        <span>{order.medicoNombre}</span>
        {cancelled && <span className="font-semibold text-[hsl(var(--warning))]">Anulada</span>}
      </p>
      <ul className={cn("grid gap-0.5 text-sm text-foreground", cancelled && "text-muted-foreground")}>
        {order.items.map((it, i) => <li key={i}>{describeItem(order.tipo, it)}</li>)}
      </ul>
      {order.indicaciones && <p className="text-[13px] text-muted-foreground">{order.indicaciones}</p>}
    </li>
  );
}

function AttentionDetail({ cita, records, recordsLoading, onBack }: { cita: Cita; records: ClinicalRecord[]; recordsLoading: boolean; onBack: () => void }) {
  const ordersQuery = useQuery({
    queryKey: ["ordenes", cita.admisionId],
    queryFn: () => fetchAdmissionOrders(cita.admisionId!),
    enabled: !!cita.admisionId,
  });
  const orders = ordersQuery.data ?? [];

  return (
    <article aria-label="Atención" className="min-w-0">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-5 pb-3.5 pt-4 md:px-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-1 h-8 gap-1.5 px-2 text-[13px] text-muted-foreground md:hidden">
          <ArrowLeft className="h-4 w-4" />Atenciones
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-snug text-foreground">
              {dayOf(cita)}, {localTime(cita.inicio)} – {localTime(cita.fin)}
            </h3>
            <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground">
              <span>{cita.profesional}</span>
              <span>{cita.servicio ?? MODALITY_LABEL[cita.modalidad]}</span>
              <StateText state={cita.estado} />
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-[13px]">
            <Link to={`/app/citas/${cita.id}`}>Ver cita</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-8 px-5 py-5 md:px-6">
        <section aria-label="Formatos" className="grid gap-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Formatos diligenciados</h4>
          {!cita.admisionId ? (
            <p className="text-sm text-muted-foreground">Esta cita no tiene atención asociada.</p>
          ) : recordsLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {WITH_RECORDS.has(cita.estado) ? "Aún no hay formatos guardados en esta atención." : "La atención no se ha iniciado."}
            </p>
          ) : (
            records.map((r) => <FormatRecord key={r.id} record={r} />)
          )}
        </section>

        {cita.admisionId && (
          <section aria-label="Órdenes" className="grid gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Órdenes</h4>
            {ordersQuery.isLoading ? (
              <Skeleton className="h-16 rounded-xl" />
            ) : ordersQuery.isError ? (
              <p className="text-sm text-destructive">No se pudieron cargar las órdenes: {errorMessage(ordersQuery.error)}</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No se dieron órdenes en esta atención.</p>
            ) : (
              <ul className="grid">{orders.map((o) => <OrderRow key={o.id} order={o} />)}</ul>
            )}
          </section>
        )}
      </div>
    </article>
  );
}

/**
 * Atenciones del paciente (maestro-detalle): a la izquierda sus citas, de la más
 * reciente a la más antigua; a la derecha lo que quedó de la elegida: cada formato
 * con su estructura y las órdenes. Es lo mismo que el profesional ve en la app.
 */
export function PatientAttentions({
  citas,
  records,
  recordsLoading,
  initialCitaId,
}: {
  citas: Cita[];
  records: ClinicalRecord[];
  recordsLoading: boolean;
  initialCitaId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialCitaId ?? null);
  const [showDetailOnPhone, setShowDetailOnPhone] = useState(!!initialCitaId);
  const selected = citas.find((c) => c.id === selectedId) ?? defaultCita(citas);

  if (citas.length === 0) {
    return <p className="px-6 py-16 text-center text-sm text-muted-foreground">Este paciente aún no tiene citas en la agenda.</p>;
  }

  const ofSelected = selected?.admisionId
    ? records.filter((r) => r.response.admision_id === selected.admisionId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    : [];

  return (
    <div className="grid md:h-full md:grid-cols-[320px_minmax(0,1fr)]">
      <div className={cn("min-h-0 md:overflow-y-auto md:border-r md:border-border", showDetailOnPhone && selected && "hidden md:block")}>
        <div role="listbox" aria-label="Atenciones" className="grid gap-0.5 p-2">
          {citas.map((c) => (
            <CitaRow
              key={c.id}
              cita={c}
              selected={c.id === selected?.id}
              onSelect={() => {
                setSelectedId(c.id);
                setShowDetailOnPhone(true);
              }}
            />
          ))}
        </div>
      </div>
      <div className={cn("min-w-0 md:overflow-y-auto", !(showDetailOnPhone && selected) && "hidden md:block")}>
        {selected && (
          <AttentionDetail key={selected.id} cita={selected} records={ofSelected} recordsLoading={recordsLoading} onBack={() => setShowDetailOnPhone(false)} />
        )}
      </div>
    </div>
  );
}
