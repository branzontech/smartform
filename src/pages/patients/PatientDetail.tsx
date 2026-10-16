import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarTabs } from "@/components/kit/table";
import { db } from "@/integrations/data/client";
import { fetchPatientCitas } from "@/components/agenda/agenda-api";
import { errorMessage } from "@/components/agenda/agenda-ui";
import { PatientSummary, type AdmissionSummaryRow } from "@/components/patients/PatientSummary";
import type { EditablePatientRow } from "@/components/patients/PatientEditForm";
import { PatientAttentions } from "@/components/patients/PatientAttentions";
import { RecordsHistory } from "@/components/forms/registros/RecordsHistory";
import { useRecordsHistory } from "@/components/forms/registros/useRecordsHistory";

type Tab = "atenciones" | "registros";

const patientKey = (id: string) => ["patient", id] as const;

async function fetchPatient(id: string): Promise<EditablePatientRow | null> {
  const { data, error } = await db.from("pacientes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as EditablePatientRow | null;
}

async function fetchAdmissions(id: string): Promise<AdmissionSummaryRow[]> {
  const { data, error } = await db
    .from("admisiones")
    .select("id, estado, fecha_inicio, motivo, diagnostico_principal")
    .eq("paciente_id", id)
    .order("fecha_inicio", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdmissionSummaryRow[];
}

function BackLink() {
  return (
    <Link to="/app/pacientes" className="inline-flex items-center gap-1.5 rounded-lg text-[13px] text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Pacientes
    </Link>
  );
}

/** Pestaña pedida en la URL (los enlaces viejos usan ?tab=consultations). */
const tabOf = (value: string | null): Tab => (value === "registros" ? "registros" : "atenciones");

/**
 * Ficha del paciente con datos reales: quién es (con edición), sus atenciones
 * (cada cita con los formatos diligenciados y las órdenes, lo mismo que se hace
 * desde la app) y el historial completo de registros clínicos.
 */
export default function PatientDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = tabOf(params.get("tab"));

  const patientQuery = useQuery({ queryKey: patientKey(id), queryFn: () => fetchPatient(id), enabled: !!id });
  const admissionsQuery = useQuery({ queryKey: ["patient", id, "admisiones"], queryFn: () => fetchAdmissions(id), enabled: !!id });
  const citasQuery = useQuery({ queryKey: ["agenda", "paciente", id], queryFn: () => fetchPatientCitas(id), enabled: !!id });
  const { records, isLoading: recordsLoading } = useRecordsHistory(id);

  const setTab = (next: Tab) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("tab", next);
        p.delete("cita");
        return p;
      },
      { replace: true },
    );

  if (patientQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 py-6" aria-busy="true">
        <BackLink />
        <Skeleton className="h-44 rounded-card" />
        <Skeleton className="h-[480px] rounded-card" />
      </div>
    );
  }

  const patient = patientQuery.data;
  if (patientQuery.isError || !patient) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 py-6">
        <BackLink />
        <div className="rounded-card bg-card px-6 py-12 text-center shadow-card">
          <h1 className="text-lg font-semibold text-foreground">{patientQuery.isError ? "No se pudo cargar el paciente" : "Paciente no encontrado"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patientQuery.isError ? errorMessage(patientQuery.error) : "No existe o no pertenece a tu institución."}
          </p>
        </div>
      </div>
    );
  }

  const citas = citasQuery.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink />
        <Button size="sm" className="rounded-lg" onClick={() => navigate(`/app/pacientes/nueva-consulta?patientId=${patient.id}`)}>
          Nueva atención
        </Button>
      </div>

      <PatientSummary
        patient={patient}
        admissions={admissionsQuery.data ?? []}
        onUpdated={(updated) => queryClient.setQueryData<EditablePatientRow | null>(patientKey(id), updated)}
      />

      <div className="space-y-3">
        <BarTabs
          label="Historia del paciente"
          tabs={[
            { id: "atenciones", title: "Atenciones", count: citasQuery.isLoading ? undefined : citas.length },
            { id: "registros", title: "Registros clínicos", count: recordsLoading ? undefined : records.length },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="overflow-hidden rounded-card bg-card shadow-card dark:border dark:border-border dark:shadow-none md:h-[calc(100vh-180px)] md:min-h-[520px]">
          {tab === "registros" ? (
            <RecordsHistory patientId={patient.id} />
          ) : citasQuery.isLoading ? (
            <div className="grid gap-2 p-4" aria-busy="true">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : citasQuery.isError ? (
            <p className="px-6 py-16 text-center text-sm text-destructive">No se pudieron cargar las atenciones: {errorMessage(citasQuery.error)}</p>
          ) : (
            <PatientAttentions citas={citas} records={records} recordsLoading={recordsLoading} initialCitaId={params.get("cita")} />
          )}
        </div>
      </div>
    </div>
  );
}
