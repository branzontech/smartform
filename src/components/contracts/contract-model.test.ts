import { describe, expect, it } from "vitest";
import { activationIssues, contractPrice, displayStatus, parseAmount, type ActivationInput } from "./contract-model";

describe("parseAmount", () => {
  it("reads Colombian thousands and decimals", () => {
    expect(parseAmount("1.200.000")).toBe(1_200_000);
    expect(parseAmount("12.110")).toBe(12_110);
    expect(parseAmount("1.200.000,50")).toBe(1_200_000.5);
    expect(parseAmount("36,6")).toBe(36.6);
    expect(parseAmount("$ 85.000")).toBe(85_000);
  });

  it("keeps plain numbers, negatives and dot decimals", () => {
    expect(parseAmount("1500000")).toBe(1_500_000);
    expect(parseAmount("-10")).toBe(-10);
    expect(parseAmount("2.5")).toBe(2.5);
  });

  it("returns null when empty and NaN when not a number", () => {
    expect(parseAmount("  ")).toBeNull();
    expect(Number.isNaN(parseAmount("1,200,000"))).toBe(true);
    expect(Number.isNaN(parseAmount("abc"))).toBe(true);
  });
});

const today = new Date(2026, 9, 8); // 8 oct 2026

describe("displayStatus", () => {
  const active = (fecha_inicio: string, fecha_fin: string | null) => displayStatus({ estado: "activo", fecha_inicio, fecha_fin }, today);

  it("derives validity from the dates of an active contract", () => {
    expect(active("2026-11-01", "2027-10-31")).toBe("por_iniciar");
    expect(active("2026-01-01", "2026-12-31")).toBe("vigente");
    expect(active("2026-01-01", "2026-11-20")).toBe("por_vencer");
    expect(active("2025-01-01", "2026-10-07")).toBe("vencido");
    expect(active("2026-01-01", "2026-10-08")).toBe("por_vencer");
    expect(active("2026-01-01", null)).toBe("vigente");
  });

  it("keeps manual states as they are", () => {
    expect(displayStatus({ estado: "bloqueado", fecha_inicio: "2026-01-01", fecha_fin: "2026-12-31" }, today)).toBe("bloqueado");
    expect(displayStatus({ estado: "borrador", fecha_inicio: "2026-01-01", fecha_fin: null }, today)).toBe("borrador");
  });
});

const base: ActivationInput = {
  pagador_id: "p1",
  nombre_convenio: "Sura evento 2026",
  numero_contrato: "C-001",
  objeto: "Atención domiciliaria",
  tipo_contratacion: "evento",
  fecha_inicio: "2026-01-01",
  fecha_fin: "2026-12-31",
  tarifario_id: "t1",
  plazo_pago_dias: "60",
  pgp_valor_periodo: "",
  pgp_periodicidad: "",
  pgp_poblacion: "",
  numero_usuarios: "",
  valor_por_usuario: "",
  paquetes: 0,
};

describe("activationIssues", () => {
  it("accepts a complete event contract", () => {
    expect(activationIssues(base)).toEqual([]);
  });

  it("asks for the PGP data in a PGP contract, not for a tariff manual", () => {
    const issues = activationIssues({ ...base, tipo_contratacion: "pgp", tarifario_id: null });
    expect(issues).toEqual(["Valor del PGP por periodo", "Periodicidad del PGP", "Población del PGP"]);
  });

  it("requires at least one package in a package contract", () => {
    expect(activationIssues({ ...base, tipo_contratacion: "paquete", tarifario_id: null })).toEqual(["Al menos un paquete con su valor"]);
  });

  it("rejects an end date before the start", () => {
    expect(activationIssues({ ...base, fecha_fin: "2025-12-31" })).toContain("La fecha de fin es anterior a la de inicio");
  });

  it("lets a private-pay agreement go without number, object or end date", () => {
    expect(activationIssues({ ...base, tipo_contratacion: "particular", numero_contrato: "", objeto: "", fecha_fin: "", plazo_pago_dias: "" })).toEqual([]);
  });
});

describe("contractPrice", () => {
  it("converts UVB to pesos, applies the agreed percentage and rounds to the hundred", () => {
    // 2,5 UVB × 11.552 = 28.880 → 28.900; −10 % = 26.010 → 26.000
    expect(contractPrice({ base: 2.5, unit: "UVB", uvb: 11552, pct: -10 })).toBe(26000);
  });

  it("returns null when the UVB of the year is missing", () => {
    expect(contractPrice({ base: 2.5, unit: "UVB", uvb: null, pct: 0 })).toBeNull();
  });

  it("applies the percentage to a peso-based manual without hundred rounding", () => {
    expect(contractPrice({ base: 45_250, unit: "COP", pct: 30 })).toBe(58_825);
  });
});
