import React, { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, AlertTriangle, TrendingDown, Clock, Search, Filter, X, PackagePlus, Plus, Pencil } from 'lucide-react';
import { ProductoDialog } from '@/components/inventario/ProductoDialog';
import { RegistrarMovimientoDialog } from '@/components/inventario/RegistrarMovimientoDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ─── Metric Cards ───────────────────────────────────────────

function useMetric(key: string, queryFn: () => Promise<number>) {
  return useQuery({ queryKey: [key], queryFn, staleTime: 30_000 });
}

const MetricCard = ({ icon: Icon, label, value, loading, color }: {
  icon: React.ElementType; label: string; value?: number; loading: boolean; color: string;
}) => (
  <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", color)}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      {loading ? (
        <div className="h-6 w-16 bg-muted animate-pulse rounded mt-0.5" />
      ) : (
        <p className="text-xl font-bold text-foreground">{value?.toLocaleString() ?? 0}</p>
      )}
    </div>
  </div>
);

// ─── Alerts Section ─────────────────────────────────────────

interface AlertItem {
  type: 'vencido' | 'vencimiento_proximo' | 'stock_bajo';
  message: string;
}

function useAlerts() {
  return useQuery<AlertItem[]>({
    queryKey: ['inventario-alerts'],
    staleTime: 30_000,
    queryFn: async () => {
      const alerts: AlertItem[] = [];

      // Expired or expiring soon lots
      const now = new Date().toISOString().split('T')[0];
      const in90 = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

      const { data: lots } = await supabase
        .from('inventario_lotes')
        .select('numero_lote, fecha_vencimiento, stock_id, estado')
        .lte('fecha_vencimiento', in90)
        .eq('estado', 'disponible')
        .order('fecha_vencimiento', { ascending: true })
        .limit(10);

      if (lots && lots.length > 0) {
        const stockIds = [...new Set(lots.map(l => l.stock_id))];
        const { data: stocks } = await supabase
          .from('inventario_stock')
          .select('id, producto_id, sede_id')
          .in('id', stockIds);

        const prodIds = [...new Set((stocks || []).map(s => s.producto_id))];
        const sedeIds = [...new Set((stocks || []).map(s => s.sede_id))];

        const [{ data: prods }, { data: sedes }] = await Promise.all([
          supabase.from('catalogo_productos').select('id, nombre_generico').in('id', prodIds),
          supabase.from('sedes').select('id, nombre').in('id', sedeIds),
        ]);

        const prodMap = Object.fromEntries((prods || []).map(p => [p.id, p.nombre_generico]));
        const sedeMap = Object.fromEntries((sedes || []).map(s => [s.id, s.nombre]));
        const stockMap = Object.fromEntries((stocks || []).map(s => [s.id, s]));

        for (const lot of lots) {
          const stock = stockMap[lot.stock_id];
          if (!stock) continue;
          const isExpired = lot.fecha_vencimiento <= now;
          const prodName = prodMap[stock.producto_id] || 'Producto';
          const sedeName = sedeMap[stock.sede_id] || 'Sede';
          alerts.push({
            type: isExpired ? 'vencido' : 'vencimiento_proximo',
            message: isExpired
              ? `Vencido: ${prodName} — Lote ${lot.numero_lote} venció el ${format(new Date(lot.fecha_vencimiento), 'd MMM yyyy', { locale: es })} (${sedeName})`
              : `Por vencer: ${prodName} — Lote ${lot.numero_lote} vence el ${format(new Date(lot.fecha_vencimiento), 'd MMM yyyy', { locale: es })} (${sedeName})`,
          });
        }
      }

      // Low stock
      const { data: lowStock } = await supabase
        .from('inventario_stock')
        .select('producto_id, sede_id, cantidad_disponible, cantidad_minima')
        .gt('cantidad_minima', 0)
        .limit(100);

      if (lowStock) {
        const low = lowStock.filter(s => s.cantidad_disponible <= s.cantidad_minima);
        if (low.length > 0) {
          const prodIds = [...new Set(low.map(s => s.producto_id))];
          const sedeIds = [...new Set(low.map(s => s.sede_id))];
          const [{ data: prods }, { data: sedes }] = await Promise.all([
            supabase.from('catalogo_productos').select('id, nombre_generico').in('id', prodIds),
            supabase.from('sedes').select('id, nombre').in('id', sedeIds),
          ]);
          const prodMap = Object.fromEntries((prods || []).map(p => [p.id, p.nombre_generico]));
          const sedeMap = Object.fromEntries((sedes || []).map(s => [s.id, s.nombre]));

          for (const s of low.slice(0, 5)) {
            alerts.push({
              type: 'stock_bajo',
              message: `Stock bajo: ${prodMap[s.producto_id] || 'Producto'} — ${s.cantidad_disponible} unidades (mínimo: ${s.cantidad_minima}) en ${sedeMap[s.sede_id] || 'Sede'}`,
            });
          }
        }
      }

      return alerts.slice(0, 5);
    },
  });
}

