import type { PredefinedVital, QuestionData } from "../question/types";

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
