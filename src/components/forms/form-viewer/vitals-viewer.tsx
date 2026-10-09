import React, { useMemo, useCallback, useEffect } from "react";
import { QuestionData, PredefinedVital, CustomVital } from "../question/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_PREDEFINED_VITALS, VITAL_ORDER } from "./vitals-config";

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

/** Rangos de referencia en adultos: el estado se muestra en texto, nunca en puntos. */
const VITAL_RANGES: Record<string, { lo: number; hi: number }> = {
  heart_rate: { lo: 60, hi: 100 },
  respiratory_rate: { lo: 12, hi: 20 },
  temperature: { lo: 36, hi: 37.5 },
  oxygen_saturation: { lo: 94, hi: 100 },
};

const STATE_CLASS = { ok: "text-green-700 dark:text-green-400", warn: "text-orange-700 dark:text-orange-400", bad: "text-red-700 dark:text-red-400" };

function rangeState(key: string, value: number): { label: string; cls: string } | null {
  const r = VITAL_RANGES[key];
  if (!r || !value) return null;
  if (value < r.lo) return { label: "Baja", cls: STATE_CLASS.warn };
  if (value > r.hi) return { label: "Alta", cls: STATE_CLASS.bad };
  return { label: "Normal", cls: STATE_CLASS.ok };
}

function bloodPressureState(sys: number, dia: number): { label: string; cls: string } | null {
  if (!sys || !dia) return null;
  if (sys >= 140 || dia >= 90) return { label: "Elevada", cls: STATE_CLASS.bad };
  if (sys >= 130 || dia >= 85) return { label: "Limítrofe", cls: STATE_CLASS.warn };
  if (sys < 90 || dia < 60) return { label: "Baja", cls: STATE_CLASS.warn };
  return { label: "Normal", cls: STATE_CLASS.ok };
}

const Tile = ({ label, children, state, calculated }: { label: string; children: React.ReactNode; state?: { label: string; cls: string } | null; calculated?: boolean }) => (
  <div className={cn(
    "grid gap-0.5 rounded-[16px] border-[1.5px] border-transparent px-3.5 py-3 transition-colors focus-within:border-primary focus-within:bg-card",
    calculated ? "bg-primary/5" : "bg-[hsl(var(--field))]",
  )}>
    <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
    <div className="flex items-baseline gap-1.5">{children}</div>
    <span className={cn("min-h-[18px] text-xs font-bold", state?.cls)}>{state?.label}</span>
  </div>
);

const numberInput = "w-full min-w-0 bg-transparent p-0 text-[28px] font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const unitClass = "shrink-0 whitespace-nowrap text-[13px] text-muted-foreground";

