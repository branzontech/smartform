import { describe, expect, it } from "vitest";
import { ageFrom, groupByInitial, patientSubtitle, type MyPatient } from "./pacientes";

const NOW = new Date("2026-10-19T15:00:00Z");

const patient = (over: Partial<MyPatient>): MyPatient => ({
  id: "1",
  nombre: "Ana María Pérez",
  tipoDocumento: "CC",
  documento: "123",
  fechaNacimiento: null,
  genero: null,
  telefono: null,
  ciudad: null,
  direccion: null,
  citas: 1,
  ultima: null,
  proxima: null,
  ...over,
});

describe("ageFrom", () => {
  it("cuenta los años cumplidos", () => {
    expect(ageFrom("1990-10-18", NOW)).toBe(36);
    expect(ageFrom("1990-10-20", NOW)).toBe(35);
  });

  it("el día del cumpleaños ya cuenta", () => {
    expect(ageFrom("1995-10-19", NOW)).toBe(31);
  });

  it("sin fecha o con fecha inválida, null", () => {
    expect(ageFrom(null, NOW)).toBeNull();
    expect(ageFrom("no-es-fecha", NOW)).toBeNull();
  });
});

describe("patientSubtitle", () => {
  it("une documento, edad y ciudad", () => {
    expect(patientSubtitle(patient({ fechaNacimiento: "1990-10-18", ciudad: "Cartagena" }), NOW)).toBe("CC 123 · 36 años · Cartagena");
  });

  it("omite lo que falta", () => {
    expect(patientSubtitle(patient({ tipoDocumento: null }), NOW)).toBe("123");
  });

  it("un año en singular", () => {
    expect(patientSubtitle(patient({ fechaNacimiento: "2025-01-01" }), NOW)).toBe("CC 123 · 1 año");
  });
});

describe("groupByInitial", () => {
  it("agrupa por la primera letra, sin tildes y en orden", () => {
    const groups = groupByInitial([
      patient({ id: "a", nombre: "Ángela Ruiz" }),
      patient({ id: "b", nombre: "beto Díaz" }),
      patient({ id: "c", nombre: "Ana Gómez" }),
    ]);
    expect(groups.map((g) => [g.letra, g.pacientes.map((p) => p.id)])).toEqual([
      ["A", ["a", "c"]],
      ["B", ["b"]],
    ]);
  });

  it("lo que no empieza por letra va en «#» al final", () => {
    const groups = groupByInitial([patient({ id: "x", nombre: "123 Prueba" }), patient({ id: "y", nombre: "Zoe" })]);
    expect(groups.map((g) => g.letra)).toEqual(["Z", "#"]);
  });
});
