import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ServicioClinico, CatalogoProcedimiento, ServicioProcedimiento } from '@/types/servicios';

export function useServiciosClinicos(activo = true) {
  return useQuery({
    queryKey: ['servicios_clinicos', activo],
    queryFn: async () => {
      const query = supabase
        .from('servicios_clinicos')
        .select('*')
        .order('nombre');

      if (activo) query.eq('activo', true);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ServicioClinico[];
    },
  });
}

export function useCatalogoProcedimientos(search?: string, servicioId?: string) {
  return useQuery({
    queryKey: ['catalogo_procedimientos', search, servicioId],
    queryFn: async () => {
      if (servicioId) {
        const { data, error } = await supabase
          .from('servicio_procedimientos')
          .select('procedimiento_id, catalogo_procedimientos(*)')
          .eq('servicio_id', servicioId)
          .eq('activo', true);
        if (error) throw error;
        const procs = (data || [])
          .map((sp: any) => sp.catalogo_procedimientos)
          .filter(Boolean) as unknown as CatalogoProcedimiento[];
        if (search) {
          const lower = search.toLowerCase();
          return procs.filter(
            p => p.codigo.toLowerCase().includes(lower) || p.descripcion.toLowerCase().includes(lower)
          );
        }
        return procs;
      }

      let query = supabase
        .from('catalogo_procedimientos')
        .select('*')
        .eq('activo', true)
        .order('codigo')
        .limit(50);

      if (search && search.length >= 2) {
        query = query.or(`codigo.ilike.%${search}%,descripcion.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as CatalogoProcedimiento[];
    },
    enabled: !search || search.length >= 2 || !!servicioId,
  });
}

export function useServicioProcedimientos(servicioId?: string) {
  return useQuery({
    queryKey: ['servicio_procedimientos', servicioId],
    queryFn: async () => {
      if (!servicioId) return [];
      const { data, error } = await supabase
        .from('servicio_procedimientos')
        .select('*, catalogo_procedimientos(*)')
        .eq('servicio_id', servicioId)
        .eq('activo', true)
        .order('orden_visualizacion');
      if (error) throw error;
      return data as unknown as (ServicioProcedimiento & { catalogo_procedimientos: CatalogoProcedimiento })[];
    },
    enabled: !!servicioId,
  });
}

export function useCreateServicioClinico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (servicio: Omit<ServicioClinico, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('servicios_clinicos')
        .insert(servicio as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servicios_clinicos'] }),
  });
}
