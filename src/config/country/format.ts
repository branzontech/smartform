import type { CodeLabel, CountryProfile } from "./profiles";

type DateInput = string | number | Date | null | undefined;

const toDate = (v: DateInput): Date | null => {
  if (v === null || v === undefined || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Busca por código o por etiqueta (los registros antiguos guardan la etiqueta). */
export const labelOf = (list: CodeLabel[], value: string | null | undefined): string | null => {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  return list.find((x) => x.code.toLowerCase() === v || x.label.toLowerCase() === v)?.label ?? value;
};

/**
 * Formateadores del país. Las fechas sin hora (`2024-05-01`) se muestran tal
 * cual el día guardado, sin correrse por la zona horaria.
 */
export function createFormatters(profile: CountryProfile) {
  const { locale, timeZone } = profile;
  const shortDate = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", timeZone });
  const plainDate = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  const dateTime = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone });
  const number = new Intl.NumberFormat(locale);
  const moneyFormats = new Map<string, Intl.NumberFormat>();
  const moneyFormat = (currency: string) => {
    let f = moneyFormats.get(currency);
    if (!f) {
      const digits = currency === profile.currency ? profile.currencyDecimals : undefined;
      f = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits });
      moneyFormats.set(currency, f);
    }
    return f;
  };

  return {
    date(v: DateInput, empty = "—") {
      const d = toDate(v);
      if (!d) return empty;
      const isPlainDate = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
      return (isPlainDate ? plainDate : shortDate).format(d);
    },
    dateTime(v: DateInput, empty = "—") {
      const d = toDate(v);
      return d ? dateTime.format(d) : empty;
    },
    number(v: number | null | undefined, empty = "—") {
      return v === null || v === undefined || Number.isNaN(v) ? empty : number.format(v);
    },
    /** Sin moneda explícita usa la del país; un registro en otra moneda conserva la suya. */
    money(v: number | null | undefined, currency: string = profile.currency, empty = "—") {
      return v === null || v === undefined || Number.isNaN(v) ? empty : moneyFormat(currency).format(v);
    },
    collator: new Intl.Collator(locale, { numeric: true, sensitivity: "base" }),
    documentTypeLabel: (code: string | null | undefined) => labelOf(profile.documentTypes, code),
    insuranceRegimeLabel: (code: string | null | undefined) => labelOf(profile.insuranceRegimes, code),
  };
}

export type CountryFormatters = ReturnType<typeof createFormatters>;
