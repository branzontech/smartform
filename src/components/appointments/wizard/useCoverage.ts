import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/data/client";

export interface Contrato {
  id: string;
  nombre_convenio: string;
  pagador_nombre: string;
  tipo_contratacion: string;
  tarifario_id: string | null;
}

export interface Servicio {
  id: string;
  codigo_servicio: string;
  descripcion_servicio: string;
  valor: number;
}

interface ContratoRow {
  id: string;
  nombre_convenio: string;
  tipo_contratacion: string;
  tarifario_id: string | null;
  pagadores: { nombre: string } | null;
}

/** Convenios activos con su pagador, y los servicios del tarifario del convenio elegido. */
export function useCoverage(contratoId: string) {
  const contratos = useQuery({
    queryKey: ["agendar", "convenios"],
    queryFn: async (): Promise<Contrato[]> => {
      const { data, error } = await db
        .from("contratos")
        .select("id, nombre_convenio, tipo_contratacion, tarifario_id, pagadores(nombre)")
        .eq("estado", "activo")
        .order("nombre_convenio");
      if (error) throw new Error(error.message);
      return ((data ?? []) as ContratoRow[]).map((c) => ({
        id: c.id,
        nombre_convenio: c.nombre_convenio,
        tipo_contratacion: c.tipo_contratacion,
        tarifario_id: c.tarifario_id,
        pagador_nombre: c.pagadores?.nombre ?? "Sin pagador",
      }));
    },
    staleTime: 5 * 60_000,
  });
  const tarifarioId = contratos.data?.find((c) => c.id === contratoId)?.tarifario_id ?? null;
  const servicios = useQuery({
    queryKey: ["agendar", "servicios", tarifarioId],
    enabled: !!tarifarioId,
    queryFn: async (): Promise<Servicio[]> => {
      const { data, error } = await db
        .from("tarifarios_servicios")
        .select("id, codigo_servicio, descripcion_servicio, valor")
        .eq("tarifario_id", tarifarioId)
        .eq("activo", true)
        .order("codigo_servicio");
      if (error) throw new Error(error.message);
      return (data ?? []) as Servicio[];
    },
    staleTime: 5 * 60_000,
  });
  return { contratos, servicios, sinTarifario: !!contratoId && contratos.isSuccess && !tarifarioId };
}
