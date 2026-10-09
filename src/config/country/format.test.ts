import { describe, expect, it } from "vitest";
import { COUNTRY_PROFILES, countryProfile, DEFAULT_COUNTRY, isCountryCode } from "./profiles";
import { createFormatters, labelOf } from "./format";

const digits = (s: string) => s.replace(/\D/g, "");

describe("countryProfile", () => {
  it("returns the profile for a supported country", () => {
    expect(countryProfile("MX").currency).toBe("MXN");
    expect(countryProfile("EC").currency).toBe("USD");
    expect(countryProfile("PE").locale).toBe("es-PE");
  });

  it("falls back to the default country for unknown or empty codes", () => {
    expect(countryProfile("AR").code).toBe(DEFAULT_COUNTRY);
    expect(countryProfile(null).code).toBe(DEFAULT_COUNTRY);
    expect(isCountryCode("toString")).toBe(false);
  });

  it("gives every country document types and insurance regimes", () => {
    for (const p of Object.values(COUNTRY_PROFILES)) {
      expect(p.documentTypes.length).toBeGreaterThan(0);
      expect(p.insuranceRegimes.length).toBeGreaterThan(0);
    }
  });
});

describe("createFormatters", () => {
  it("formats money with the country currency and its decimals", () => {
    const co = createFormatters(COUNTRY_PROFILES.CO);
    const mx = createFormatters(COUNTRY_PROFILES.MX);
    expect(digits(co.money(1234567))).toBe("1234567");
    expect(digits(mx.money(1234.5))).toBe("123450");
  });

  it("keeps a record's own currency when given", () => {
    const co = createFormatters(COUNTRY_PROFILES.CO);
    expect(co.money(10, "USD")).toMatch(/US\$|USD/);
  });

  it("shows plain dates on the stored day regardless of time zone", () => {
    const pe = createFormatters(COUNTRY_PROFILES.PE);
    expect(pe.date("2024-05-01")).toMatch(/^01/);
  });

  it("returns the empty marker for missing or invalid values", () => {
    const f = createFormatters(COUNTRY_PROFILES.CO);
    expect(f.date(null)).toBe("—");
    expect(f.date("no es fecha")).toBe("—");
    expect(f.money(undefined)).toBe("—");
    expect(f.number(Number.NaN, "")).toBe("");
  });
});

describe("labelOf", () => {
  const list = COUNTRY_PROFILES.CO.insuranceRegimes;

  it("matches by code or by label, ignoring case", () => {
    expect(labelOf(list, "subsidiado")).toBe("Subsidiado");
    expect(labelOf(list, "CONTRIBUTIVO")).toBe("Contributivo");
  });

  it("returns unknown values unchanged and null for empty ones", () => {
    expect(labelOf(list, "Otro")).toBe("Otro");
    expect(labelOf(list, "")).toBeNull();
  });
});
