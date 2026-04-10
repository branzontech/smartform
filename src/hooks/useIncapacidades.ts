import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Incapacidad, IncapacidadFormData } from "@/types/incapacidades";

export function useIncapacidadesByAdmision(admisionId: string | null) {
  return useQuery<Incapacidad[]>({
    queryKey: ["incapacidades", admisionId],
    queryFn: async () => {
      if (!admisionId) return [];
      const { data, error } = await supabase
        .from("incapacidades")
        .select("*")
        .eq("admision_id", admisionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Incapacidad[]) || [];
    },
    enabled: !!admisionId,
  });
}

export function useCreateIncapacidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: IncapacidadFormData) => {
      const { data, error } = await supabase
        .from("incapacidades")
        .insert(formData as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Incapacidad;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incapacidades", variables.admision_id] });
      queryClient.invalidateQueries({ queryKey: ["incapacidades"] });
    },
  });
}

export function useUpdateIncapacidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IncapacidadFormData> }) => {
      const { data: updated, error } = await supabase
        .from("incapacidades")
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated as unknown as Incapacidad;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["incapacidades", result.admision_id] });
      queryClient.invalidateQueries({ queryKey: ["incapacidades"] });
    },
  });
}