const AlertRow = ({ alert }: { alert: AlertItem }) => {
  const isExpired = alert.type === 'vencido';
  const isLow = alert.type === 'stock_bajo';
  return (
    <div className={cn(
      "flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs",
      isExpired && "bg-destructive/8 text-destructive",
      isLow && "bg-yellow-500/8 text-yellow-700 dark:text-yellow-400",
      !isExpired && !isLow && "bg-orange-500/8 text-orange-700 dark:text-orange-400",
    )}>
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>{alert.message}</span>
    </div>
  );
};

// ─── Stock Table ────────────────────────────────────────────

interface StockRow {
  id: string;
  producto_nombre: string;
  tipo_producto: string;
  presentacion: string;
  sede_nombre: string;
  cantidad_disponible: number;
  cantidad_minima: number;
  cantidad_maxima: number;
  proxima_vencimiento: string | null;
}

function useStockData(search: string, sedeFilter: string, tipoFilter: string) {
  return useQuery<StockRow[]>({
    queryKey: ['inventario-stock-table', search, sedeFilter, tipoFilter],
    staleTime: 30_000,
    queryFn: async () => {
      // Fetch stock with related data
      const { data: stocks } = await supabase
        .from('inventario_stock')
        .select('id, producto_id, presentacion_id, sede_id, cantidad_disponible, cantidad_minima, cantidad_maxima')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!stocks || stocks.length === 0) return [];

      const prodIds = [...new Set(stocks.map(s => s.producto_id))];
      const presIds = [...new Set(stocks.map(s => s.presentacion_id))];
      const sedeIds = [...new Set(stocks.map(s => s.sede_id))];
      const stockIds = stocks.map(s => s.id);

      const [{ data: prods }, { data: pres }, { data: sedes }, { data: lots }] = await Promise.all([
        supabase.from('catalogo_productos').select('id, nombre_generico, tipo_producto').in('id', prodIds),
        supabase.from('presentaciones_producto').select('id, forma_farmaceutica, concentracion').in('id', presIds),
        supabase.from('sedes').select('id, nombre').in('id', sedeIds),
        supabase.from('inventario_lotes')
          .select('stock_id, fecha_vencimiento')
          .in('stock_id', stockIds)
          .eq('estado', 'disponible')
          .order('fecha_vencimiento', { ascending: true }),
      ]);

      const prodMap = Object.fromEntries((prods || []).map(p => [p.id, p]));
      const presMap = Object.fromEntries((pres || []).map(p => [p.id, p]));
      const sedeMap = Object.fromEntries((sedes || []).map(s => [s.id, s]));

      // Earliest expiry per stock_id
      const expiryMap: Record<string, string> = {};
      for (const lot of (lots || [])) {
        if (!expiryMap[lot.stock_id]) expiryMap[lot.stock_id] = lot.fecha_vencimiento;
      }

      let rows: StockRow[] = stocks.map(s => {
        const prod = prodMap[s.producto_id];
        const pres = presMap[s.presentacion_id];
        const sede = sedeMap[s.sede_id];
        return {
          id: s.id,
          producto_nombre: prod?.nombre_generico || '',
          tipo_producto: prod?.tipo_producto || '',
          presentacion: pres ? `${pres.forma_farmaceutica}${pres.concentracion ? ` ${pres.concentracion}` : ''}` : '',
          sede_nombre: sede?.nombre || '',
          sede_id: s.sede_id,
          cantidad_disponible: s.cantidad_disponible,
          cantidad_minima: s.cantidad_minima || 0,
          cantidad_maxima: s.cantidad_maxima || 0,
          proxima_vencimiento: expiryMap[s.id] || null,
        };
      });

      // Apply filters
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(r => r.producto_nombre.toLowerCase().includes(q) || r.presentacion.toLowerCase().includes(q));
      }
      if (sedeFilter && sedeFilter !== 'all') {
        rows = rows.filter(r => (r as any).sede_id === sedeFilter);
      }
      if (tipoFilter && tipoFilter !== 'all') {
        rows = rows.filter(r => r.tipo_producto === tipoFilter);
      }

      return rows;
    },
  });
}

