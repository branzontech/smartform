import { describe, expect, it } from "vitest";
import type { QuestionData } from "./question/types";
import { carryOverAnswers } from "./carry-over";

const q = (id: string, type: string, title: string): QuestionData => ({ id, type, title, required: false });

describe("carryOverAnswers", () => {
  const from = [
    q("hc_motivo", "paragraph", "Motivo de consulta"),
    q("hc_alergias", "paragraph", "Alergias"),
    q("hc_alergias_estado", "multiple", "¿Alergias conocidas?"),
    q("hc_sv", "vitals", "Signos vitales"),
    q("hc_firma", "signature", "Firma del profesional"),
    q("hc_dolor", "short", "Intensidad del dolor"),
  ];
  const data = {
    hc_motivo: "Dolor lumbar",
    hc_alergias: "Niega",
    hc_alergias_estado: "No refiere",
    hc_sv_heart_rate: "78",
    hc_sv_temperature: "36.6",
    hc_firma: "data:image/png;base64,xx",
    hc_dolor: "",
  };

  it("carries fields with the same id and type", () => {
    const to = [q("hc_motivo", "paragraph", "Motivo de consulta"), q("hc_alergias", "paragraph", "Alergias")];
    expect(carryOverAnswers(from, data, to).data).toEqual({ hc_motivo: "Dolor lumbar", hc_alergias: "Niega" });
  });

  it("does not treat a sibling question as a part of another", () => {
    const to = [q("hc_alergias", "paragraph", "Alergias")];
    expect(carryOverAnswers(from, data, to).data).toEqual({ hc_alergias: "Niega" });
  });

  it("matches by title (ignoring accents and spacing) and renames composite parts", () => {
    const to = [q("fisio_sv", "vitals", "Signos  Vítales")];
    const { data: out, carried } = carryOverAnswers(from, data, to);
    expect(out).toEqual({ fisio_sv_heart_rate: "78", fisio_sv_temperature: "36.6" });
    expect(carried).toEqual(["Signos  Vítales"]);
  });

  it("never carries the signature, empty answers or fields of another type", () => {
    const to = [q("hc_firma", "signature", "Firma del profesional"), q("hc_dolor", "short", "Intensidad del dolor"), q("hc_motivo", "short", "Motivo de consulta")];
    expect(carryOverAnswers(from, data, to).data).toEqual({});
  });
});
