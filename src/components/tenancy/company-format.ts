import type { StatusTone } from "@/components/kit/table";
import type { LicenseState } from "./tenancy-api";

export const COMPANIES_PATH = "/app/plataforma/empresas";

export const LICENSE_TONE: Record<LicenseState, StatusTone> = {
  pendiente: "neutral",
  suspendida: "error",
  por_iniciar: "info",
  vigente: "success",
  por_vencer: "warning",
  en_gracia: "warning",
  vencida: "error",
};

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

/** Fecha de licencia (YYYY-MM-DD, sin hora) en formato corto. */
export const formatDay = (day: string | null | undefined, empty = "Sin fin") => (day ? shortDate.format(new Date(`${day}T00:00:00Z`)) : empty);
