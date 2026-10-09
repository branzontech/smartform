import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/integrations/data/client";
import { maxScoreOf } from "../form-viewer/score-total-viewer";
import type { QuestionData } from "../question/types";
import type { Admission, ClinicalRecord, FormResponse, Provenance, ScoreSummary } from "./types";

const RESPONSE_COLUMNS =
  "id, formulario_id, formulario_version, admision_id, medico_id, datos_respuesta, fhir_extensions, created_at, estado_registro, formularios(titulo, tipo, preguntas)";

export const recordsKey = (patientId: string) => ["records-history", patientId] as const;

async function fetchResponses(patientId: string): Promise<FormResponse[]> {
  const { data, error } = await db
    .from("respuestas_formularios")
    .select(RESPONSE_COLUMNS)
    .eq("paciente_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FormResponse[];
}

async function fetchAdmissions(patientId: string): Promise<Admission[]> {
  const { data, error } = await db
    .from("admisiones")
    .select("id, numero_ingreso, fecha_inicio, estado, profesional_nombre")
    .eq("paciente_id", patientId);
  if (error) throw error;
  return (data ?? []) as unknown as Admission[];
}

/** Nombre de cada profesional por su usuario (medico_id y usuario de la bitácora). */
export async function fetchProfessionalNames(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const { data, error } = await db.from("profiles").select("user_id, full_name").in("user_id", userIds);
  if (error) throw error;
  return Object.fromEntries(((data ?? []) as { user_id: string; full_name: string | null }[]).map((p) => [p.user_id, p.full_name ?? ""]));
}

interface FormVersion { formulario_id: string; version: number; preguntas: QuestionData[] | null }

/** Fotos de las versiones de los formatos usados: cada registro se lee con las preguntas con que se diligenció. */
async function fetchVersions(formIds: string[]): Promise<FormVersion[]> {
  if (formIds.length === 0) return [];
  const { data, error } = await db.from("formularios_versiones").select("formulario_id, version, preguntas").in("formulario_id", formIds);
  if (error) throw error;
  return (data ?? []) as unknown as FormVersion[];
}

async function fetchProvenance(responseIds: string[]): Promise<Provenance[]> {
  if (responseIds.length === 0) return [];
  const { data, error } = await db
    .from("provenance_clinico")
    .select("id, target_record_id, activity_type, agent_nombre_completo, recorded_at, reason_text")
    .eq("target_table", "respuestas_formularios")
    .in("target_record_id", responseIds)
    .order("recorded_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Provenance[];
}

/** Resultado de la primera escala con puntaje total del formato. */
function scoreOf(questions: QuestionData[], data: Record<string, unknown>): ScoreSummary | null {
  const total = questions.find((q) => q.type === "score_total");
  const saved = total ? (data[total.id] as { score?: number; interpretation?: string } | undefined) : undefined;
  if (!total || typeof saved?.score !== "number") return null;
  const score = saved.score;
  const max = (total.sourceQuestionIds ?? []).reduce((sum, id) => sum + maxScoreOf(questions.find((q) => q.id === id)), 0);
  const range = total.scoring?.enabled ? total.scoring.ranges?.find((r) => score >= r.min && score <= r.max) : undefined;
  return { value: score, max: max || null, label: saved.interpretation ?? range?.label ?? "", color: range?.color ?? null };
}

/** Texto plano de las respuestas para la búsqueda (sin firmas ni archivos en base64). */
function contentOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.startsWith("data:") ? "" : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(contentOf).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(contentOf).join(" ");
  return "";
}

const dayLabel = (d: Date) => format(d, "d MMM yyyy", { locale: es });

function groupOf(r: FormResponse, admission: Admission | null, firstOfConsultation: Map<string, Date>) {
  const consultationId = typeof r.fhir_extensions?.consulta_id === "string" ? r.fhir_extensions.consulta_id : null;
  if (admission) {
    return { key: `a:${admission.id}`, label: `Ingreso ${admission.numero_ingreso ? `#${admission.numero_ingreso} ` : ""}· ${dayLabel(new Date(admission.fecha_inicio))}` };
  }
  if (consultationId) {
    return { key: `c:${consultationId}`, label: `Consulta · ${dayLabel(firstOfConsultation.get(consultationId) ?? new Date(r.created_at))}` };
  }
  const day = new Date(r.created_at);
  return { key: `d:${format(day, "yyyy-MM-dd")}`, label: `Registros del ${dayLabel(day)}` };
}

/**
 * Registros clínicos del paciente para el historial: cada respuesta con su
 * profesional, su atención (consulta, ingreso o día), su estado y su puntaje.
 */
export function useRecordsHistory(patientId: string) {
  const responsesQuery = useQuery({ queryKey: recordsKey(patientId), queryFn: () => fetchResponses(patientId) });
  const admissionsQuery = useQuery({ queryKey: ["records-history-admissions", patientId], queryFn: () => fetchAdmissions(patientId) });
  const responses = responsesQuery.data;

  const doctorIds = useMemo(() => [...new Set((responses ?? []).map((r) => r.medico_id).filter((id): id is string => !!id))].sort(), [responses]);
  const namesQuery = useQuery({
    queryKey: ["professional-names", doctorIds],
    queryFn: () => fetchProfessionalNames(doctorIds),
    enabled: doctorIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const formIds = useMemo(() => [...new Set((responses ?? []).map((r) => r.formulario_id))].sort(), [responses]);
  const versionsQuery = useQuery({
    queryKey: ["form-versions", formIds],
    queryFn: () => fetchVersions(formIds),
    enabled: formIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const responseIds = useMemo(() => (responses ?? []).map((r) => r.id), [responses]);
  const provenanceQuery = useQuery({
    queryKey: ["records-history-provenance", patientId, responseIds],
    queryFn: () => fetchProvenance(responseIds),
    enabled: responseIds.length > 0,
  });

  const records = useMemo<ClinicalRecord[]>(() => {
    const admissions = new Map((admissionsQuery.data ?? []).map((a) => [a.id, a]));
    const names = namesQuery.data ?? {};
    const versions = new Map((versionsQuery.data ?? []).map((v) => [`${v.formulario_id}:${v.version}`, v.preguntas ?? []]));
    // La consulta se fecha por su primer registro.
    const firstOfConsultation = new Map<string, Date>();
    for (const r of responses ?? []) {
      const id = r.fhir_extensions?.consulta_id;
      if (typeof id !== "string") continue;
      const at = new Date(r.created_at);
      const prev = firstOfConsultation.get(id);
      if (!prev || at < prev) firstOfConsultation.set(id, at);
    }
    return (responses ?? []).map((r) => {
      const version = r.formulario_version ?? 1;
      const questions = versions.get(`${r.formulario_id}:${version}`) ?? r.formularios?.preguntas ?? [];
      const data = r.datos_respuesta ?? {};
      const admission = r.admision_id ? admissions.get(r.admision_id) ?? null : null;
      const group = groupOf(r, admission, firstOfConsultation);
      const fallbackName = typeof data._profesional_nombre === "string" ? data._profesional_nombre : admission?.profesional_nombre;
      return {
        id: r.id,
        title: r.formularios?.titulo || "Registro clínico",
        isClinicalHistory: r.formularios?.tipo === "historia_clinica",
        version,
        createdAt: new Date(r.created_at),
        professional: (r.medico_id && names[r.medico_id]) || fallbackName || "Sin profesional",
        state: r.estado_registro ?? "active",
        groupKey: group.key,
        groupLabel: group.label,
        score: scoreOf(questions, data),
        content: contentOf(data),
        questions,
        data,
        admission,
        response: r,
      };
    });
  }, [responses, admissionsQuery.data, namesQuery.data, versionsQuery.data]);

  const provenanceByRecord = useMemo(() => {
    const map: Record<string, Provenance[]> = {};
    for (const p of provenanceQuery.data ?? []) (map[p.target_record_id] ??= []).push(p);
    return map;
  }, [provenanceQuery.data]);

  return {
    records,
    provenanceByRecord,
    isLoading: responsesQuery.isLoading || admissionsQuery.isLoading || versionsQuery.isLoading,
    error: responsesQuery.error ?? admissionsQuery.error,
  };
}