export const VitalsViewer: React.FC<VitalsViewerProps> = ({ question, formData, onChange }) => {
  const predefinedVitals = question.predefinedVitals || DEFAULT_PREDEFINED_VITALS;
  const customVitals = question.customVitals || [];
  const showBmiClassification = question.showBmiClassification ?? true;
  const qId = question.id;

  const getVal = useCallback((key: string): number => {
    return parseFloat(formData[`${qId}_${key}`]) || 0;
  }, [formData, qId]);

  // Calculados. La talla se configura en metros, pero si llega en centímetros (> 3) se convierte.
  const calculatedValues = useMemo(() => {
    const vals: Record<string, number | null> = {};
    const w = getVal("weight");
    const rawH = getVal("height");
    const h = rawH > 3 ? rawH / 100 : rawH;
    if (predefinedVitals.bmi?.enabled && w > 0 && h > 0) vals.bmi = w / (h * h);
    const sys = getVal("systolic_bp");
    const dia = getVal("diastolic_bp");
    if (predefinedVitals.mean_arterial_pressure?.enabled && sys > 0 && dia > 0) vals.mean_arterial_pressure = (sys + 2 * dia) / 3;
    if (predefinedVitals.body_surface_area?.enabled && w > 0 && h > 0) {
      vals.body_surface_area = 0.007184 * Math.pow(w, 0.425) * Math.pow(h * 100, 0.725);
    }
    return vals;
  }, [getVal, predefinedVitals]);

  const decimalsOf = (key: string) => (key === "bmi" ? 1 : key === "body_surface_area" ? 3 : 0);

  // Los calculados se guardan con la respuesta (antes quedaban vacíos).
  useEffect(() => {
    for (const key of ["bmi", "mean_arterial_pressure", "body_surface_area"]) {
      if (!predefinedVitals[key]?.enabled) continue;
      const v = calculatedValues[key];
      const next = v != null ? v.toFixed(decimalsOf(key)) : "";
      if ((formData[`${qId}_${key}`] ?? "") !== next) onChange(`${qId}_${key}`, next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedValues]);

  const enabledVitals = VITAL_ORDER.filter(k => predefinedVitals[k]?.enabled);
  const bmiValue = calculatedValues.bmi;
  const bmiClass = (showBmiClassification && bmiValue) ? getBmiClassification(bmiValue) : null;

  const handleChange = (key: string, value: string) => onChange(`${qId}_${key}`, value);

  return (
    <div className="grid gap-2">
      <span className="kh-label">
        {question.title || "Signos vitales"}
        {question.required && <span className="ml-0.5 text-primary" aria-hidden="true">*</span>}
      </span>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
        {enabledVitals.map((key) => {
          const v = predefinedVitals[key];
          const inputId = `${qId}-${key}`;

          // Tensión arterial: sistólica y diastólica en una sola baldosa.
          if (key === "systolic_bp" && predefinedVitals.diastolic_bp?.enabled) {
            return (
              <Tile key={key} label="Tensión arterial" state={bloodPressureState(getVal("systolic_bp"), getVal("diastolic_bp"))}>
                <input
                  type="number" inputMode="numeric" aria-label="Tensión arterial sistólica"
                  value={formData[`${qId}_systolic_bp`] || ""}
                  onChange={(e) => handleChange("systolic_bp", e.target.value)}
                  placeholder="—" className={cn(numberInput, "w-[3.2ch] text-center")}
                />
                <span className="text-xl text-muted-foreground">/</span>
                <input
                  type="number" inputMode="numeric" aria-label="Tensión arterial diastólica"
                  value={formData[`${qId}_diastolic_bp`] || ""}
                  onChange={(e) => handleChange("diastolic_bp", e.target.value)}
                  placeholder="—" className={cn(numberInput, "w-[3.2ch] text-center")}
                />
                <span className={unitClass}>mmHg</span>
              </Tile>
            );
          }
          if (key === "diastolic_bp" && predefinedVitals.systolic_bp?.enabled) return null;

          if (v.calculated) {
            const calcVal = calculatedValues[key];
            return (
              <Tile key={key} label={`${v.label} · calculado`} calculated
                state={key === "bmi" && bmiClass ? { label: bmiClass.label, cls: bmiClass.color } : null}>
                <span className="text-[28px] font-bold tabular-nums text-foreground">
                  {calcVal != null ? calcVal.toFixed(decimalsOf(key)) : "—"}
                </span>
                <span className={unitClass}>{v.unit}</span>
              </Tile>
            );
          }

          return (
            <Tile key={key} label={v.label} state={rangeState(key, getVal(key))}>
              <input
                id={inputId} type="number" step="any" inputMode="decimal" aria-label={v.label}
                value={formData[`${qId}_${key}`] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="—" className={numberInput}
              />
              <span className={unitClass}>{v.unit}</span>
            </Tile>
          );
        })}

        {customVitals.map((cv) => (
          cv.calculated ? (
            <Tile key={cv.id} label={`${cv.label} · calculado`} calculated>
              <span className="text-[28px] font-bold tabular-nums text-muted-foreground">—</span>
              <span className={unitClass}>{cv.unit}</span>
            </Tile>
          ) : (
            <Tile key={cv.id} label={cv.label}>
              <input
                type={cv.valueType === "number" ? "number" : "text"} step="any" aria-label={cv.label}
                value={formData[`${qId}_custom_${cv.id}`] || ""}
                onChange={(e) => onChange(`${qId}_custom_${cv.id}`, e.target.value)}
                placeholder="—" className={numberInput}
              />
              <span className={unitClass}>{cv.unit}</span>
            </Tile>
          )
        ))}
      </div>
    </div>
  );
};
