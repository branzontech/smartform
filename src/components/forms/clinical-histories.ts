import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/data/client";

/** Historia clínica general (la base que sigue las normas): la que lleva cada admisión por defecto. */
export const BASE_CLINICAL_HISTORY_ID = "c1a1c0de-0000-4000-8000-000000000001";

export interface ClinicalHistoryOption {
  id: string;
  title: string;
  isBase: boolean;
}

async function fetchClinicalHistories(): Promise<ClinicalHistoryOption[]> {
  const { data, error } = await db
    .from("formularios")
    .select("id, titulo")
    .eq("tipo", "historia_clinica")
    .eq("estado", "activo")
    .order("titulo");
  if (error) throw error;
  const rows = ((data ?? []) as { id: string; titulo: string }[]).map((f) => ({ id: f.id, title: f.titulo, isBase: f.id === BASE_CLINICAL_HISTORY_ID }));
  // La general primero; el resto en orden alfabético.
  return [...rows.filter((r) => r.isBase), ...rows.filter((r) => !r.isBase)];
}

/** Historias clínicas activas que se pueden asignar a una admisión. */
export function useClinicalHistories() {
  return useQuery({ queryKey: ["clinical-histories"], queryFn: fetchClinicalHistories, staleTime: 5 * 60_000 });
}
