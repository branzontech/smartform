import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, CalendarIcon, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TIPOS_MOVIMIENTO = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste_positivo', label: 'Ajuste positivo' },
  { value: 'ajuste_negativo', label: 'Ajuste negativo' },
  { value: 'transferencia_entrada', label: 'Transferencia entrada' },
  { value: 'transferencia_salida', label: 'Transferencia salida' },
  { value: 'devolucion', label: 'Devolución' },
];

const TIPOS_ENTRADA = ['entrada', 'transferencia_entrada', 'devolucion'];
const TIPOS_SALIDA = ['salida', 'ajuste_negativo', 'transferencia_salida'];

const tipoLabel: Record<string, string> = Object.fromEntries(TIPOS_MOVIMIENTO.map(t => [t.value, t.label]));

// Schema is dynamic based on tipo_movimiento so we validate manually for lote fields
const baseSchema = z.object({
  tipo_movimiento: z.string().min(1, 'Requerido'),
  producto_id: z.string().uuid('Selecciona un producto'),
  presentacion_id: z.string().uuid('Selecciona un producto'),
  sede_id: z.string().uuid('Selecciona una sede'),
  cantidad: z.number({ required_error: 'Requerido' }).int().min(1, 'Mínimo 1'),
  motivo: z.string().trim().max(500).optional().or(z.literal('')),
  // Lote fields (conditional)
  lote_mode: z.enum(['nuevo', 'existente']).optional(),
  lote_id: z.string().optional().or(z.literal('')),
  numero_lote: z.string().optional().or(z.literal('')),
  fecha_fabricacion: z.date().optional().nullable(),
  fecha_vencimiento: z.date().optional().nullable(),
  numero_serie: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof baseSchema>;

interface ProductOption {
  producto_id: string;
  presentacion_id: string;
  nombre_generico: string;
  concentracion: string | null;
  forma_farmaceutica: string;
  tipo_producto: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegistrarMovimientoDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      tipo_movimiento: '',
      producto_id: '',
      presentacion_id: '',
      sede_id: '',
      cantidad: undefined as any,
      motivo: '',
      lote_mode: 'nuevo',
      lote_id: '',
      numero_lote: '',
      fecha_fabricacion: null,
      fecha_vencimiento: null,
      numero_serie: '',
    },
  });

  const tipoMov = form.watch('tipo_movimiento');
  const sedeId = form.watch('sede_id');
  const presentacionId = form.watch('presentacion_id');
  const loteMode = form.watch('lote_mode');
  const isEntrada = TIPOS_ENTRADA.includes(tipoMov);
  const isSalida = TIPOS_SALIDA.includes(tipoMov);
  const isDispositivo = selectedProduct?.tipo_producto === 'dispositivo_medico';

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedProduct(null);
      setProductSearch('');
      setProductResults([]);
    }
  }, [open]);

  // Reset lote fields when tipo changes
  useEffect(() => {
    form.setValue('lote_mode', isEntrada ? 'nuevo' : 'existente');
    form.setValue('lote_id', '');
    form.setValue('numero_lote', '');
    form.setValue('fecha_fabricacion', null);
    form.setValue('fecha_vencimiento', null);
    form.setValue('numero_serie', '');
  }, [tipoMov]);

  // Sedes
  const sedes = useQuery({
    queryKey: ['sedes-mov'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('sedes').select('id, nombre').eq('activo', true).order('nombre');
      return data || [];
    },
  });

  // Product search with debounce
  const searchProducts = useCallback(async (term: string) => {
    if (term.length < 2) { setProductResults([]); return; }
    setProductLoading(true);
    try {
      const { data: prods } = await supabase
        .from('catalogo_productos')
        .select('id, nombre_generico, tipo_producto')
        .eq('activo', true)
        .ilike('nombre_generico', `%${term}%`)
        .limit(20);

      if (!prods || prods.length === 0) { setProductResults([]); return; }

      const prodIds = prods.map(p => p.id);
      const { data: pres } = await supabase
        .from('presentaciones_producto')
        .select('id, producto_id, forma_farmaceutica, concentracion')
        .in('producto_id', prodIds)
        .eq('activo', true);

      const prodMap = Object.fromEntries(prods.map(p => [p.id, p]));
      const results: ProductOption[] = (pres || []).map(pr => {
        const prod = prodMap[pr.producto_id];
        return {
          producto_id: pr.producto_id,
          presentacion_id: pr.id,
          nombre_generico: prod?.nombre_generico || '',
          concentracion: pr.concentracion,
          forma_farmaceutica: pr.forma_farmaceutica,
          tipo_producto: prod?.tipo_producto || '',
        };
      });
      setProductResults(results);
      setDropdownOpen(true);
    } finally {
      setProductLoading(false);
    }
  }, []);

  const handleProductSearch = (val: string) => {
    setProductSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.length >= 2) {
      searchTimer.current = setTimeout(() => searchProducts(val), 300);
    } else {
      setProductResults([]);
      setDropdownOpen(false);
    }
  };

  const selectProduct = (p: ProductOption) => {
    setSelectedProduct(p);
    const label = `${p.nombre_generico} — ${p.concentracion || ''} ${p.forma_farmaceutica}`.trim();
    setProductSearch(label);
    form.setValue('producto_id', p.producto_id, { shouldValidate: true });
    form.setValue('presentacion_id', p.presentacion_id, { shouldValidate: true });
    setDropdownOpen(false);
  };

  // Load existing lotes for the selected presentacion + sede
  const existingLotes = useQuery({
    queryKey: ['lotes-for-movement', presentacionId, sedeId],
    enabled: !!presentacionId && !!sedeId,
    queryFn: async () => {
      // First find the stock_id
      const { data: stock } = await supabase
        .from('inventario_stock')
        .select('id')
        .eq('presentacion_id', presentacionId)
        .eq('sede_id', sedeId)
        .maybeSingle();

      if (!stock) return [];

      const { data: lots } = await supabase
        .from('inventario_lotes')
        .select('id, numero_lote, cantidad, fecha_vencimiento')
        .eq('stock_id', stock.id)
        .eq('estado', 'disponible')
        .order('fecha_vencimiento', { ascending: true });

      return lots || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error('No autenticado');

      // 1. Find or create inventario_stock
      let { data: stock } = await supabase
        .from('inventario_stock')
        .select('id, cantidad_disponible')
        .eq('presentacion_id', values.presentacion_id)
        .eq('sede_id', values.sede_id)
        .maybeSingle();

      if (!stock) {
        // Create stock entry with 0
        const { data: newStock, error: stockErr } = await supabase
          .from('inventario_stock')
          .insert({
            producto_id: values.producto_id,
            presentacion_id: values.presentacion_id,
            sede_id: values.sede_id,
            cantidad_disponible: 0,
          })
          .select('id, cantidad_disponible')
          .single();
        if (stockErr) throw stockErr;
        stock = newStock;
      }

      let loteId: string | null = null;
      let loteNumero = '';

      if (isEntrada && values.lote_mode === 'nuevo') {
        // Validate new lote fields
        if (!values.numero_lote?.trim()) throw new Error('Número de lote es requerido');
        if (!values.fecha_vencimiento) throw new Error('Fecha de vencimiento es requerida');
        if (values.fecha_vencimiento <= new Date()) throw new Error('La fecha de vencimiento debe ser futura');

        const { data: lote, error: loteErr } = await supabase
          .from('inventario_lotes')
          .insert({
            stock_id: stock.id,
            numero_lote: values.numero_lote.trim(),
            fecha_fabricacion: values.fecha_fabricacion ? values.fecha_fabricacion.toISOString().split('T')[0] : null,
            fecha_vencimiento: values.fecha_vencimiento.toISOString().split('T')[0],
            numero_serie: isDispositivo ? (values.numero_serie || null) : null,
            cantidad: 0, // trigger will update
            estado: 'disponible',
          })
          .select('id')
          .single();
        if (loteErr) throw loteErr;
        loteId = lote.id;
        loteNumero = values.numero_lote.trim();
      } else if (values.lote_id) {
        loteId = values.lote_id;
        const match = (existingLotes.data || []).find(l => l.id === values.lote_id);
        loteNumero = match?.numero_lote || '';
      }

      // Insert movement (trigger handles stock update)
      const { error } = await supabase.from('inventario_movimientos').insert({
        stock_id: stock.id,
        lote_id: loteId,
        tipo_movimiento: values.tipo_movimiento,
        cantidad: values.cantidad,
        motivo: values.motivo || null,
        usuario_id: user.id,
      });
      if (error) throw error;

      return {
        tipo: tipoLabel[values.tipo_movimiento] || values.tipo_movimiento,
        cantidad: values.cantidad,
        producto: selectedProduct?.nombre_generico || 'Producto',
        lote: loteNumero,
        stockDisponible: stock.cantidad_disponible,
      };
    },
    onSuccess: (result) => {
      const loteInfo = result.lote ? ` — Lote ${result.lote}` : '';
      toast.success(`${result.tipo} registrada: ${result.cantidad} x ${result.producto}${loteInfo}`);
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['inventario-stock-table'] });
      queryClient.invalidateQueries({ queryKey: ['inv-total-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inv-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inv-total-products'] });
      queryClient.invalidateQueries({ queryKey: ['inv-expiring'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['lotes-for-movement'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-lotes'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err.message || '';
      if (msg.includes('Stock insuficiente')) {
        toast.error('Error: Stock insuficiente para este movimiento');
      } else {
        toast.error(msg || 'Error al registrar movimiento');
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    // Extra validation for salida lote
    if (isSalida && (existingLotes.data || []).length > 0 && !values.lote_id) {
      toast.error('Selecciona un lote para este tipo de movimiento');
      return;
    }
    mutation.mutate(values);
  };

  const hasLotes = (existingLotes.data || []).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-semibold">Registrar movimiento</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registra entradas, salidas y ajustes de inventario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
            {/* Main fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
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

              {/* Sede */}
              <div>
                <Label className="text-[11px] text-muted-foreground">Sede *</Label>
                <Controller
                  name="sede_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Seleccionar sede" />
                      </SelectTrigger>
                      <SelectContent>
                        {(sedes.data || []).map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.sede_id && <p className="text-[10px] text-destructive mt-0.5">{form.formState.errors.sede_id.message}</p>}
              </div>
            </div>

            {/* Product search - full width */}
            <div className="relative">
              <Label className="text-[11px] text-muted-foreground">Producto *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={e => handleProductSearch(e.target.value)}
                  placeholder="Buscar producto por nombre..."
                  className="h-8 text-xs pl-8"
                  onFocus={() => productResults.length > 0 && setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                />
                {productLoading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              </div>
              {dropdownOpen && productResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {productResults.map(p => (
                    <button
                      key={`${p.producto_id}-${p.presentacion_id}`}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors"
                      onMouseDown={() => selectProduct(p)}
                    >
                      <span className="font-medium">{p.nombre_generico}</span>
                      <span className="text-muted-foreground"> — {p.concentracion || ''} {p.forma_farmaceutica}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.formState.errors.producto_id && <p className="text-[10px] text-destructive mt-0.5">{form.formState.errors.producto_id.message}</p>}
            </div>

            {/* Cantidad + Motivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
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
              <div>
                <Label className="text-[11px] text-muted-foreground">Motivo</Label>
                <Textarea
                  {...form.register('motivo')}
                  placeholder="Razón del movimiento..."
                  className="min-h-[32px] h-8 text-xs mt-1 resize-none"
                  rows={1}
                />
              </div>
            </div>

            {/* Conditional Lote Section */}
            {tipoMov && selectedProduct && sedeId && (isEntrada || isSalida) && (
              <>
                <div className="border-t border-border/40" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Información del lote</p>

                  {isEntrada && (
                    <div className="space-y-3">
                      <Controller
                        name="lote_mode"
                        control={form.control}
                        render={({ field }) => (
                          <RadioGroup
                            value={field.value || 'nuevo'}
                            onValueChange={field.onChange}
                            className="flex gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="nuevo" id="lote-nuevo" />
                              <Label htmlFor="lote-nuevo" className="text-xs cursor-pointer">Crear lote nuevo</Label>
                            </div>
                            {hasLotes && (
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="existente" id="lote-existente" />
                                <Label htmlFor="lote-existente" className="text-xs cursor-pointer">Seleccionar lote existente</Label>
                              </div>
                            )}
                          </RadioGroup>
                        )}
                      />

                      {loteMode === 'nuevo' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Número de lote *</Label>
                            <Input {...form.register('numero_lote')} placeholder="Ej: LOT-2024-001" className="h-8 text-xs mt-1" />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Fecha de fabricación</Label>
                            <Controller
                              name="fecha_fabricacion"
                              control={form.control}
                              render={({ field }) => (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("h-8 text-xs mt-1 w-full justify-start font-normal", !field.value && "text-muted-foreground")}>
                                      <CalendarIcon className="w-3 h-3 mr-1.5" />
                                      {field.value ? format(field.value, 'dd/MM/yyyy') : 'Seleccionar'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                                  </PopoverContent>
                                </Popover>
                              )}
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Fecha de vencimiento *</Label>
                            <Controller
                              name="fecha_vencimiento"
                              control={form.control}
                              render={({ field }) => (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("h-8 text-xs mt-1 w-full justify-start font-normal", !field.value && "text-muted-foreground")}>
                                      <CalendarIcon className="w-3 h-3 mr-1.5" />
                                      {field.value ? format(field.value, 'dd/MM/yyyy') : 'Seleccionar'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value || undefined}
                                      onSelect={field.onChange}
                                      disabled={(date) => date <= new Date()}
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                            />
                          </div>
                          {isDispositivo && (
                            <div>
                              <Label className="text-[11px] text-muted-foreground">Número de serie</Label>
                              <Input {...form.register('numero_serie')} placeholder="Ej: SN-12345" className="h-8 text-xs mt-1" />
                            </div>
                          )}
                        </div>
                      )}

                      {loteMode === 'existente' && hasLotes && (
                        <Controller
                          name="lote_id"
                          control={form.control}
                          render={({ field }) => (
                            <Select value={field.value || ''} onValueChange={field.onChange}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar lote" />
                              </SelectTrigger>
                              <SelectContent>
                                {(existingLotes.data || []).map(l => (
                                  <SelectItem key={l.id} value={l.id} className="text-xs">
                                    Lote {l.numero_lote} — Vence: {format(new Date(l.fecha_vencimiento), 'dd/MM/yyyy')} — Disponible: {l.cantidad}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}
                    </div>
                  )}

                  {isSalida && (
                    <div>
                      {hasLotes ? (
                        <Controller
                          name="lote_id"
                          control={form.control}
                          render={({ field }) => (
                            <Select value={field.value || ''} onValueChange={field.onChange}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Seleccionar lote *" />
                              </SelectTrigger>
                              <SelectContent>
                                {(existingLotes.data || []).map(l => (
                                  <SelectItem key={l.id} value={l.id} className="text-xs">
                                    Lote {l.numero_lote} — Vence: {format(new Date(l.fecha_vencimiento), 'dd/MM/yyyy')} — Disponible: {l.cantidad}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 text-xs text-muted-foreground">
                          <Package className="w-4 h-4 shrink-0" />
                          <span>No hay lotes registrados para este producto en esta sede. El movimiento se aplicará directamente al stock.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/40">
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Registrar movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
