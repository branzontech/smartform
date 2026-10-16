import { describe, expect, it } from "vitest";
import { summaryItems } from "./summary";
import type { QuestionData } from "./types";

const q = (over: Partial<QuestionData>): QuestionData => ({ id: "q", title: "Pregunta", type: "short", ...over }) as QuestionData;

describe("summaryItems", () => {
  it("conserva las secciones con respuestas y omite las vacías", () => {
    const questions = [
      q({ id: "s1", type: "section", title: "Antecedentes" }),
      q({ id: "a", title: "Motivo" }),
      q({ id: "s2", type: "section", title: "Examen físico" }),
      q({ id: "b", title: "Vacía" }),
    ];
    expect(summaryItems(questions, { a: "Dolor lumbar" })).toEqual([
      { kind: "section", id: "s1", title: "Antecedentes" },
      { kind: "answer", id: "a", label: "Motivo", value: "Dolor lumbar" },
    ]);
  });

  it("entrega los signos vitales como lecturas, con la tensión en una sola", () => {
    const [item] = summaryItems([q({ id: "v", type: "vitals", title: "" })], { v_systolic_bp: "120", v_diastolic_bp: "80", v_heart_rate: "72" });
    expect(item).toMatchObject({ kind: "vitals", label: "Signos vitales" });
    expect(item.kind === "vitals" && item.readings.map((r) => `${r.label} ${r.value}`)).toEqual(["F. Cardíaca 72", "Tensión arterial 120/80"]);
  });

  it("incluye los signos personalizados", () => {
    const question = q({ id: "v", type: "vitals", customVitals: [{ id: "glu", label: "Glucometría", unit: "mg/dL" }] } as Partial<QuestionData>);
    const [item] = summaryItems([question], { v_custom_glu: "110" });
    expect(item.kind === "vitals" && item.readings).toEqual([{ key: "glu", label: "Glucometría", value: "110", unit: "mg/dL" }]);
  });

  it("muestra diagnósticos por código y la firma como Firmado", () => {
    const questions = [q({ id: "d", type: "diagnosis", title: "Diagnóstico" }), q({ id: "f", type: "signature", title: "Firma" })];
    const items = summaryItems(questions, { d: [{ codigo: "I10", descripcion: "Hipertensión esencial" }], f: "data:image/png;base64,AAA" });
    expect(items.map((i) => i.kind === "answer" && i.value)).toEqual(["I10 Hipertensión esencial", "Firmado"]);
  });
});
