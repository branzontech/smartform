import React, { useMemo, useCallback, useEffect } from "react";
import { QuestionData, PredefinedVital, CustomVital } from "../question/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_PREDEFINED_VITALS,
  VITAL_ORDER,
  bloodPressureState as bpState,
  bmiClassification,
  calculateVitals,
  vitalDecimals,
  vitalRangeState,
  type VitalState,
} from "@kerhub/core/forms/vitals";

/** Color del texto de la clasificación del IMC (OMS); la regla vive en el core. */
const BMI_TEXT: Record<string, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  yellow: "text-yellow-600",
  orange: "text-orange-600",
  red: "text-red-600",
  darkred: "text-red-700",
};

function getBmiClassification(bmi: number): { label: string; color: string } | null {
  const r = bmiClassification(bmi);
  return r ? { label: r.label, color: BMI_TEXT[r.color] } : null;
}

interface VitalsViewerProps {
  question: QuestionData;
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
}

/** Estado frente al rango de referencia (regla en el core): se muestra en texto, nunca en puntos. */
const STATE_CLASS = { ok: "text-green-700 dark:text-green-400", warn: "text-orange-700 dark:text-orange-400", bad: "text-red-700 dark:text-red-400" };

const withClass = (s: VitalState | null) => (s ? { label: s.label, cls: STATE_CLASS[s.tone] } : null);
const rangeState = (key: string, value: number) => withClass(vitalRangeState(key, value));
const bloodPressureState = (sys: number, dia: number) => withClass(bpState(sys, dia));

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

  // Calculados (IMC, TAM, superficie corporal): la fórmula vive en el core.
  const calculatedValues = useMemo(() => calculateVitals(predefinedVitals, getVal), [getVal, predefinedVitals]);

  const decimalsOf = vitalDecimals;

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
