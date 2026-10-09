import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/data/client";
import { countryProfile, DEFAULT_COUNTRY } from "./profiles";
import { createFormatters } from "./format";

export const COUNTRY_QUERY_KEY = ["institution", "country"] as const;

/** País de la institución (`configuracion_encabezado.pais`). */
async function fetchInstitutionCountry(): Promise<string> {
  const { data, error } = await db.from("configuracion_encabezado").select("pais").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { pais?: string } | null)?.pais ?? DEFAULT_COUNTRY;
}

/**
 * Perfil y formateadores del país activo. Mientras carga (o si falla) usa el
 * país por defecto, para que ninguna pantalla quede sin formatos. Al cambiar
 * el país en Configuración hay que invalidar `COUNTRY_QUERY_KEY`.
 */
export function useCountry() {
  const { data: code } = useQuery({
    queryKey: COUNTRY_QUERY_KEY,
    queryFn: fetchInstitutionCountry,
    staleTime: Infinity,
  });
  return useMemo(() => {
    const profile = countryProfile(code);
    return { profile, format: createFormatters(profile) };
  }, [code]);
}
