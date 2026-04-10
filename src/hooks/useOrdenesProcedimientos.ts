import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OrdenProcedimientoConItems, OrdenProcedimientoItem } from '@/types/ordenes-procedimientos';

const QUERY_KEY = 'ordenes_procedimientos';

export function useOrdenesProcedimientosByAdmision(admisionId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, admisionId],
    queryFn: async (): Promise<OrdenProcedimientoConItems[]> => {
      if (!admisionId) return [];

      const { data: ordenes, error } = await supabase
        .from('ordenes_medicas')
        .select('*')
        .eq('tipo', 'procedimiento')
        .eq('admision_id', admisionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!ordenes || ordenes.length === 0) return [];

      const ordenIds = ordenes.map(o => o.id);

      const { data: items, error: itemsError } = await supabase
        .from('orden_procedimiento_items')
        .select('*')
        .in('orden_id', ordenIds);

      if (itemsError) throw itemsError;

      const itemsByOrden = (items || []).reduce<Record<string, OrdenProcedimientoItem[]>>((acc, item) => {
        const typed = item as unknown as OrdenProcedimientoItem;
        if (!acc[typed.orden_id]) acc[typed.orden_id] = [];
        acc[typed.orden_id].push(typed);
        return acc;
      }, {});

      return ordenes.map(o => ({
        ...o,
        tipo: 'procedimiento' as const,
        items_detalle: itemsByOrden[o.id] || [],
      })) as unknown as OrdenProcedimientoConItems[];
    },
    enabled: !!admisionId,
  });
}

export function useOrdenProcedimientoDetail(ordenId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', ordenId],
    queryFn: async (): Promise<OrdenProcedimientoConItems | null> => {
      if (!ordenId) return null;

      const { data: orden, error } = await supabase
        .from('ordenes_medicas')
        .select('*')
        .eq('id', ordenId)
        .single();

      if (error) throw error;
      if (!orden) return null;

      const { data: items, error: itemsError } = await supabase
        .from('orden_procedimiento_items')
        .select('*')
        .eq('orden_id', ordenId);

      if (itemsError) throw itemsError;

      let servicio = null;
      if (orden.servicio_id) {
        const { data: svc } = await supabase
          .from('servicios_clinicos')
          .select('nombre, codigo')
          .eq('id', orden.servicio_id)
          .single();
        servicio = svc;
      }

      return {
        ...orden,
        tipo: 'procedimiento' as const,
        items_detalle: (items || []) as unknown as OrdenProcedimientoItem[],
        servicio,
      } as unknown as OrdenProcedimientoConItems;
    },
    enabled: !!ordenId,
  });
}

interface CreateOrdenInput {
  admision_id: string;
  paciente_id: string;
  medico_id: string;
  medico_nombre: string;
  servicio_id?: string | null;
  alcance?: string;
  prioridad?: string;
  indicaciones?: string | null;
  diagnostico_codigo?: string | null;
  diagnostico_descripcion?: string | null;
  diagnostico_sistema?: string | null;
  fecha_vigencia?: string | null;
}

interface CreateOrdenItemInput {
  procedimiento_id: string;
  codigo_procedimiento: string;
  descripcion_procedimiento: string;
  cantidad: number;
  dias: number;
  notas?: string | null;
}

export function useCreateOrdenProcedimiento() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ orden, items }: { orden: CreateOrdenInput; items: CreateOrdenItemInput[] }) => {
      // 1. Insert into ordenes_medicas
      const { data: newOrden, error: ordenError } = await supabase
        .from('ordenes_medicas')
        .insert({
          tipo: 'procedimiento',
          numero_orden: 'PX-TEMP', // trigger will generate real number
          paciente_id: orden.paciente_id,
          admision_id: orden.admision_id,
          medico_id: orden.medico_id,
          medico_nombre: orden.medico_nombre,
          servicio_id: orden.servicio_id || null,
          alcance: orden.alcance || 'interna',
          prioridad: orden.prioridad || 'routine',
          indicaciones: orden.indicaciones || null,
          diagnostico_codigo: orden.diagnostico_codigo || null,
          diagnostico_descripcion: orden.diagnostico_descripcion || null,
          diagnostico_sistema: orden.diagnostico_sistema || null,
          fecha_vigencia: orden.fecha_vigencia || null,
          items: items.map(i => ({
            codigo: i.codigo_procedimiento,
            descripcion: i.descripcion_procedimiento,
            cantidad: i.cantidad,
            dias: i.dias,
          })),
        } as any)
        .select()
        .single();

      if (ordenError) throw ordenError;

      // 2. Insert items into orden_procedimiento_items
      if (items.length > 0) {
        const itemRows = items.map(item => ({
          orden_id: newOrden.id,
          procedimiento_id: item.procedimiento_id,
          codigo_procedimiento: item.codigo_procedimiento,
          descripcion_procedimiento: item.descripcion_procedimiento,
          cantidad: item.cantidad,
          dias: item.dias,
          notas: item.notas || null,
        }));

        const { error: itemsError } = await supabase
          .from('orden_procedimiento_items')
          .insert(itemRows as any);

        if (itemsError) throw itemsError;
      }

      return newOrden;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useSearchProcedimientos(search: string, servicioId?: string) {
  return useQuery({
    queryKey: ['search_procedimientos', search, servicioId],
    queryFn: async () => {
      if (servicioId) {
        const { data, error } = await supabase
          .from('servicio_procedimientos')
          .select('procedimiento_id, catalogo_procedimientos(*)')
          .eq('servicio_id', servicioId)
          .eq('activo', true);

        if (error) throw error;

        const procs = (data || []).map((sp: any) => sp.catalogo_procedimientos).filter(Boolean);
        const lower = search.toLowerCase();
        return procs.filter(
          (p: any) => p.codigo.toLowerCase().includes(lower) || p.descripcion.toLowerCase().includes(lower)
        );
      }

      const { data, error } = await supabase
        .from('catalogo_procedimientos')
        .select('*')
        .eq('activo', true)
        .or(`codigo.ilike.%${search}%,descripcion.ilike.%${search}%`)
        .order('codigo')
        .limit(30);

      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });
}
