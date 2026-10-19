import { describe, expect, it } from "vitest";
import { emptyNeed, invalidatesSlot, needMissing } from "./wizard-model";

describe("needMissing", () => {
  it("pide el motivo cuando está vacío o es muy corto", () => {
    expect(needMissing(emptyNeed(""))).toEqual(["el motivo"]);
    expect(needMissing({ ...emptyNeed(""), motivo: " ab " })).toEqual(["el motivo"]);
  });

  it("queda listo con un motivo válido en sede", () => {
    expect(needMissing({ ...emptyNeed(""), motivo: "Control de tensión" })).toEqual([]);
  });

  it("exige la dirección solo en domicilio", () => {
    const need = { ...emptyNeed("  "), motivo: "Terapia", modalidad: "domicilio" as const };
    expect(needMissing(need)).toEqual(["la dirección"]);
    expect(needMissing({ ...need, direccion: "Calle 1 # 2-3" })).toEqual([]);
  });

  it("acepta telemedicina sin enlace pero rechaza un enlace que no es https", () => {
    const need = { ...emptyNeed(""), motivo: "Control", modalidad: "telemedicina" as const };
    expect(needMissing(need)).toEqual([]);
    expect(needMissing({ ...need, enlaceTelemedicina: "http://meet.example.com/x" })).toEqual(["un enlace que empiece por https://"]);
    expect(needMissing({ ...need, enlaceTelemedicina: "https://meet.example.com/x" })).toEqual([]);
  });
});

describe("invalidatesSlot", () => {
  const base = { ...emptyNeed(""), motivo: "Control" };

  it("invalida el cupo al cambiar tipo, modalidad o duración", () => {
    expect(invalidatesSlot(base, { ...base, tipoCitaId: "t1" })).toBe(true);
    expect(invalidatesSlot(base, { ...base, modalidad: "domicilio" })).toBe(true);
    expect(invalidatesSlot(base, { ...base, duracionMin: 45 })).toBe(true);
  });

  it("conserva el cupo si solo cambian textos o la prioridad", () => {
    expect(invalidatesSlot(base, { ...base, motivo: "Otro motivo", prioridad: "urgente" })).toBe(false);
  });
});
