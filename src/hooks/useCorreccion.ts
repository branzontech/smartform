import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  anularRegistro,
  calcularModoCorreccion,
  corregirRegistro,
  obtenerConfiguracionCorreccion,
  obtenerHistorialProvenance,
} from "@/lib/correccionService";
import type {
  AnulacionInput,
  CorreccionInput,
  CorreccionTargetTable,
} from "@/types/correccion";

/**
 * Hook principal para correcciones clínicas.
 * Expone mutations para anular/corregir y queries para configuración e historial.
 */
export function useCorreccion(targetTable: CorreccionTargetTable) {
  const queryClient = useQueryClient();

  const configuracionQuery = useQuery({
    queryKey: ["correccion-config", targetTable],
    queryFn: () => obtenerConfiguracionCorreccion(targetTable),
    staleTime: 5 * 60 * 1000,
  });

  const anularMutation = useMutation({
    mutationFn: (input: AnulacionInput) => anularRegistro(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.target_table] });
      queryClient.invalidateQueries({
        queryKey: ["provenance", variables.target_table, variables.target_record_id],
      });
      toast.success("Registro anulado correctamente", {
        description:
          "La anulación quedó registrada en el audit trail inmutable.",
      });
    },
    onError: (error: Error) => {
      toast.error("No se pudo anular el registro", {
        description: error.message,
      });
    },
  });

  const corregirMutation = useMutation({
    mutationFn: (input: CorreccionInput) => corregirRegistro(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.target_table] });
      queryClient.invalidateQueries({
        queryKey: ["provenance", variables.target_table, variables.target_record_id],
      });
      toast.success("Registro corregido correctamente", {
        description:
          "Se creó el registro corregido y se vinculó al original en el audit trail.",
      });
    },
    onError: (error: Error) => {
      toast.error("No se pudo corregir el registro", {
        description: error.message,
      });
    },
  });

  return {
    configuracion: configuracionQuery.data,
    configuracionLoading: configuracionQuery.isLoading,
    anular: anularMutation.mutate,
    anularAsync: anularMutation.mutateAsync,
    anulando: anularMutation.isPending,
    corregir: corregirMutation.mutate,
    corregirAsync: corregirMutation.mutateAsync,
    corrigiendo: corregirMutation.isPending,
  };
}

/**
 * Historial de provenance de un registro específico.
 */
export function useHistorialCorrecciones(
  targetTable: CorreccionTargetTable,
  targetRecordId: string | null | undefined
) {
  return useQuery({
    queryKey: ["provenance", targetTable, targetRecordId],
    queryFn: () => obtenerHistorialProvenance(targetTable, targetRecordId!),
    enabled: !!targetRecordId,
  });
}

/**
 * Determina qué modo de corrección está disponible para un registro.
 * Útil para decidir entre "Editar" (rápida) o "Corregir" (formal).
 */
export function useModoCorreccion(
  targetTable: CorreccionTargetTable,
  targetRecordId: string | null | undefined,
  createdAt: string | null | undefined,
  estadoRegistro: string | null | undefined,
  esFacturado: boolean = false
) {
  return useQuery({
    queryKey: [
      "modo-correccion",
      targetTable,
      targetRecordId,
      estadoRegistro,
      esFacturado,
    ],
    queryFn: () =>
      calcularModoCorreccion(
        targetTable,
        targetRecordId!,
        createdAt!,
        estadoRegistro!,
        esFacturado
      ),
    enabled: !!targetRecordId && !!createdAt && !!estadoRegistro,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
