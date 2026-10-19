import { describe, expect, it } from "vitest";
import { draftFromRecurrence, emptyNeed, emptyPlanDraft, invalidatesSlot, needMissing, planMissing, recurrenceOf } from "./wizard-model";

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

describe("plan de sesiones", () => {
  const PRO = "11111111-1111-4111-8111-111111111111";

  it("pide días, hora y profesional, inicio y cómo termina", () => {
    const draft = emptyPlanDraft("2026-10-26");
    expect(planMissing(draft)).toEqual(["los días de la semana"]);
    expect(planMissing({ ...draft, dias: { 1: { hora: "08:00", profesionalId: "" } } })).toEqual(["la hora y el profesional de cada día"]);
    expect(planMissing({ ...draft, frecuencia: "mensual" })).toEqual(["la hora y el profesional"]);
    const ready = { ...draft, dias: { 1: { hora: "08:00", profesionalId: PRO } } };
    expect(planMissing(ready)).toEqual([]);
    expect(planMissing({ ...ready, termina: "fecha", hasta: "2026-10-01" })).toEqual(["una fecha final posterior al inicio"]);
    expect(planMissing({ ...ready, sesiones: 0 })).toEqual(["entre 1 y 120 sesiones"]);
  });

  it("arma la regla semanal ordenada por día y la de cada N días con un solo turno", () => {
    const draft = {
      ...emptyPlanDraft("2026-10-26"),
      dias: { 5: { hora: "15:00", profesionalId: PRO }, 1: { hora: "08:00", profesionalId: PRO } },
    };
    expect(recurrenceOf(draft)).toEqual({
      frecuencia: "semanal", cadaDias: null, cadaSemanas: 1, desde: "2026-10-26", sesiones: 12, hasta: null,
      turnos: [{ dia: 1, hora: "08:00", profesionalId: PRO }, { dia: 5, hora: "15:00", profesionalId: PRO }],
    });
    const everyTwo = { ...draft, frecuencia: "cada_n_dias" as const, unico: { hora: "07:00", profesionalId: PRO }, termina: "fecha" as const, hasta: "2026-11-30" };
    expect(recurrenceOf(everyTwo)).toMatchObject({ cadaDias: 2, cadaSemanas: null, sesiones: null, hasta: "2026-11-30", turnos: [{ dia: null, hora: "07:00" }] });
  });
});

describe("draftFromRecurrence", () => {
  it("conserva la cadencia y los turnos y empieza en la fecha dada", () => {
    const PRO = "11111111-1111-4111-8111-111111111111";
    const draft = draftFromRecurrence(
      { frecuencia: "semanal", cadaSemanas: 2, turnos: [{ dia: 2, hora: "10:00", profesionalId: PRO }], desde: "2026-10-01", sesiones: 4 },
      "2026-12-01",
    );
    expect(draft).toMatchObject({ frecuencia: "semanal", cadaSemanas: 2, desde: "2026-12-01", dias: { 2: { hora: "10:00", profesionalId: PRO } } });
    expect(recurrenceOf(draft).turnos).toEqual([{ dia: 2, hora: "10:00", profesionalId: PRO }]);
  });
});
