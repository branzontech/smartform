import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ServicioClinico, CatalogoProcedimiento, ServicioProcedimiento } from '@/types/servicios';

export function useServiciosClinicos(activo?: boolean) {
  return useQuery({
    queryKey: ['servicios_clinicos', activo],
    queryFn: async () => {
      const query = supabase
        .from('servicios_clinicos')
        .select('*')
        .order('nombre');

      if (activo !== undefined) query.eq('activo', activo);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ServicioClinico[];
    },
  });
}

export function useServiciosConConteo() {
  return useQuery({
    queryKey: ['servicios_clinicos_conteo'],
    queryFn: async () => {
      const { data: servicios, error } = await supabase
        .from('servicios_clinicos')
        .select('*')
        .order('nombre');
      if (error) throw error;

      const { data: asociaciones, error: e2 } = await supabase
        .from('servicio_procedimientos')
        .select('servicio_id')
        .eq('activo', true);
      if (e2) throw e2;

      const conteo: Record<string, number> = {};
      (asociaciones || []).forEach((a: any) => {
        conteo[a.servicio_id] = (conteo[a.servicio_id] || 0) + 1;
      });

      return (servicios || []).map(s => ({
        ...(s as unknown as ServicioClinico),
        procedimientos_count: conteo[s.id] || 0,
      }));
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

export function useAllCatalogoProcedimientos(search?: string) {
  return useQuery({
    queryKey: ['catalogo_procedimientos_all', search],
    queryFn: async () => {
      let query = supabase
        .from('catalogo_procedimientos')
        .select('*')
        .order('codigo')
        .limit(100);

      if (search && search.length >= 2) {
        query = query.or(`codigo.ilike.%${search}%,descripcion.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as CatalogoProcedimiento[];
    },
    enabled: !search || search.length >= 2,
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

export function useUpdateServicioClinico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServicioClinico> & { id: string }) => {
      const { data, error } = await supabase
        .from('servicios_clinicos')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicios_clinicos'] });
      qc.invalidateQueries({ queryKey: ['servicios_clinicos_conteo'] });
    },
  });
}

export function useToggleServicioActivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase
        .from('servicios_clinicos')
        .update({ activo } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicios_clinicos'] });
      qc.invalidateQueries({ queryKey: ['servicios_clinicos_conteo'] });
    },
  });
}

export function useAsociarProcedimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ servicio_id, procedimiento_id }: { servicio_id: string; procedimiento_id: string }) => {
      const { error } = await supabase
        .from('servicio_procedimientos')
        .insert({ servicio_id, procedimiento_id, activo: true } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['servicio_procedimientos', vars.servicio_id] });
      qc.invalidateQueries({ queryKey: ['servicios_clinicos_conteo'] });
    },
  });
}

export function useDesasociarProcedimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, servicio_id }: { id: string; servicio_id: string }) => {
      const { error } = await supabase
        .from('servicio_procedimientos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return servicio_id;
    },
    onSuccess: (servicio_id) => {
      qc.invalidateQueries({ queryKey: ['servicio_procedimientos', servicio_id] });
      qc.invalidateQueries({ queryKey: ['servicios_clinicos_conteo'] });
    },
  });
}

export function useCreateProcedimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (proc: Omit<CatalogoProcedimiento, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('catalogo_procedimientos')
        .insert(proc as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogo_procedimientos'] });
      qc.invalidateQueries({ queryKey: ['catalogo_procedimientos_all'] });
    },
  });
}

export function useUpdateProcedimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CatalogoProcedimiento> & { id: string }) => {
      const { data, error } = await supabase
        .from('catalogo_procedimientos')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogo_procedimientos'] });
      qc.invalidateQueries({ queryKey: ['catalogo_procedimientos_all'] });
    },
  });
}

export function useToggleProcedimientoActivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase
        .from('catalogo_procedimientos')
        .update({ activo } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogo_procedimientos'] });
      qc.invalidateQueries({ queryKey: ['catalogo_procedimientos_all'] });
    },
  });
}
