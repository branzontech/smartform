/**
 * Perfiles por país. Todo lo que cambia entre Colombia, México, Ecuador y Perú
 * (idioma y formatos, moneda, tipos de documento, regímenes de aseguramiento,
 * nombres de la división territorial) sale de aquí y nunca va fijo en un
 * componente. El país activo es `configuracion_encabezado.pais` (ver useCountry).
 */

export type CountryCode = "CO" | "MX" | "EC" | "PE";

export interface CodeLabel {
  code: string;
  label: string;
}

export interface CountryProfile {
  code: CountryCode;
  name: string;
  /** Etiqueta BCP 47 para Intl (fechas, números, orden alfabético). */
  locale: string;
  /** ISO 4217. */
  currency: string;
  /** Decimales con que se muestra la moneda. */
  currencyDecimals: number;
  timeZone: string;
  phonePrefix: string;
  documentTypes: CodeLabel[];
  /** Régimen o subsistema de aseguramiento en salud del paciente. */
  insuranceRegimes: CodeLabel[];
  /** Cómo se llama en ese país a la entidad que paga la atención. */
  payerLabel: string;
  /** Nombres de la división territorial: primer y segundo nivel. */
  regionLabel: string;
  subregionLabel: string;
}

export const COUNTRY_PROFILES: Record<CountryCode, CountryProfile> = {
  CO: {
    code: "CO",
    name: "Colombia",
    locale: "es-CO",
    currency: "COP",
    currencyDecimals: 0,
    timeZone: "America/Bogota",
    phonePrefix: "+57",
    documentTypes: [
      { code: "CC", label: "Cédula de ciudadanía" },
      { code: "CE", label: "Cédula de extranjería" },
      { code: "TI", label: "Tarjeta de identidad" },
      { code: "RC", label: "Registro civil" },
      { code: "PA", label: "Pasaporte" },
      { code: "PPT", label: "Permiso por protección temporal" },
      { code: "NIT", label: "NIT" },
    ],
    insuranceRegimes: [
      { code: "contributivo", label: "Contributivo" },
      { code: "subsidiado", label: "Subsidiado" },
      { code: "especial", label: "Especial o de excepción" },
      { code: "no_asegurado", label: "No asegurado" },
      { code: "particular", label: "Particular" },
    ],
    payerLabel: "EPS",
    regionLabel: "Departamento",
    subregionLabel: "Municipio",
  },
  MX: {
    code: "MX",
    name: "México",
    locale: "es-MX",
    currency: "MXN",
    currencyDecimals: 2,
    timeZone: "America/Mexico_City",
    phonePrefix: "+52",
    documentTypes: [
      { code: "CURP", label: "CURP" },
      { code: "INE", label: "Credencial para votar (INE)" },
      { code: "RFC", label: "RFC" },
      { code: "PA", label: "Pasaporte" },
    ],
    insuranceRegimes: [
      { code: "imss", label: "IMSS" },
      { code: "issste", label: "ISSSTE" },
      { code: "imss_bienestar", label: "IMSS-Bienestar" },
      { code: "privado", label: "Seguro privado" },
      { code: "no_asegurado", label: "Sin seguridad social" },
      { code: "particular", label: "Particular" },
    ],
    payerLabel: "Aseguradora",
    regionLabel: "Estado",
    subregionLabel: "Municipio",
  },
  EC: {
    code: "EC",
    name: "Ecuador",
    locale: "es-EC",
    currency: "USD",
    currencyDecimals: 2,
    timeZone: "America/Guayaquil",
    phonePrefix: "+593",
    documentTypes: [
      { code: "CI", label: "Cédula de identidad" },
      { code: "RUC", label: "RUC" },
      { code: "PA", label: "Pasaporte" },
    ],
    insuranceRegimes: [
      { code: "iess", label: "IESS" },
      { code: "issfa", label: "ISSFA" },
      { code: "isspol", label: "ISSPOL" },
      { code: "msp", label: "Red pública (MSP)" },
      { code: "privado", label: "Seguro privado" },
      { code: "particular", label: "Particular" },
    ],
    payerLabel: "Aseguradora",
    regionLabel: "Provincia",
    subregionLabel: "Cantón",
  },
  PE: {
    code: "PE",
    name: "Perú",
    locale: "es-PE",
    currency: "PEN",
    currencyDecimals: 2,
    timeZone: "America/Lima",
    phonePrefix: "+51",
    documentTypes: [
      { code: "DNI", label: "DNI" },
      { code: "CE", label: "Carné de extranjería" },
      { code: "RUC", label: "RUC" },
      { code: "PA", label: "Pasaporte" },
    ],
    insuranceRegimes: [
      { code: "sis", label: "SIS" },
      { code: "essalud", label: "EsSalud" },
      { code: "eps", label: "EPS" },
      { code: "ffaa_pnp", label: "Sanidad FF. AA. / PNP" },
      { code: "privado", label: "Seguro privado" },
      { code: "particular", label: "Particular" },
    ],
    payerLabel: "Aseguradora",
    regionLabel: "Departamento",
    subregionLabel: "Provincia",
  },
};

/** País usado mientras no haya institución configurada. */
export const DEFAULT_COUNTRY: CountryCode = "CO";

export const isCountryCode = (v: unknown): v is CountryCode =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(COUNTRY_PROFILES, v);

export const countryProfile = (code: unknown): CountryProfile =>
  COUNTRY_PROFILES[isCountryCode(code) ? code : DEFAULT_COUNTRY];
