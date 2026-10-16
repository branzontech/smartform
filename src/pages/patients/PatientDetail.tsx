import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderTabs, type FolderTab } from "@/components/kit/tabs/FolderTabs";
import { usePersistentState } from "@/components/kit/table/usePersistentState";
import { errorMessage } from "@/components/agenda/agenda-ui";
import { printRecords } from "@/components/forms/registros/print";
import { PatientRail, ageOf, fullName } from "@/components/patients/chart/PatientRail";
import { PatientProfileSheet } from "@/components/patients/chart/PatientProfileSheet";
import { ChartList } from "@/components/patients/chart/ChartList";
import { ChartDetail } from "@/components/patients/chart/ChartDetail";
import { usePatientChart } from "@/components/patients/chart/usePatientChart";
import { CHART_VIEWS, type ChartView } from "@/components/patients/chart/chart-model";
import { cn } from "@/lib/utils";

const TABS: FolderTab<ChartView>[] = [
  { id: "atenciones", title: "Atenciones", pinned: true },
  { id: "registros", title: "Registros", pinned: true },
  { id: "ordenes", title: "Órdenes", pinned: true },
];
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const card = "rounded-card bg-card shadow-card dark:border dark:border-border dark:shadow-none";
/** Estados en que una cita ya tiene algo que leer: se abre primero la más reciente así. */
const WITH_RECORDS = new Set(["en_atencion", "atendida"]);

function BackLink() {
  return (
    <Link to="/app/pacientes" className="inline-flex h-8 items-center gap-1.5 rounded-lg pr-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Pacientes
    </Link>
  );
}

/**
 * Ficha del paciente (convención aprobada el 2026-10-16, tomada de Epic, Elation,
 * athenaOne, HubSpot y Attio): la página no se desplaza; a la izquierda lo
 * esencial del paciente, plegable; a la derecha pestañas de carpeta con la línea
 * de tiempo (atenciones, registros u órdenes) y el detalle de lo elegido.
 */
export default function PatientDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const chart = usePatientChart(id);
  const [collapsed, setCollapsed] = usePersistentState<boolean>("patient.chart.railCollapsed", false, isBool);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(!!params.get("cita"));
  const [picked, setPicked] = useState<Partial<Record<ChartView, string>>>(() => ({ atenciones: params.get("cita") ?? undefined }));

  const tab = params.get("tab");
  const view: ChartView = CHART_VIEWS.includes(tab as ChartView) ? (tab as ChartView) : "atenciones";
  const setView = (next: ChartView) => {
    setShowDetail(false);
    setParams((prev) => { const p = new URLSearchParams(prev); p.set("tab", next); p.delete("cita"); return p; }, { replace: true });
  };

  const patient = chart.patientQuery.data;
  if (chart.patientQuery.isLoading) {
    return (
      <div className="flex h-full gap-3.5 overflow-hidden py-4" aria-busy="true">
        <Skeleton className="w-[300px] rounded-card" />
        <Skeleton className="flex-1 rounded-card" />
      </div>
    );
  }
  if (chart.patientQuery.isError || !patient) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-6">
        <BackLink />
        <div className={cn(card, "px-6 py-12 text-center")}>
          <h1 className="text-lg font-semibold text-foreground">{chart.patientQuery.isError ? "No se pudo cargar el paciente" : "Paciente no encontrado"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{chart.patientQuery.isError ? errorMessage(chart.patientQuery.error) : "No existe o no pertenece a tu institución."}</p>
        </div>
      </div>
    );
  }

  const defaults: Record<ChartView, string | undefined> = {
    atenciones: (chart.citas.find((c) => WITH_RECORDS.has(c.estado)) ?? chart.citas[0])?.id,
    registros: chart.records[0]?.id,
    ordenes: chart.orders[0]?.id,
  };
  const selectedId = picked[view] ?? defaults[view] ?? null;
  const age = ageOf(patient.fecha_nacimiento);
  const activeRecords = chart.records.filter((r) => r.state === "active");

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pb-5 pt-3 md:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <BackLink />
          {collapsed && (
            <span className="truncate text-sm font-semibold text-foreground animate-in fade-in">
              {fullName(patient)}
              <span className="font-normal text-muted-foreground">{age !== null ? ` · ${age} años` : ""} · {patient.tipo_documento} {patient.numero_documento}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={activeRecords.length === 0} onClick={() => void printRecords(activeRecords, { patientId: patient.id })} className="h-8 gap-1.5 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:text-foreground">
            <Printer className="h-4 w-4" />Imprimir historia
          </Button>
          <Button size="sm" onClick={() => navigate(`/app/pacientes/nueva-consulta?patientId=${patient.id}`)} className="ml-1 h-[34px] rounded-[11px] bg-highlight px-3.5 font-semibold text-highlight-foreground hover:bg-highlight/90 active:scale-[.97]">
            Nueva atención
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3.5 md:min-h-0 md:flex-1 md:flex-row">
        <aside aria-label="Paciente" className={cn(card, "shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(.32,.72,0,1)]", collapsed ? "md:w-16" : "md:w-[300px]")}>
          <PatientRail patient={patient} snapshot={chart.snapshot} next={chart.next} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onOpenProfile={() => setProfileOpen(true)} />
        </aside>

        <section aria-label="Historia del paciente" className="flex min-w-0 flex-col md:min-h-0 md:flex-1">
          <div className="mb-3 shrink-0">
            <FolderTabs id="patient.chart.tabs" label="Historia del paciente" tabs={TABS} active={view} onChange={setView} initialVisible={CHART_VIEWS} />
          </div>
          <div className={cn(card, "grid h-[72vh] overflow-hidden md:h-auto md:min-h-0 md:flex-1 md:grid-cols-[340px_minmax(0,1fr)]")}>
            <div className={cn("min-h-0 md:border-r md:border-border", showDetail && "hidden md:block")}>
              <ChartList
                view={view}
                citas={chart.citas}
                records={chart.records}
                orders={chart.orders}
                summaryOf={chart.summaryOf}
                selectedId={selectedId}
                onSelect={(sel) => { setPicked((p) => ({ ...p, [view]: sel })); setShowDetail(true); }}
              />
            </div>
            <div className={cn("min-h-0 min-w-0", !showDetail && "hidden md:block")}>
              <ChartDetail
                view={view}
                patientId={patient.id}
                selectedId={selectedId}
                citas={chart.citas}
                records={chart.records}
                orders={chart.orders}
                provenanceByRecord={chart.provenanceByRecord}
                recordsLoading={chart.recordsLoading}
                recordsOf={chart.recordsOf}
                onRecordsChanged={chart.refreshRecords}
                onBack={() => setShowDetail(false)}
              />
            </div>
          </div>
        </section>
      </div>

      <PatientProfileSheet patient={patient} open={profileOpen} onOpenChange={setProfileOpen} onUpdated={chart.setPatient} />
    </div>
  );
}
