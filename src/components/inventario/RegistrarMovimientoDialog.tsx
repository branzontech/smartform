import React, { useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

const TIPOS_MOVIMIENTO = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste_positivo', label: 'Ajuste positivo' },
  { value: 'ajuste_negativo', label: 'Ajuste negativo' },
  { value: 'transferencia_entrada', label: 'Transferencia entrada' },
  { value: 'transferencia_salida', label: 'Transferencia salida' },
  { value: 'devolucion', label: 'Devolución' },
];

const schema = z.object({
  tipo_movimiento: z.string().min(1, 'Requerido'),
  stock_id: z.string().uuid('Selecciona un producto'),
  lote_id: z.string().optional().or(z.literal('')),
  cantidad: z.number({ required_error: 'Requerido' }).int().min(1, 'Mínimo 1'),
  motivo: z.string().trim().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ProductResult {
  stock_id: string;
  producto_nombre: string;
  presentacion: string;
  sede_id: string;
  sede_nombre: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegistrarMovimientoDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [sedeFilter, setSedeFilter] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_movimiento: '',
      stock_id: '',
      lote_id: '',
      cantidad: undefined as any,
      motivo: '',
    },
  });

  const stockId = form.watch('stock_id');

  // Sedes
  const sedes = useQuery({
    queryKey: ['sedes-mov'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('sedes').select('id, nombre').eq('activo', true).order('nombre');
      return data || [];
    },
  });

  // Product search
  const searchProducts = useCallback(async (term: string, sede: string) => {
    if (term.length < 2) { setProductResults([]); return; }
    setProductLoading(true);

    let stockQuery = supabase
      .from('inventario_stock')
      .select('id, producto_id, presentacion_id, sede_id')
      .limit(20);

    if (sede) stockQuery = stockQuery.eq('sede_id', sede);

    const { data: stocks } = await stockQuery;
    if (!stocks || stocks.length === 0) { setProductResults([]); setProductLoading(false); return; }

    const prodIds = [...new Set(stocks.map(s => s.producto_id))];
    const presIds = [...new Set(stocks.map(s => s.presentacion_id))];
    const sedeIds = [...new Set(stocks.map(s => s.sede_id))];

    const [{ data: prods }, { data: pres }, { data: sedesData }] = await Promise.all([
      supabase.from('catalogo_productos').select('id, nombre_generico').in('id', prodIds).ilike('nombre_generico', `%${term}%`),
      supabase.from('presentaciones_producto').select('id, forma_farmaceutica, concentracion').in('id', presIds),
      supabase.from('sedes').select('id, nombre').in('id', sedeIds),
    ]);

    const presMap = Object.fromEntries((pres || []).map(p => [p.id, p]));
    const sedeMap = Object.fromEntries((sedesData || []).map(s => [s.id, s]));
    const matchedProdIds = new Set((prods || []).map(p => p.id));
    const prodMap = Object.fromEntries((prods || []).map(p => [p.id, p]));

    const results: ProductResult[] = stocks
      .filter(s => matchedProdIds.has(s.producto_id))
      .map(s => {
        const prod = prodMap[s.producto_id];
        const pre = presMap[s.presentacion_id];
        const sede = sedeMap[s.sede_id];
        return {
          stock_id: s.id,
          producto_nombre: prod?.nombre_generico || '',
          presentacion: pre ? `${pre.concentracion || ''} ${pre.forma_farmaceutica}`.trim() : '',
          sede_id: s.sede_id,
          sede_nombre: sede?.nombre || '',
        };
      });

    setProductResults(results);
    setProductLoading(false);
    setProductDropdownOpen(true);
  }, []);

  const handleProductSearch = (val: string) => {
    setProductSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.length >= 2) {
      searchTimer.current = setTimeout(() => searchProducts(val, sedeFilter), 300);
    } else {
      setProductResults([]);
      setProductDropdownOpen(false);
    }
  };

  const selectProduct = (p: ProductResult) => {
    setSelectedProduct(p);
    setProductSearch(`${p.producto_nombre} — ${p.presentacion} (${p.sede_nombre})`);
    form.setValue('stock_id', p.stock_id, { shouldValidate: true });
    setProductDropdownOpen(false);
  };

  // Lotes for selected stock
  const lotes = useQuery({
    queryKey: ['lotes-for-stock', stockId],
    enabled: !!stockId,
    queryFn: async () => {
      const { data } = await supabase
        .from('inventario_lotes')
        .select('id, numero_lote, cantidad, fecha_vencimiento')
        .eq('stock_id', stockId)
        .eq('estado', 'disponible')
        .order('fecha_vencimiento', { ascending: true });
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error('No autenticado');
      const { error } = await supabase.from('inventario_movimientos').insert({
        stock_id: values.stock_id,
        lote_id: values.lote_id || null,
        tipo_movimiento: values.tipo_movimiento,
        cantidad: values.cantidad,
        motivo: values.motivo || null,
        usuario_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Movimiento registrado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['inventario-stock-table'] });
      queryClient.invalidateQueries({ queryKey: ['inv-total-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inv-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-alerts'] });
      form.reset();
      setSelectedProduct(null);
      setProductSearch('');
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err.message || '';
      if (msg.includes('Stock insuficiente')) {
        toast.error('Stock insuficiente para realizar este movimiento');
      } else {
        toast.error(msg || 'Error al registrar movimiento');
      }
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Registrar movimiento</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Tipo movimiento */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Tipo de movimiento *</Label>
            <Controller
              name="tipo_movimiento"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MOVIMIENTO.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.tipo_movimiento && <p className="text-[10px] text-destructive mt-0.5">{form.formState.errors.tipo_movimiento.message}</p>}
          </div>

          {/* Sede filter */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Filtrar por sede</Label>
            <Select value={sedeFilter} onValueChange={(v) => { setSedeFilter(v === 'all' ? '' : v); setProductSearch(''); setSelectedProduct(null); form.setValue('stock_id', ''); }}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue placeholder="Todas las sedes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todas las sedes</SelectItem>
                {(sedes.data || []).map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product search */}
          <div className="relative">
            <Label className="text-[11px] text-muted-foreground">Producto *</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={e => handleProductSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="h-8 text-xs pl-8"
                onFocus={() => productResults.length > 0 && setProductDropdownOpen(true)}
                onBlur={() => setTimeout(() => setProductDropdownOpen(false), 200)}
              />
              {productLoading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>
            {productDropdownOpen && productResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                {productResults.map(p => (
                  <button
                    key={p.stock_id}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                    onMouseDown={() => selectProduct(p)}
                  >
                    <span className="font-medium">{p.producto_nombre}</span>
                    {p.presentacion && <span className="text-muted-foreground"> — {p.presentacion}</span>}
                    <span className="text-muted-foreground/60 ml-1">({p.sede_nombre})</span>
                  </button>
                ))}
              </div>
            )}
            {form.formState.errors.stock_id && <p className="text-[10px] text-destructive mt-0.5">{form.formState.errors.stock_id.message}</p>}
          </div>

          {/* Lote */}
          {stockId && (lotes.data || []).length > 0 && (
            <div>
              <Label className="text-[11px] text-muted-foreground">Lote (opcional)</Label>
              <Controller
                name="lote_id"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Sin lote específico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-xs">Sin lote específico</SelectItem>
                      {(lotes.data || []).map(l => (
                        <SelectItem key={l.id} value={l.id} className="text-xs">
                          {l.numero_lote} — {l.cantidad} uds — Vence: {l.fecha_vencimiento}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Cantidad */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Cantidad *</Label>
            <Input
              type="number"
              min={1}
              {...form.register('cantidad', { valueAsNumber: true })}
              placeholder="10"
              className="h-8 text-xs mt-1"
            />
            {form.formState.errors.cantidad && <p className="text-[10px] text-destructive mt-0.5">{form.formState.errors.cantidad.message}</p>}
          </div>

          {/* Motivo */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Motivo</Label>
            <Textarea
              {...form.register('motivo')}
              placeholder="Razón del movimiento..."
              className="min-h-[60px] text-xs mt-1 resize-y"
              rows={2}
            />
          </div>

          <div className="pt-3 border-t flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="flex-1 h-8 text-xs" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
