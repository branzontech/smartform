import React, { useMemo, useCallback } from "react";
import { QuestionData, PredefinedVital, CustomVital } from "../question/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const VITAL_ORDER = [
  "heart_rate", "respiratory_rate", "systolic_bp", "diastolic_bp",
  "temperature", "weight", "height", "bmi",
  "mean_arterial_pressure", "body_surface_area", "oxygen_saturation",
];

const DEFAULT_PREDEFINED_VITALS: Record<string, PredefinedVital> = {
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

// BMI classification (WHO)
const BMI_RANGES = [
  { max: 18.5, label: "Bajo peso", color: "text-blue-600" },
  { max: 24.9, label: "Normal", color: "text-green-600" },
  { max: 29.9, label: "Sobrepeso", color: "text-yellow-600" },
  { max: 34.9, label: "Obesidad grado I", color: "text-orange-600" },
  { max: 39.9, label: "Obesidad grado II", color: "text-red-600" },
  { max: Infinity, label: "Obesidad grado III", color: "text-red-700" },
];

function getBmiClassification(bmi: number): { label: string; color: string } | null {
  if (!bmi || bmi <= 0) return null;
  for (const r of BMI_RANGES) {
    if (bmi <= r.max) return r;
  }
  return null;
}

interface VitalsViewerProps {
  question: QuestionData;
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
}

export const VitalsViewer: React.FC<VitalsViewerProps> = ({ question, formData, onChange }) => {
  const predefinedVitals = question.predefinedVitals || DEFAULT_PREDEFINED_VITALS;
  const customVitals = question.customVitals || [];
  const columns = question.layout?.columns || 3;
  const showBmiClassification = question.showBmiClassification ?? true;
  const qId = question.id;

  // Get vital value helper
  const getVal = useCallback((key: string): number => {
    return parseFloat(formData[`${qId}_${key}`]) || 0;
  }, [formData, qId]);

  // Compute calculated fields
  const calculatedValues = useMemo(() => {
    const vals: Record<string, number | null> = {};
    const w = getVal("weight");
    const h = getVal("height");

    // BMI
    if (predefinedVitals.bmi?.enabled && w > 0 && h > 0) {
      vals.bmi = w / (h * h);
    }
    // MAP
    const sys = getVal("systolic_bp");
    const dia = getVal("diastolic_bp");
    if (predefinedVitals.mean_arterial_pressure?.enabled && sys > 0 && dia > 0) {
      vals.mean_arterial_pressure = (sys + 2 * dia) / 3;
    }
    // BSA
    if (predefinedVitals.body_surface_area?.enabled && w > 0 && h > 0) {
      vals.body_surface_area = 0.007184 * Math.pow(w, 0.425) * Math.pow(h * 100, 0.725);
    }
    return vals;
  }, [getVal, predefinedVitals]);

  const enabledVitals = VITAL_ORDER.filter(k => predefinedVitals[k]?.enabled);

  const bmiValue = calculatedValues.bmi;
  const bmiClass = (showBmiClassification && bmiValue) ? getBmiClassification(bmiValue) : null;

  const handleChange = (key: string, value: string) => {
    onChange(`${qId}_${key}`, value);
  };

  return (
    <div className="space-y-1">
      {/* Section title */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
          {question.title || "Examen Físico"}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Grid of vitals */}
      <div
        className="gap-x-6 gap-y-3"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {enabledVitals.map((key) => {
          const v = predefinedVitals[key];
          const isCalc = !!v.calculated;
          const calcVal = calculatedValues[key];

          // Special: T/A as combined systolic/diastolic
          if (key === "systolic_bp") {
            const diaEnabled = predefinedVitals.diastolic_bp?.enabled;
            if (diaEnabled) {
              return (
                <div key={key} className="flex flex-col">
                  <label className="text-xs text-muted-foreground mb-0.5">T/A</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={formData[`${qId}_systolic_bp`] || ""}
                      onChange={(e) => handleChange("systolic_bp", e.target.value)}
                      placeholder="—"
                      className="flex-1 bg-transparent border-0 border-b border-border/60 focus:border-primary focus:outline-none py-1 text-sm tabular-nums text-center"
                    />
                    <span className="text-muted-foreground text-sm">/</span>
                    <input
                      type="number"
                      value={formData[`${qId}_diastolic_bp`] || ""}
                      onChange={(e) => handleChange("diastolic_bp", e.target.value)}
                      placeholder="—"
                      className="flex-1 bg-transparent border-0 border-b border-border/60 focus:border-primary focus:outline-none py-1 text-sm tabular-nums text-center"
                    />
                    <span className="text-xs text-muted-foreground ml-0.5">mmHg</span>
                  </div>
                </div>
              );
            }
          }

          // Skip diastolic_bp when rendered combined with systolic
          if (key === "diastolic_bp" && predefinedVitals.systolic_bp?.enabled) {
            return null;
          }

          if (isCalc) {
            const displayVal = calcVal != null ? calcVal.toFixed(key === "bmi" ? 1 : key === "body_surface_area" ? 3 : 0) : "—";
            return (
              <div key={key} className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-0.5">{v.label}</label>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold tabular-nums py-1">{displayVal}</span>
                  <span className="text-xs text-muted-foreground">{v.unit}</span>
                </div>
                {key === "bmi" && bmiClass && (
                  <span className={cn("text-[10px] font-medium mt-0.5", bmiClass.color)}>
                    {bmiClass.label}
                  </span>
                )}
              </div>
            );
          }

          return (
            <div key={key} className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-0.5">{v.label}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  value={formData[`${qId}_${key}`] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="—"
                  className="flex-1 bg-transparent border-0 border-b border-border/60 focus:border-primary focus:outline-none py-1 text-sm tabular-nums"
                />
                <span className="text-xs text-muted-foreground shrink-0">{v.unit}</span>
              </div>
            </div>
          );
        })}

        {/* Custom vitals */}
        {customVitals.map((cv) => {
          if (cv.calculated) {
            return (
              <div key={cv.id} className="flex flex-col">
                <label className="text-xs text-muted-foreground mb-0.5">{cv.label}</label>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold tabular-nums py-1 bg-slate-50/50">Auto</span>
                  <span className="text-xs text-muted-foreground">{cv.unit}</span>
                </div>
              </div>
            );
          }
          return (
            <div key={cv.id} className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-0.5">{cv.label}</label>
              <div className="flex items-center gap-1">
                <input
                  type={cv.valueType === "number" ? "number" : "text"}
                  step="any"
                  value={formData[`${qId}_custom_${cv.id}`] || ""}
                  onChange={(e) => onChange(`${qId}_custom_${cv.id}`, e.target.value)}
                  placeholder="—"
                  className="flex-1 bg-transparent border-0 border-b border-border/60 focus:border-primary focus:outline-none py-1 text-sm tabular-nums"
                />
                <span className="text-xs text-muted-foreground shrink-0">{cv.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
