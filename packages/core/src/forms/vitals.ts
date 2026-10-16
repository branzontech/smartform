import type { FormAnswers, PredefinedVital, QuestionData } from "./types";

export const VITAL_ORDER = [
  "heart_rate", "respiratory_rate", "systolic_bp", "diastolic_bp",
  "temperature", "weight", "height", "bmi",
  "mean_arterial_pressure", "body_surface_area", "oxygen_saturation",
];

export const DEFAULT_PREDEFINED_VITALS: Record<string, PredefinedVital> = {
  heart_rate: { enabled: true, label: "F. Cardíaca", unit: "/min", loinc: "8867-4" },
  respiratory_rate: { enabled: true, label: "F. Respiratoria", unit: "/min", loinc: "9279-1" },
  systolic_bp: { enabled: true, label: "T/A Sistólica", unit: "mmHg", loinc: "8480-6" },
  diastolic_bp: { enabled: true, label: "T/A Diastólica", unit: "mmHg", loinc: "8462-4" },
  temperature: { enabled: true, label: "Temperatura", unit: "°C", loinc: "8310-5" },
  weight: { enabled: true, label: "Peso", unit: "Kg", loinc: "29463-7" },
  height: { enabled: true, label: "Talla", unit: "m", loinc: "8302-2" },
  bmi: { enabled: true, label: "IMC", unit: "kg/m²", loinc: "39156-5", calculated: true, formula: "weight / (height * height)" },
  mean_arterial_pressure: { enabled: false, label: "TAM", unit: "mmHg", loinc: "8478-0", calculated: true, formula: "(systolic_bp + 2 * diastolic_bp) / 3" },
  body_surface_area: { enabled: false, label: "Sup. Corporal", unit: "m²", loinc: "3140-1", calculated: true, formula: "0.007184 * Math.pow(weight, 0.425) * Math.pow(height * 100, 0.725)" },
  oxygen_saturation: { enabled: true, label: "SaO2", unit: "%", loinc: "2708-6" },
};

/** Signos que se calculan a partir de otros (no se escriben). */
export const CALCULATED_VITALS = ["bmi", "mean_arterial_pressure", "body_surface_area"];

/** Decimales con que se muestra y guarda cada signo calculado. */
export const vitalDecimals = (key: string) => (key === "bmi" ? 1 : key === "body_surface_area" ? 3 : 0);

/** Configuración efectiva de los signos de una pregunta (la del formato o la predeterminada). */
export const vitalsConfig = (q: QuestionData) => q.predefinedVitals || DEFAULT_PREDEFINED_VITALS;

/** Valor numérico escrito para un signo (0 si está vacío o no es número). */
export const vitalNumber = (formData: FormAnswers, qId: string, key: string) => parseFloat(formData[`${qId}_${key}`]) || 0;

/**
 * Signos calculados. La talla se configura en metros, pero si llega en
 * centímetros (> 3) se convierte.
 */
export function calculateVitals(predefined: Record<string, PredefinedVital>, value: (key: string) => number): Record<string, number | null> {
  const vals: Record<string, number | null> = {};
  const w = value("weight");
  const rawH = value("height");
  const h = rawH > 3 ? rawH / 100 : rawH;
  if (predefined.bmi?.enabled && w > 0 && h > 0) vals.bmi = w / (h * h);
  const sys = value("systolic_bp");
  const dia = value("diastolic_bp");
  if (predefined.mean_arterial_pressure?.enabled && sys > 0 && dia > 0) vals.mean_arterial_pressure = (sys + 2 * dia) / 3;
  if (predefined.body_surface_area?.enabled && w > 0 && h > 0) {
    vals.body_surface_area = 0.007184 * Math.pow(w, 0.425) * Math.pow(h * 100, 0.725);
  }
  return vals;
}

