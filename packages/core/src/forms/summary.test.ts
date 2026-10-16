import { describe, expect, it } from "vitest";
import { answerLines } from "./summary";
import type { QuestionData } from "./types";

const q = (over: Partial<QuestionData>): QuestionData => ({ id: "q", title: "Pregunta", type: "short", ...over }) as QuestionData;

describe("answerLines", () => {
  it("omite secciones y preguntas sin respuesta", () => {
    const questions = [q({ id: "s", type: "section", title: "Antecedentes" }), q({ id: "a", title: "Motivo" }), q({ id: "b", title: "Vacía" })];
    expect(answerLines(questions, { a: "Dolor lumbar" })).toEqual([{ id: "a", label: "Motivo", value: "Dolor lumbar", long: false }]);
  });

  it("une la tensión arterial en una sola lectura", () => {
    const questions = [q({ id: "v", type: "vitals", title: "" })];
    const [line] = answerLines(questions, { v_systolic_bp: "120", v_diastolic_bp: "80", v_heart_rate: "72" });
    expect(line.label).toBe("Signos vitales");
    expect(line.value).toBe("F. Cardíaca 72 /min · Tensión arterial 120/80 mmHg");
  });

  it("marca los párrafos y diagnósticos como texto largo", () => {
    const questions = [q({ id: "p", type: "paragraph", title: "Evolución" }), q({ id: "d", type: "diagnosis", title: "Diagnóstico" })];
    const lines = answerLines(questions, { p: "Paciente estable", d: [{ codigo: "I10", descripcion: "Hipertensión esencial" }] });
    expect(lines.map((l) => [l.value, l.long])).toEqual([
      ["Paciente estable", true],
      ["I10 Hipertensión esencial", true],
    ]);
  });

  it("muestra la firma como Firmado, sin la imagen", () => {
    expect(answerLines([q({ id: "f", type: "signature", title: "Firma" })], { f: "data:image/png;base64,AAA" })[0].value).toBe("Firmado");
  });
});