function useSedes() {
  return useQuery({
    queryKey: ['sedes-list'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('sedes').select('id, nombre').eq('activo', true).order('nombre');
      return data || [];
    },
  });
}

const tipoBadgeClass: Record<string, string> = {
  medicamento: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  insumo: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  dispositivo_medico: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
};

const tipoLabel: Record<string, string> = {
  medicamento: 'Medicamento',
  insumo: 'Insumo',
  dispositivo_medico: 'Dispositivo',
};

function StockDot({ cantidad, minima }: { cantidad: number; minima: number }) {
  const color = cantidad === 0
    ? 'bg-destructive'
    : minima > 0 && cantidad <= minima
      ? 'bg-yellow-500'
      : 'bg-emerald-500';
  return <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", color)} />;
}

// ─── Catálogo Tab ──────────────────────────────────────────

function CatalogoTab({ onEdit }: { onEdit: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['catalogo-productos', debouncedSearch],
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase.from('catalogo_productos').select('id, codigo, nombre_generico, nombre_comercial, tipo_producto, principio_activo, fabricante, activo, controlado, requiere_cadena_frio').eq('activo', true).order('nombre_generico').limit(200);
      if (debouncedSearch) {
        q = q.or(`nombre_generico.ilike.%${debouncedSearch}%,nombre_comercial.ilike.%${debouncedSearch}%,codigo.ilike.%${debouncedSearch}%`);
      }
      const { data } = await q;
      return data || [];
    },
  });

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Buscar en catálogo..." className="h-8 text-xs pl-8" />
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Código</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Nombre genérico</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Comercial</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Tipo</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Principio activo</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Fabricante</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-3 py-2.5"><div className="h-4 bg-muted animate-pulse rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : (data || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay productos en el catálogo</p>
                  </td>
                </tr>
              ) : (data || []).map(row => (
                <tr key={row.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => onEdit(row.id)}>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{row.codigo}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{row.nombre_generico}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.nombre_comercial || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium", tipoBadgeClass[row.tipo_producto] || 'bg-muted text-muted-foreground')}>
                      {tipoLabel[row.tipo_producto] || row.tipo_producto}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.principio_activo || '—'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.fabricante || '—'}</td>
                  <td className="px-3 py-2.5">
                    <Pencil className="w-3 h-3 text-muted-foreground/50" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

const InventarioPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sedeFilter, setSedeFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [showMovement, setShowMovement] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  // Metrics
  const totalProducts = useMetric('inv-total-products', async () => {
    const { count } = await supabase.from('catalogo_productos').select('id', { count: 'exact', head: true }).eq('activo', true);
    return count || 0;
  });
  const totalStock = useMetric('inv-total-stock', async () => {
    const { data } = await supabase.from('inventario_stock').select('cantidad_disponible');
    return (data || []).reduce((sum, r) => sum + (r.cantidad_disponible || 0), 0);
  });
  const lowStock = useMetric('inv-low-stock', async () => {
    const { data } = await supabase.from('inventario_stock').select('cantidad_disponible, cantidad_minima').gt('cantidad_minima', 0);
    return (data || []).filter(r => r.cantidad_disponible <= r.cantidad_minima).length;
  });
  const expiringSoon = useMetric('inv-expiring', async () => {
    const in90 = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
    const { count } = await supabase.from('inventario_lotes').select('id', { count: 'exact', head: true }).lte('fecha_vencimiento', in90).eq('estado', 'disponible');
    return count || 0;
  });

  const alerts = useAlerts();
  const stockData = useStockData(debouncedSearch, sedeFilter, tipoFilter);
  const sedes = useSedes();

  const hasActiveFilters = sedeFilter !== 'all' || tipoFilter !== 'all' || search.length > 0;

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inventario</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestión de stock, lotes y movimientos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowMovement(true)}>
            <PackagePlus className="w-3.5 h-3.5" />
            Registrar movimiento
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNewProduct(true)}>
            <Plus className="w-3.5 h-3.5" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Package} label="Total productos" value={totalProducts.data} loading={totalProducts.isLoading} color="bg-primary/10 text-primary" />
        <MetricCard icon={Package} label="Stock disponible" value={totalStock.data} loading={totalStock.isLoading} color="bg-emerald-500/10 text-emerald-600" />
        <MetricCard icon={TrendingDown} label="Stock bajo" value={lowStock.data} loading={lowStock.isLoading} color="bg-yellow-500/10 text-yellow-600" />
        <MetricCard icon={Clock} label="Por vencer (90d)" value={expiringSoon.data} loading={expiringSoon.isLoading} color="bg-orange-500/10 text-orange-600" />
      </div>

      {/* Alerts */}
      {alerts.data && alerts.data.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Alertas</p>
          {alerts.data.map((a, i) => <AlertRow key={i} alert={a} />)}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none h-9 w-full justify-start gap-4 px-0">
          <TabsTrigger value="stock" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-xs font-medium">
            Stock por sede
          </TabsTrigger>
          <TabsTrigger value="catalogo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-xs font-medium">
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="lotes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-xs font-medium">
            Lotes
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-xs font-medium">
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Buscar producto o presentación..."
                className="h-8 text-xs pl-8"
              />
            </div>
            <Select value={sedeFilter} onValueChange={setSedeFilter}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todas las sedes</SelectItem>
                {(sedes.data || []).map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos los tipos</SelectItem>
                <SelectItem value="medicamento" className="text-xs">Medicamento</SelectItem>
                <SelectItem value="insumo" className="text-xs">Insumo</SelectItem>
                <SelectItem value="dispositivo_medico" className="text-xs">Dispositivo</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => { setSearch(''); setDebouncedSearch(''); setSedeFilter('all'); setTipoFilter('all'); }}>
                <X className="w-3 h-3" /> Limpiar
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Producto</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Tipo</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Presentación</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Sede</th>
                    <th className="text-right font-medium text-muted-foreground px-3 py-2.5">Stock</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Estado</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Próx. vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/20">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-3 py-2.5"><div className="h-4 bg-muted animate-pulse rounded w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : (stockData.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No hay registros de stock</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">Los registros aparecerán cuando se agreguen movimientos de inventario</p>
                      </td>
                    </tr>
                  ) : (stockData.data || []).map(row => {
                    const statusLabel = row.cantidad_disponible === 0
                      ? 'Agotado'
                      : row.cantidad_minima > 0 && row.cantidad_disponible <= row.cantidad_minima
                        ? 'Bajo'
                        : 'Disponible';
                    return (
                      <tr key={row.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-foreground">{row.producto_nombre}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium", tipoBadgeClass[row.tipo_producto] || 'bg-muted text-muted-foreground')}>
                            {tipoLabel[row.tipo_producto] || row.tipo_producto}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{row.presentacion}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{row.sede_nombre}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            <StockDot cantidad={row.cantidad_disponible} minima={row.cantidad_minima} />
                            <span className="font-medium text-foreground">{row.cantidad_disponible}</span>
                            {row.cantidad_minima > 0 && (
                              <span className="text-muted-foreground/60">/ {row.cantidad_minima}</span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={statusLabel === 'Agotado' ? 'destructive' : statusLabel === 'Bajo' ? 'warning' : 'secondary'} className="text-[10px] h-5">
                            {statusLabel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {row.proxima_vencimiento
                            ? format(new Date(row.proxima_vencimiento), 'd MMM yyyy', { locale: es })
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="catalogo" className="mt-4">
          <CatalogoTab onEdit={(id) => { setEditProductId(id); setShowNewProduct(true); }} />
        </TabsContent>
        <TabsContent value="lotes" className="mt-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Gestión de lotes</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Próximamente</p>
          </div>
        </TabsContent>
        <TabsContent value="movimientos" className="mt-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Historial de movimientos</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Próximamente</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProductoDialog
        open={showNewProduct}
        onOpenChange={(v) => { setShowNewProduct(v); if (!v) setEditProductId(null); }}
        editProductId={editProductId}
      />
      <RegistrarMovimientoDialog open={showMovement} onOpenChange={setShowMovement} />
    </div>
  );
};

export default InventarioPage;
