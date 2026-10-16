import { bloodPressureState, vitalRangeState, vitalReadings, type VitalState } from "@kerhub/core/forms";
import type { QuestionData } from "@/components/forms/question/types";
import { storedAnswer } from "@/components/forms/form-viewer/stored-answer";
import type { ClinicalRecord } from "@/components/forms/registros/types";

/** Preguntas de la historia clínica base que alimentan el resumen del paciente. */
const ALLERGY_STATUS_ID = "hc_alergias_estado";
const ALLERGY_DETAIL_ID = "hc_alergias";
/** Diagnósticos y signos que se muestran a la vista (los demás están en la atención). */
const MAX_DIAGNOSES = 4;
const MAX_VITALS = 4;
const RAIL_VITALS = ["systolic_bp", "heart_rate", "oxygen_saturation", "temperature", "respiratory_rate"];

export interface Allergies {
  /** Lo que respondió el profesional: «Sí», «No refiere» o «Desconoce». */
  status: string;
  detail: string | null;
  at: Date;
}

export interface Diagnosis {
  code: string;
  name: string;
}

export interface VitalSnapshot {
  key: string;
  label: string;
  value: string;
  unit: string;
  state: VitalState | null;
}

export interface ClinicalSnapshot {
  allergies: Allergies | null;
  diagnoses: Diagnosis[];
  vitals: { at: Date; readings: VitalSnapshot[] } | null;
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function allergiesOf(r: ClinicalRecord): Allergies | null {
  const status = text(r.data[ALLERGY_STATUS_ID]);
  if (!status) return null;
  return { status, detail: text(r.data[ALLERGY_DETAIL_ID]) || null, at: r.createdAt };
}

function diagnosesOf(r: ClinicalRecord): Diagnosis[] {
  return r.questions
    .filter((q) => q.type === "diagnosis")
    .flatMap((q) => (Array.isArray(r.data[q.id]) ? (r.data[q.id] as Record<string, unknown>[]) : []))
    .map((d) => ({ code: text(d.codigo ?? d.code), name: text(d.descripcion ?? d.name) }))
    .filter((d) => d.code);
}

function stateOf(key: string, value: string): VitalState | null {
  if (key === "systolic_bp") {
    const [sys, dia] = value.split("/").map(Number);
    return bloodPressureState(sys || 0, dia || 0);
  }
  return vitalRangeState(key, Number(value) || 0);
}

function vitalsOf(r: ClinicalRecord): VitalSnapshot[] {
  const q = r.questions.find((x: QuestionData) => x.type === "vitals");
  if (!q) return [];
  const parts = storedAnswer(q, r.data);
  const readings = vitalReadings(q, parts && typeof parts === "object" ? (parts as Record<string, unknown>) : {});
  return readings
    .filter((v) => RAIL_VITALS.includes(v.key))
    .sort((a, b) => RAIL_VITALS.indexOf(a.key) - RAIL_VITALS.indexOf(b.key))
    .slice(0, MAX_VITALS)
    .map((v) => ({ ...v, state: stateOf(v.key, v.value) }));
}

/**
 * Lo esencial del paciente sacado de sus registros vigentes, del más reciente
 * al más antiguo: alergias, diagnósticos de la última atención que los tenga y
 * los últimos signos vitales. Lo que nunca se ha registrado queda en null o vacío.
 */
export function clinicalSnapshot(records: ClinicalRecord[]): ClinicalSnapshot {
  const vigentes = records.filter((r) => r.state === "active").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  let allergies: Allergies | null = null;
  let diagnoses: Diagnosis[] = [];
  let vitals: ClinicalSnapshot["vitals"] = null;
  for (const r of vigentes) {
    allergies ??= allergiesOf(r);
    if (diagnoses.length === 0) diagnoses = diagnosesOf(r).slice(0, MAX_DIAGNOSES);
    if (!vitals) {
      const readings = vitalsOf(r);
      if (readings.length) vitals = { at: r.createdAt, readings };
    }
    if (allergies && diagnoses.length && vitals) break;
  }
  return { allergies, diagnoses, vitals };
}
