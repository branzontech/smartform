import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

const schema = z.object({
  nombre_generico: z.string().trim().min(1, 'Requerido').max(200),
  nombre_comercial: z.string().trim().max(200).optional().or(z.literal('')),
  tipo_producto: z.enum(['medicamento', 'insumo', 'dispositivo_medico'], { required_error: 'Selecciona un tipo' }),
  principio_activo: z.string().trim().max(200).optional().or(z.literal('')),
  codigo_atc: z.string().trim().max(20).optional().or(z.literal('')),
  fabricante: z.string().trim().max(200).optional().or(z.literal('')),
  requiere_cadena_frio: z.boolean().default(false),
  controlado: z.boolean().default(false),
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
}

export const NuevoProductoSheet: React.FC<Props> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
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
    },
  });

  const tipoProducto = form.watch('tipo_producto');
  const isMed = tipoProducto === 'medicamento';

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const codigo = `${values.tipo_producto === 'medicamento' ? 'MED' : values.tipo_producto === 'insumo' ? 'INS' : 'DIS'}-${nanoid(6).toUpperCase()}`;
      const { error } = await supabase.from('catalogo_productos').insert({
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Producto creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['inv-total-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-stock-table'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al crear producto');
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">Nuevo producto</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          {isMed && (
            <>
              <div>
                <Label className="text-[11px] text-muted-foreground">Principio activo</Label>
                <Input {...form.register('principio_activo')} placeholder="Ej: Paracetamol" className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Código ATC</Label>
                <Input {...form.register('codigo_atc')} placeholder="Ej: N02BE01" className="h-8 text-xs mt-1" />
              </div>
            </>
          )}

          <div>
            <Label className="text-[11px] text-muted-foreground">Fabricante</Label>
            <Input {...form.register('fabricante')} placeholder="Ej: Pfizer" className="h-8 text-xs mt-1" />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="text-xs">Requiere cadena de frío</Label>
            <Switch checked={form.watch('requiere_cadena_frio')} onCheckedChange={(v) => form.setValue('requiere_cadena_frio', v)} />
          </div>

          {isMed && (
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs">Sustancia controlada</Label>
              <Switch checked={form.watch('controlado')} onCheckedChange={(v) => form.setValue('controlado', v)} />
            </div>
          )}

          <div className="pt-3 border-t flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="flex-1 h-8 text-xs" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Guardar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
