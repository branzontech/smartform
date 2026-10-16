import { describe, expect, it } from "vitest";
import type { Cita } from "@/components/agenda/agenda-api";
import { EMPTY_FILTER, filterCitas, groupByMonth, nextCita } from "./chart-model";

const cita = (id: string, inicio: string, estado: Cita["estado"], profesional = "Ana Ruiz", servicio = "Consulta domiciliaria") =>
  ({ id, inicio, fin: inicio, estado, profesional, servicio, motivo: null }) as unknown as Cita;

const CITAS = [
  cita("a", "2026-10-23T14:00:00Z", "programada", "Luis Gómez", "Visita de enfermería"),
  cita("b", "2026-10-16T20:00:00Z", "atendida"),
  cita("c", "2026-09-22T13:00:00Z", "cancelada_paciente"),
];

describe("chart-model", () => {
  it("agrupa por mes en hora de Colombia, conservando el orden", () => {
    // 1 de noviembre a las 02:00 UTC todavía es 31 de octubre en Colombia.
    const groups = groupByMonth([cita("x", "2026-11-01T02:00:00Z", "atendida"), ...CITAS], (c) => c.inicio);
    expect(groups.map((g) => [g.month, g.items.map((c) => c.id).join("")])).toEqual([
      ["Octubre de 2026", "xab"],
      ["Septiembre de 2026", "c"],
    ]);
  });

  it("filtra por estado, profesional y texto sin tildes", () => {
    expect(filterCitas(CITAS, { ...EMPTY_FILTER, groups: ["atendidas"] }).map((c) => c.id)).toEqual(["b"]);
    expect(filterCitas(CITAS, { ...EMPTY_FILTER, professional: "Luis Gómez" }).map((c) => c.id)).toEqual(["a"]);
    expect(filterCitas(CITAS, { ...EMPTY_FILTER, search: "enfermeria" }).map((c) => c.id)).toEqual(["a"]);
  });

  it("la próxima cita es la pendiente más cercana desde ahora", () => {
    expect(nextCita(CITAS, Date.parse("2026-10-17T00:00:00Z"))?.id).toBe("a");
    expect(nextCita(CITAS, Date.parse("2026-10-24T00:00:00Z"))).toBeNull();
  });
});
