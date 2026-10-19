import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Plus } from "lucide-react";
import { SurfaceCard } from "@/components/kit/surface";
import { SimpleTable, type SimpleColumn } from "@/components/kit/table/SimpleTable";
import { RowActions } from "@/components/kit/RowActions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MODALITY_LABEL, formatShortDay, localDay, localTime, type Cita } from "@/components/agenda/agenda-api";
import { PLAN_STATE_LABEL, fetchPlan, frequencyText } from "@/components/agenda/plans-api";
import { capitalizeFirst, errorMessage } from "@/components/agenda/agenda-ui";
import { StateText } from "@/components/agenda/StateText";
import { PlanCancelDialog } from "@/components/agenda/plan/PlanCancelDialog";
import { PlanChangeProDialog } from "@/components/agenda/plan/PlanChangeProDialog";
import { PlanExtendSheet } from "@/components/agenda/plan/PlanExtendSheet";

const PENDING = ["programada", "confirmada"];

function BackLink() {
  return (
    <Link to="/app/citas" className="inline-flex items-center gap-1.5 rounded-lg text-[13px] text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Agenda
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** Plan de sesiones: avance, cada sesión y lo que se hace con las que faltan. */
export default function PlanDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["agenda", "plan", id], queryFn: () => fetchPlan(id), enabled: !!id });
  const [extending, setExtending] = useState(false);
  const [changing, setChanging] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 py-6">
        <BackLink />
        <Skeleton className="h-8 w-72 rounded-lg" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 py-6">
        <BackLink />
        <p className="text-[13px] text-destructive">{query.isError ? errorMessage(query.error) : "No se encontró el plan."}</p>
      </div>
    );
  }

  const plan = query.data;
  const now = Date.now();
  const pending = plan.citas.filter((c) => PENDING.includes(c.estado) && Date.parse(c.inicio) > now);
  const attended = plan.citas.filter((c) => c.estado === "atendida").length;
  const next = pending[0];
  const cancelled = plan.estado === "cancelado";

  const columns: SimpleColumn<Cita>[] = [
    { id: "sesion", title: "Sesión", className: "w-20 tabular-nums", cell: (c) => c.planSesion ?? "—" },
    { id: "fecha", title: "Fecha", primary: true, className: "whitespace-nowrap", cell: (c) => capitalizeFirst(formatShortDay(localDay(c.inicio))) },
    { id: "hora", title: "Hora", className: "tabular-nums", cell: (c) => `${localTime(c.inicio)} – ${localTime(c.fin)}` },
    { id: "profesional", title: "Profesional", cell: (c) => c.profesional },
    { id: "estado", title: "Estado", cell: (c) => <StateText state={c.estado} /> },
    { id: "acciones", title: "", className: "w-12", cell: (c) => <RowActions name={`sesión ${c.planSesion}`} onView={() => navigate(`/app/citas/${c.id}`)} /> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 py-6">
      <BackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            <Link to={`/app/pacientes/${plan.pacienteId}`} className="hover:text-primary">
              {plan.paciente}
            </Link>
          </h1>
          <p className="text-[14px] text-muted-foreground">
            {plan.tipoCita ?? plan.motivo} · {frequencyText(plan.recurrencia)} · {MODALITY_LABEL[plan.modalidad]} · {PLAN_STATE_LABEL[plan.estado]}
          </p>
        </div>
        {!cancelled && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 gap-1.5 rounded-lg" onClick={() => setExtending(true)}>
              <Plus aria-hidden />
              Agregar sesiones
            </Button>
            {pending.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Más acciones"
                    title="Más acciones"
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl">
                  <DropdownMenuItem onSelect={() => setChanging(true)} className="text-[13px]">
                    Cambiar de profesional
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setCancelling(true)} className="text-[13px] text-destructive focus:text-destructive">
                    Cancelar las que faltan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      <SurfaceCard title="Avance">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat label="Sesiones" value={plan.citas.length} />
          <Stat label="Atendidas" value={attended} />
          <Stat label="Pendientes" value={pending.length} />
          <Stat label="Próxima" value={next ? `${capitalizeFirst(formatShortDay(localDay(next.inicio)))}, ${localTime(next.inicio)}` : "Ninguna"} />
        </dl>
        <p className="mt-4 text-[13px] text-muted-foreground">Motivo: {plan.motivo}</p>
      </SurfaceCard>

      <SimpleTable columns={columns} rows={plan.citas} rowKey={(c) => c.id} empty="El plan no tiene sesiones." />

      <PlanExtendSheet plan={plan} open={extending} onOpenChange={setExtending} />
      {pending.length > 0 && (
        <>
          <PlanChangeProDialog key={pending[0].id} planId={plan.id} modalidad={plan.modalidad} pending={pending} open={changing} onOpenChange={setChanging} />
          <PlanCancelDialog planId={plan.id} pending={pending.length} open={cancelling} onOpenChange={setCancelling} />
        </>
      )}
    </div>
  );
}
