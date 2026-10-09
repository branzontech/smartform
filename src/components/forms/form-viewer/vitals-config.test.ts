import { describe, expect, it } from "vitest";
import type { QuestionData } from "../question/types";
import { vitalReadings } from "./vitals-config";

const vitals: QuestionData = { id: "hc_signos_vitales", type: "vitals", title: "Signos vitales", required: true };

describe("vitalReadings", () => {
  it("joins blood pressure into one reading and keeps clinical order", () => {
    const readings = vitalReadings(vitals, { temperature: "36.6", systolic_bp: "120", diastolic_bp: "78", heart_rate: "78" });
    expect(readings.map((r) => r.key)).toEqual(["heart_rate", "systolic_bp", "temperature"]);
    expect(readings[1]).toEqual({ key: "systolic_bp", label: "Tensión arterial", value: "120/78", unit: "mmHg" });
  });

  it("shows height in centimetres when it was typed in centimetres", () => {
    expect(vitalReadings(vitals, { height: "172" })[0].unit).toBe("cm");
    expect(vitalReadings(vitals, { height: "1.72" })[0].unit).toBe("m");
  });

  it("skips empty values and adds custom vitals with their own label", () => {
    const q = { ...vitals, customVitals: [{ id: "glucometria", label: "Glucometría", unit: "mg/dL", valueType: "number" as const, calculated: false }] };
    const readings = vitalReadings(q, { heart_rate: "", glucometria: "98" });
    expect(readings).toEqual([{ key: "glucometria", label: "Glucometría", value: "98", unit: "mg/dL" }]);
  });
});
