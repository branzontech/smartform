import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, Plus, Trash2, ChevronDown, Package } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { cn } from '@/lib/utils';

const FORMAS = ['tableta','cápsula','jarabe','ampolla','crema','gel','solución','suspensión','polvo','parche','dispositivo','unidad','caja','paquete','bolsa','frasco'] as const;
const UNIDADES = ['mg','ml','g','L','unidad','pieza','caja'] as const;
const VIAS = ['oral','IV','IM','tópica','SC','inhalada','rectal','oftálmica','ótica','nasal','N/A'] as const;

const loteInicialSchema = z.object({
  sede_id: z.string().min(1, 'Sede requerida'),
  numero_lote: z.string().min(1, 'Número de lote requerido'),
  fecha_vencimiento: z.date({ required_error: 'Fecha requerida' }),
  cantidad_inicial: z.number().min(1, 'Mínimo 1'),
}).optional().nullable();

const presentacionSchema = z.object({
  id: z.string().optional(),
  forma_farmaceutica: z.string().min(1, 'Requerido'),
  concentracion: z.string().optional().or(z.literal('')),
  unidad_medida: z.string().min(1, 'Requerido'),
  via_administracion: z.string().optional().or(z.literal('')),
  presentacion_comercial: z.string().optional().or(z.literal('')),
  _deleted: z.boolean().optional(),
  lote_inicial: z.object({
    sede_id: z.string(),
    numero_lote: z.string(),
    fecha_vencimiento: z.date().nullable(),
    cantidad_inicial: z.number().nullable(),
  }).optional().nullable(),
});

const schema = z.object({
  nombre_generico: z.string().trim().min(1, 'Requerido').max(200),
  nombre_comercial: z.string().trim().max(200).optional().or(z.literal('')),
  tipo_producto: z.enum(['medicamento', 'insumo', 'dispositivo_medico'], { required_error: 'Selecciona un tipo' }),
  principio_activo: z.string().trim().max(200).optional().or(z.literal('')),
  codigo_atc: z.string().trim().max(20).optional().or(z.literal('')),
  fabricante: z.string().trim().max(200).optional().or(z.literal('')),
  requiere_cadena_frio: z.boolean().default(false),
  controlado: z.boolean().default(false),
  presentaciones: z.array(presentacionSchema).min(1, 'Agrega al menos 1 presentación'),
});

type FormValues = z.infer<typeof schema>;

const FHIR_TYPE_MAP: Record<string, string> = {
  medicamento: 'Medication',
  insumo: 'Supply',
  dispositivo_medico: 'Device',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProductId?: string | null;
}

const emptyPresentacion = () => ({
  forma_farmaceutica: '',
  concentracion: '',
  unidad_medida: '',
  via_administracion: '',
  presentacion_comercial: '',
  lote_inicial: null as FormValues['presentaciones'][0]['lote_inicial'],
});

