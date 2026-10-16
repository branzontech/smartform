import { describe, expect, it } from "vitest";
import type { ClinicalRecord } from "@/components/forms/registros/types";
import type { QuestionData } from "@/components/forms/question/types";
import { clinicalSnapshot } from "./clinical-snapshot";

const HC: QuestionData[] = [
  { id: "hc_alergias_estado", type: "multiple", title: "¿Alergias conocidas?" },
  { id: "hc_alergias", type: "paragraph", title: "Alergias" },
  { id: "hc_signos_vitales", type: "vitals", title: "Signos vitales" },
  { id: "hc_diagnosticos", type: "diagnosis", title: "Diagnósticos" },
] as QuestionData[];

const record = (day: number, data: Record<string, unknown>, state: ClinicalRecord["state"] = "active") =>
  ({ id: `r${day}`, createdAt: new Date(2026, 9, day), state, questions: HC, data }) as unknown as ClinicalRecord;

describe("clinicalSnapshot", () => {
  it("sin registros no inventa nada", () => {
    expect(clinicalSnapshot([])).toEqual({ allergies: null, diagnoses: [], vitals: null });
  });

  it("toma las alergias, diagnósticos y signos del registro más reciente que los tenga", () => {
    const older = record(7, { hc_alergias_estado: "Sí", hc_alergias: "Penicilina: urticaria", hc_diagnosticos: [{ codigo: "I10", descripcion: "Hipertensión esencial" }] });
    const newer = record(16, { hc_signos_vitales_systolic_bp: "180", hc_signos_vitales_diastolic_bp: "90", hc_signos_vitales_heart_rate: "122" });
    const snap = clinicalSnapshot([older, newer]);
    expect(snap.allergies).toMatchObject({ status: "Sí", detail: "Penicilina: urticaria" });
    expect(snap.diagnoses).toEqual([{ code: "I10", name: "Hipertensión esencial" }]);
    expect(snap.vitals?.readings.map((v) => `${v.label} ${v.value}`)).toEqual(["Tensión arterial 180/90", "F. Cardíaca 122"]);
    expect(snap.vitals?.at).toEqual(new Date(2026, 9, 16));
  });

  it("ignora los registros anulados", () => {
    const anulado = record(20, { hc_alergias_estado: "Sí", hc_alergias: "Error" }, "entered-in-error");
    const vigente = record(10, { hc_alergias_estado: "No refiere" });
    expect(clinicalSnapshot([anulado, vigente]).allergies?.status).toBe("No refiere");
  });
});
