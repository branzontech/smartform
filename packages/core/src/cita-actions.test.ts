import { describe, expect, it } from "vitest";
import { canMarkArrival } from "./cita-actions";

const base = { estado: "confirmada" as const, modalidad: "sede" as const, inicio: "2026-10-20T14:00:00Z", llegadaAt: null };

describe("canMarkArrival", () => {
  it("permite registrar la llegada en sede el día de la cita", () => {
    expect(canMarkArrival(base, "2026-10-20")).toBe(true);
    expect(canMarkArrival({ ...base, estado: "programada", modalidad: "telemedicina" }, "2026-10-20")).toBe(true);
  });

  it("no la permite otro día", () => {
    expect(canMarkArrival(base, "2026-10-19")).toBe(false);
  });

  it("no la permite en domicilio, ya registrada o con la atención iniciada", () => {
    expect(canMarkArrival({ ...base, modalidad: "domicilio" }, "2026-10-20")).toBe(false);
    expect(canMarkArrival({ ...base, llegadaAt: "2026-10-20T13:50:00Z" }, "2026-10-20")).toBe(false);
    expect(canMarkArrival({ ...base, estado: "en_atencion" }, "2026-10-20")).toBe(false);
  });

  it("usa el día de Colombia, no el de UTC", () => {
    // 20:00 del 20 en Colombia = 01:00 UTC del 21.
    expect(canMarkArrival({ ...base, inicio: "2026-10-21T01:00:00Z" }, "2026-10-20")).toBe(true);
  });
});