/** Los calculados como se guardan con la respuesta: texto con sus decimales, o "" si faltan datos. */
export function calculatedVitalEntries(q: QuestionData, formData: FormAnswers): Record<string, string> {
  const config = vitalsConfig(q);
  const calc = calculateVitals(config, (key) => vitalNumber(formData, q.id, key));
  const out: Record<string, string> = {};
  for (const key of CALCULATED_VITALS) {
    if (!config[key]?.enabled) continue;
    const v = calc[key];
    out[`${q.id}_${key}`] = v != null ? v.toFixed(vitalDecimals(key)) : "";
  }
  return out;
}

/** Estado de un signo frente a su rango de referencia en adultos (se muestra en texto, nunca en puntos). */
export type VitalTone = "ok" | "warn" | "bad";
export interface VitalState {
  label: string;
  tone: VitalTone;
}

const VITAL_RANGES: Record<string, { lo: number; hi: number }> = {
  heart_rate: { lo: 60, hi: 100 },
  respiratory_rate: { lo: 12, hi: 20 },
  temperature: { lo: 36, hi: 37.5 },
  oxygen_saturation: { lo: 94, hi: 100 },
};

export function vitalRangeState(key: string, value: number): VitalState | null {
  const r = VITAL_RANGES[key];
  if (!r || !value) return null;
  if (value < r.lo) return { label: "Baja", tone: "warn" };
  if (value > r.hi) return { label: "Alta", tone: "bad" };
  return { label: "Normal", tone: "ok" };
}

export function bloodPressureState(sys: number, dia: number): VitalState | null {
  if (!sys || !dia) return null;
  if (sys >= 140 || dia >= 90) return { label: "Elevada", tone: "bad" };
  if (sys >= 130 || dia >= 85) return { label: "Limítrofe", tone: "warn" };
  if (sys < 90 || dia < 60) return { label: "Baja", tone: "warn" };
  return { label: "Normal", tone: "ok" };
}

/** Clasificación del IMC (OMS). `color` es el nombre del color del texto. */
export const BMI_RANGES = [
  { max: 18.5, label: "Bajo peso", color: "blue" },
  { max: 24.9, label: "Normal", color: "green" },
  { max: 29.9, label: "Sobrepeso", color: "yellow" },
  { max: 34.9, label: "Obesidad grado I", color: "orange" },
  { max: 39.9, label: "Obesidad grado II", color: "red" },
  { max: Infinity, label: "Obesidad grado III", color: "darkred" },
] as const;

export function bmiClassification(bmi: number): (typeof BMI_RANGES)[number] | null {
  if (!bmi || bmi <= 0) return null;
  return BMI_RANGES.find((r) => bmi <= r.max) ?? null;
}

export interface VitalReading {
  key: string;
  label: string;
  value: string;
  unit: string;
}

const filled = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== "";

/**
 * Signos vitales guardados, listos para leer o imprimir: en el orden clínico,
 * con la tensión arterial en una sola lectura y la talla en su unidad real
 * (quien escribe 172 la escribió en centímetros).
 */
export function vitalReadings(q: QuestionData, parts: Record<string, unknown>): VitalReading[] {
  const config = { ...DEFAULT_PREDEFINED_VITALS, ...(q.predefinedVitals ?? {}) };
  const out: VitalReading[] = [];
  for (const key of VITAL_ORDER) {
    if (key === "diastolic_bp") continue;
    if (key === "systolic_bp") {
      if (filled(parts.systolic_bp) || filled(parts.diastolic_bp)) {
        out.push({ key, label: "Tensión arterial", value: `${filled(parts.systolic_bp) ? parts.systolic_bp : "—"}/${filled(parts.diastolic_bp) ? parts.diastolic_bp : "—"}`, unit: "mmHg" });
      }
      continue;
    }
    if (!filled(parts[key])) continue;
    const value = String(parts[key]);
    const unit = key === "height" && Number(value) > 3 ? "cm" : config[key]?.unit ?? "";
    out.push({ key, label: config[key]?.label ?? key, value, unit });
  }
  for (const c of q.customVitals ?? []) {
    if (filled(parts[c.id])) out.push({ key: c.id, label: c.label, value: String(parts[c.id]), unit: c.unit });
  }
  return out;
}