export const ProductoDialog: React.FC<Props> = ({ open, onOpenChange, editProductId }) => {
  const queryClient = useQueryClient();
  const isEdit = !!editProductId;
  const [openLotes, setOpenLotes] = useState<Record<number, boolean>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre_generico: '',
      nombre_comercial: '',
      tipo_producto: undefined,
      principio_activo: '',
      codigo_atc: '',
      fabricante: '',
      requiere_cadena_frio: false,
      controlado: false,
      presentaciones: [emptyPresentacion()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'presentaciones' });
  const tipoProducto = form.watch('tipo_producto');
  const isMed = tipoProducto === 'medicamento';

  // Load sedes
  const { data: sedes = [] } = useQuery({
    queryKey: ['sedes-select'],
    queryFn: async () => {
      const { data } = await supabase.from('sedes').select('id, nombre').eq('activo', true).order('nombre');
      return data || [];
    },
  });

  // Load product data for edit mode
  const { data: editData } = useQuery({
    queryKey: ['edit-product', editProductId],
    enabled: !!editProductId && open,
    queryFn: async () => {
      const [{ data: prod }, { data: pres }] = await Promise.all([
        supabase.from('catalogo_productos').select('*').eq('id', editProductId!).single(),
        supabase.from('presentaciones_producto').select('*').eq('producto_id', editProductId!).eq('activo', true),
      ]);
      return { prod, pres: pres || [] };
    },
  });

  useEffect(() => {
    if (editData?.prod && open) {
      const p = editData.prod;
      form.reset({
        nombre_generico: p.nombre_generico,
        nombre_comercial: p.nombre_comercial || '',
        tipo_producto: p.tipo_producto as any,
        principio_activo: p.principio_activo || '',
        codigo_atc: p.codigo_atc || '',
        fabricante: p.fabricante || '',
        requiere_cadena_frio: p.requiere_cadena_frio ?? false,
        controlado: p.controlado ?? false,
        presentaciones: editData.pres.length > 0
          ? editData.pres.map(pr => ({
              id: pr.id,
              forma_farmaceutica: pr.forma_farmaceutica,
              concentracion: pr.concentracion || '',
              unidad_medida: pr.unidad_medida,
              via_administracion: pr.via_administracion || '',
              presentacion_comercial: pr.presentacion_comercial || '',
              lote_inicial: null,
            }))
          : [emptyPresentacion()],
      });
      setOpenLotes({});
    }
  }, [editData, open]);

  useEffect(() => {
    if (!open) {
      form.reset({
        nombre_generico: '', nombre_comercial: '', tipo_producto: undefined,
        principio_activo: '', codigo_atc: '', fabricante: '',
        requiere_cadena_frio: false, controlado: false, presentaciones: [emptyPresentacion()],
      });
      setOpenLotes({});
    }
  }, [open]);

  const toggleLote = (idx: number) => {
    const isOpen = !!openLotes[idx];
    setOpenLotes(prev => ({ ...prev, [idx]: !isOpen }));
    if (isOpen) {
      form.setValue(`presentaciones.${idx}.lote_inicial`, null);
    } else {
      form.setValue(`presentaciones.${idx}.lote_inicial`, {
        sede_id: '',
        numero_lote: '',
        fecha_vencimiento: null,
        cantidad_inicial: null,
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      if (isEdit) {
        // Update product
        const { error: prodErr } = await supabase.from('catalogo_productos').update({
          nombre_generico: values.nombre_generico,
          nombre_comercial: values.nombre_comercial || null,
          tipo_producto: values.tipo_producto,
          principio_activo: isMed ? (values.principio_activo || null) : null,
          codigo_atc: isMed ? (values.codigo_atc || null) : null,
          fabricante: values.fabricante || null,
          requiere_cadena_frio: values.requiere_cadena_frio,
          controlado: isMed ? values.controlado : false,
          fhir_resource_type: FHIR_TYPE_MAP[values.tipo_producto] || 'Supply',
        }).eq('id', editProductId!);
        if (prodErr) throw prodErr;

        const existingIds = values.presentaciones.filter(p => p.id).map(p => p.id!);
        const originalIds = (editData?.pres || []).map(p => p.id);
        const toDelete = originalIds.filter(id => !existingIds.includes(id));

        if (toDelete.length > 0) {
          const { error } = await supabase.from('presentaciones_producto').update({ activo: false }).in('id', toDelete);
          if (error) throw error;
        }

        for (const pres of values.presentaciones) {
          if (pres.id) {
            const { error } = await supabase.from('presentaciones_producto').update({
              forma_farmaceutica: pres.forma_farmaceutica,
              concentracion: pres.concentracion || null,
              unidad_medida: pres.unidad_medida,
              via_administracion: pres.via_administracion || null,
              presentacion_comercial: pres.presentacion_comercial || null,
            }).eq('id', pres.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('presentaciones_producto').insert({
              producto_id: editProductId!,
              forma_farmaceutica: pres.forma_farmaceutica,
              concentracion: pres.concentracion || null,
              unidad_medida: pres.unidad_medida,
              via_administracion: pres.via_administracion || null,
              presentacion_comercial: pres.presentacion_comercial || null,
            });
            if (error) throw error;
          }
        }

        return { nombre: values.nombre_generico, loteInfo: null };
      } else {
        // Create product
        const codigo = `${values.tipo_producto === 'medicamento' ? 'MED' : values.tipo_producto === 'insumo' ? 'INS' : 'DIS'}-${nanoid(6).toUpperCase()}`;
        const { data: prod, error: prodErr } = await supabase.from('catalogo_productos').insert({
          codigo,
          nombre_generico: values.nombre_generico,
          nombre_comercial: values.nombre_comercial || null,
          tipo_producto: values.tipo_producto,
          principio_activo: isMed ? (values.principio_activo || null) : null,
          codigo_atc: isMed ? (values.codigo_atc || null) : null,
          fabricante: values.fabricante || null,
          requiere_cadena_frio: values.requiere_cadena_frio,
          controlado: isMed ? values.controlado : false,
          fhir_resource_type: FHIR_TYPE_MAP[values.tipo_producto] || 'Supply',
          activo: true,
        }).select('id').single();
        if (prodErr) throw prodErr;

        // Insert presentations and optionally create lots
        let loteInfo: { numero: string; cantidad: number; sede: string } | null = null;

        for (const p of values.presentaciones) {
          const { data: presData, error: presErr } = await supabase.from('presentaciones_producto').insert({
            producto_id: prod.id,
            forma_farmaceutica: p.forma_farmaceutica,
            concentracion: p.concentracion || null,
            unidad_medida: p.unidad_medida,
            via_administracion: p.via_administracion || null,
            presentacion_comercial: p.presentacion_comercial || null,
          }).select('id').single();
          if (presErr) throw presErr;

          // Handle optional initial lot
          const lote = p.lote_inicial;
          if (lote && lote.sede_id && lote.numero_lote && lote.fecha_vencimiento && lote.cantidad_inicial && lote.cantidad_inicial > 0) {
            // Find or create stock record
            let { data: stock } = await supabase
              .from('inventario_stock')
              .select('id')
              .eq('presentacion_id', presData.id)
              .eq('sede_id', lote.sede_id)
              .eq('producto_id', prod.id)
              .maybeSingle();

            if (!stock) {
              const { data: newStock, error: stockErr } = await supabase
                .from('inventario_stock')
                .insert({
                  producto_id: prod.id,
                  presentacion_id: presData.id,
                  sede_id: lote.sede_id,
                  cantidad_disponible: 0,
                })
                .select('id')
                .single();
              if (stockErr) throw stockErr;
              stock = newStock;
            }

            // Create lot
            const { data: loteData, error: loteErr } = await supabase
              .from('inventario_lotes')
              .insert({
                stock_id: stock!.id,
                numero_lote: lote.numero_lote,
                fecha_vencimiento: lote.fecha_vencimiento.toISOString().split('T')[0],
                cantidad: 0,
              })
              .select('id')
              .single();
            if (loteErr) throw loteErr;

            // Create movement (trigger updates stock + lote quantities)
            const { error: movErr } = await supabase
              .from('inventario_movimientos')
              .insert({
                stock_id: stock!.id,
                lote_id: loteData.id,
                tipo_movimiento: 'entrada',
                cantidad: lote.cantidad_inicial,
                usuario_id: user.id,
                motivo: 'Lote inicial al crear producto',
              });
            if (movErr) throw movErr;

            const sedeNombre = sedes.find(s => s.id === lote.sede_id)?.nombre || '';
            loteInfo = { numero: lote.numero_lote, cantidad: lote.cantidad_inicial, sede: sedeNombre };
          }
        }

        return { nombre: values.nombre_generico, loteInfo };
      }
    },
    onSuccess: (result) => {
      if (isEdit) {
        toast.success('Producto actualizado');
      } else if (result?.loteInfo) {
        toast.success(`Producto creado: ${result.nombre} — Lote ${result.loteInfo.numero} registrado con ${result.loteInfo.cantidad} unidades en ${result.loteInfo.sede}`);
      } else {
        toast.success(`Producto creado: ${result?.nombre}`);
      }
      queryClient.invalidateQueries({ queryKey: ['inv-total-products'] });
      queryClient.invalidateQueries({ queryKey: ['inv-total-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inv-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inv-expiring'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-stock-table'] });
      queryClient.invalidateQueries({ queryKey: ['catalogo-productos'] });
      queryClient.invalidateQueries({ queryKey: ['edit-product'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-lotes'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-movimientos'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al guardar producto');
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-semibold">{isEdit ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? 'Modifica la información del producto y sus presentaciones' : 'Completa la información del producto y agrega al menos una presentación'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
            {/* Section: Información general */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Información general</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Nombre genérico *</Label>
                  <Input {...form.register('nombre_generico')} placeholder="Ej: Acetaminofén" className="h-8 text-xs mt-1" />
                  {form.formState.errors.nombre_generico && <p className="text-[10px] text-destructive mt-0.5">{form.formState.errors.nombre_generico.message}</p>}
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Nombre comercial</Label>
                  <Input {...form.register('nombre_comercial')} placeholder="Ej: Dolex" className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Tipo de producto *</Label>
                  <Select value={tipoProducto} onValueChange={(v) => form.setValue('tipo_producto', v as any, { shouldValidate: true })}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicamento" className="text-xs">Medicamento</SelectItem>
                      <SelectItem value="insumo" className="text-xs">Insumo</SelectItem>
                      <SelectItem value="dispositivo_medico" className="text-xs">Dispositivo médico</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tipo_producto && <p className="text-[10px] text-destructive mt-0.5">{form.formState.errors.tipo_producto.message}</p>}
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Fabricante</Label>
                  <Input {...form.register('fabricante')} placeholder="Ej: Pfizer" className="h-8 text-xs mt-1" />
                </div>

                {/* Conditional medication fields with animation */}
                <div className={cn(
                  "transition-all duration-300 ease-in-out overflow-hidden",
                  isMed ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
                )}>
                  <Label className="text-[11px] text-muted-foreground">Principio activo</Label>
                  <Input {...form.register('principio_activo')} placeholder="Ej: Paracetamol" className="h-8 text-xs mt-1" />
                </div>
                <div className={cn(
                  "transition-all duration-300 ease-in-out overflow-hidden",
                  isMed ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
                )}>
                  <Label className="text-[11px] text-muted-foreground">Código ATC</Label>
                  <Input {...form.register('codigo_atc')} placeholder="Ej: N02BE01" className="h-8 text-xs mt-1" />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.watch('requiere_cadena_frio')} onCheckedChange={(v) => form.setValue('requiere_cadena_frio', v)} />
                  <Label className="text-xs">Requiere cadena de frío</Label>
                </div>
                <div className={cn(
                  "flex items-center gap-2 transition-all duration-300 ease-in-out",
                  isMed ? "opacity-100 max-w-xs" : "opacity-0 max-w-0 overflow-hidden"
                )}>
                  <Switch checked={form.watch('controlado')} onCheckedChange={(v) => form.setValue('controlado', v)} />
                  <Label className="text-xs whitespace-nowrap">Sustancia controlada</Label>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/40" />

            {/* Section: Presentaciones */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Presentaciones</p>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => append(emptyPresentacion())}>
                  <Plus className="w-3 h-3" /> Agregar
                </Button>
              </div>
              {form.formState.errors.presentaciones?.root && (
                <p className="text-[10px] text-destructive mb-2">{form.formState.errors.presentaciones.root.message}</p>
              )}
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/40">
                        <th className="text-left font-medium text-muted-foreground px-2 py-2">Forma *</th>
                        <th className="text-left font-medium text-muted-foreground px-2 py-2">Concentración</th>
                        <th className="text-left font-medium text-muted-foreground px-2 py-2">Unidad *</th>
                        <th className="text-left font-medium text-muted-foreground px-2 py-2">Vía</th>
                        <th className="text-left font-medium text-muted-foreground px-2 py-2">Presentación comercial</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, idx) => (
                        <React.Fragment key={field.id}>
                          <tr className="border-b border-border/20">
                            <td className="px-2 py-1.5">
                              <Select
                                value={form.watch(`presentaciones.${idx}.forma_farmaceutica`)}
                                onValueChange={(v) => form.setValue(`presentaciones.${idx}.forma_farmaceutica`, v, { shouldValidate: true })}
                              >
                                <SelectTrigger className="h-7 text-xs min-w-[110px]">
                                  <SelectValue placeholder="Forma" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FORMAS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1.5">
                              <Input {...form.register(`presentaciones.${idx}.concentracion`)} placeholder="500mg" className="h-7 text-xs min-w-[80px]" />
                            </td>
                            <td className="px-2 py-1.5">
                              <Select
                                value={form.watch(`presentaciones.${idx}.unidad_medida`)}
                                onValueChange={(v) => form.setValue(`presentaciones.${idx}.unidad_medida`, v, { shouldValidate: true })}
                              >
                                <SelectTrigger className="h-7 text-xs min-w-[80px]">
                                  <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIDADES.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1.5">
                              <Select
                                value={form.watch(`presentaciones.${idx}.via_administracion`) || ''}
                                onValueChange={(v) => form.setValue(`presentaciones.${idx}.via_administracion`, v)}
                              >
                                <SelectTrigger className="h-7 text-xs min-w-[90px]">
                                  <SelectValue placeholder="Vía" />
                                </SelectTrigger>
                                <SelectContent>
                                  {VIAS.map(v => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1.5">
                              <Input {...form.register(`presentaciones.${idx}.presentacion_comercial`)} placeholder="Caja x 30" className="h-7 text-xs min-w-[120px]" />
                            </td>
                            <td className="px-2 py-1.5">
                              {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { remove(idx); setOpenLotes(prev => { const n = { ...prev }; delete n[idx]; return n; }); }}>
                                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                              )}
                            </td>
                          </tr>
                          {/* Collapsible initial lot row - only for new products */}
                          {!isEdit && (
                            <tr className="border-b border-border/20">
                              <td colSpan={6} className="px-2 py-0">
                                <Collapsible open={!!openLotes[idx]} onOpenChange={() => toggleLote(idx)}>
                                  <CollapsibleTrigger asChild>
                                    <button type="button" className="flex items-center gap-1.5 py-1.5 text-[11px] text-primary/70 hover:text-primary transition-colors">
                                      <Package className="w-3 h-3" />
                                      <span>{openLotes[idx] ? 'Ocultar lote inicial' : '+ Agregar lote inicial (opcional)'}</span>
                                      <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", openLotes[idx] && "rotate-180")} />
                                    </button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2.5 pt-1">
                                      <div>
                                        <Label className="text-[10px] text-muted-foreground">Sede *</Label>
                                        <Select
                                          value={form.watch(`presentaciones.${idx}.lote_inicial.sede_id`) || ''}
                                          onValueChange={(v) => form.setValue(`presentaciones.${idx}.lote_inicial.sede_id`, v)}
                                        >
                                          <SelectTrigger className="h-7 text-xs mt-0.5">
                                            <SelectValue placeholder="Seleccionar sede" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {sedes.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.nombre}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-muted-foreground">N° Lote *</Label>
                                        <Input
                                          value={form.watch(`presentaciones.${idx}.lote_inicial.numero_lote`) || ''}
                                          onChange={(e) => form.setValue(`presentaciones.${idx}.lote_inicial.numero_lote`, e.target.value)}
                                          placeholder="LOT-001"
                                          className="h-7 text-xs mt-0.5"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-muted-foreground">Vencimiento *</Label>
                                        <DatePicker
                                          value={form.watch(`presentaciones.${idx}.lote_inicial.fecha_vencimiento`) as Date}
                                          onChange={(d) => form.setValue(`presentaciones.${idx}.lote_inicial.fecha_vencimiento`, d || null)}
                                          placeholder="Fecha"
                                          className="h-7 text-xs mt-0.5"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-muted-foreground">Cantidad *</Label>
                                        <Input
                                          type="number"
                                          min={1}
                                          value={form.watch(`presentaciones.${idx}.lote_inicial.cantidad_inicial`) ?? ''}
                                          onChange={(e) => form.setValue(`presentaciones.${idx}.lote_inicial.cantidad_inicial`, e.target.value ? parseInt(e.target.value) : null)}
                                          placeholder="10"
                                          className="h-7 text-xs mt-0.5"
                                        />
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-border/40">
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {isEdit ? 'Guardar cambios' : 'Guardar producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
