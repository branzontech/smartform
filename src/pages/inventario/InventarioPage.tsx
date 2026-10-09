import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from "@/integrations/data/client";
import { PackagePlus } from 'lucide-react';
import { ProductoDialog } from '@/components/inventario/ProductoDialog';
import { RegistrarMovimientoDialog } from '@/components/inventario/RegistrarMovimientoDialog';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from '@/components/kit/ModuleHeader';
import { RowActions } from '@/components/kit/RowActions';
import { FolderTabs, type FolderTab } from '@/components/kit/tabs/FolderTabs';
import {
  TableToolbar, StatusCell, DataTable, primaryButtonClass, deadlineTone, oneOf, usePersistentState, useDataTable,
  type TableColumn, type TableFilter, type TableSegment, type StatusTone,
} from '@/components/kit/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/*
 * Inventario con la convención de tablas de Ker Hub: vistas del módulo como
 * pestañas de carpeta, cada una con su DataTable. Sin tarjetas KPI ni
 * alertas sueltas: lo urgente (stock bajo, agotado, por vencer) son segmentos
 * con conteo de la tabla de stock.
 */

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  medicamento: 'Medicamento',
  insumo: 'Insumo',
  dispositivo_medico: 'Dispositivo',
};
const productTypeLabel = (type: string) => PRODUCT_TYPE_LABEL[type] || type;

const rightAligned = 'text-right tabular-nums';
const DAY_MS = 86_400_000;
/** Días de anticipación con que un lote cuenta como «por vencer». */
const EXPIRY_THRESHOLD_DAYS = 90;

const shortDate = (f: string) => format(new Date(f), 'd MMM yyyy', { locale: es });

// ─── Stock por sede ─────────────────────────────────────────

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

type StockStatus = 'Agotado' | 'Bajo' | 'Disponible';

const stockStatusOf = (r: StockRow): StockStatus =>
  r.cantidad_disponible === 0
    ? 'Agotado'
    : r.cantidad_minima > 0 && r.cantidad_disponible <= r.cantidad_minima
      ? 'Bajo'
      : 'Disponible';

const STOCK_TONE: Record<StockStatus, StatusTone> = { Agotado: 'error', Bajo: 'warning', Disponible: 'success' };

const daysUntilExpiry = (r: StockRow) =>
  r.proxima_vencimiento ? Math.floor((new Date(r.proxima_vencimiento).getTime() - Date.now()) / DAY_MS) : null;

function useStockData() {
  return useQuery<StockRow[]>({
    queryKey: ['inventario-stock-table'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: stocks, error } = await db
        .from('inventario_stock')
        .select('id, producto_id, presentacion_id, sede_id, cantidad_disponible, cantidad_minima, cantidad_maxima')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      if (!stocks || stocks.length === 0) return [];

      const prodIds = [...new Set(stocks.map(s => s.producto_id))];
      const presIds = [...new Set(stocks.map(s => s.presentacion_id))];
      const sedeIds = [...new Set(stocks.map(s => s.sede_id))];
      const stockIds = stocks.map(s => s.id);

      const [{ data: prods }, { data: pres }, { data: sedes }, { data: lots }] = await Promise.all([
        db.from('catalogo_productos').select('id, nombre_generico, tipo_producto').in('id', prodIds),
        db.from('presentaciones_producto').select('id, forma_farmaceutica, concentracion').in('id', presIds),
        db.from('sedes').select('id, nombre').in('id', sedeIds),
        db.from('inventario_lotes')
          .select('stock_id, fecha_vencimiento')
          .in('stock_id', stockIds)
          .eq('estado', 'disponible')
          .order('fecha_vencimiento', { ascending: true }),
      ]);

      const prodMap = Object.fromEntries((prods || []).map(p => [p.id, p]));
      const presMap = Object.fromEntries((pres || []).map(p => [p.id, p]));
      const sedeMap = Object.fromEntries((sedes || []).map(s => [s.id, s]));

      // Vencimiento más próximo por registro de stock.
      const expiryMap: Record<string, string> = {};
      for (const lot of (lots || [])) {
        if (!expiryMap[lot.stock_id]) expiryMap[lot.stock_id] = lot.fecha_vencimiento;
      }

      return stocks.map(s => {
        const prod = prodMap[s.producto_id];
        const pr = presMap[s.presentacion_id];
        return {
          id: s.id,
          producto_nombre: prod?.nombre_generico || '',
          tipo_producto: prod?.tipo_producto || '',
          presentacion: pr ? `${pr.forma_farmaceutica}${pr.concentracion ? ` ${pr.concentracion}` : ''}` : '',
          sede_nombre: sedeMap[s.sede_id]?.nombre || '',
          cantidad_disponible: s.cantidad_disponible,
          cantidad_minima: s.cantidad_minima || 0,
          cantidad_maxima: s.cantidad_maxima || 0,
          proxima_vencimiento: expiryMap[s.id] || null,
        };
      });
    },
  });
}

const STOCK_COLUMNS: TableColumn<StockRow>[] = [
  { id: 'product', title: 'Producto', value: (r) => r.producto_nombre, primary: true, alwaysVisible: true, className: 'min-w-[200px]' },
  { id: 'type', title: 'Tipo', value: (r) => productTypeLabel(r.tipo_producto) },
  { id: 'presentation', title: 'Presentación', value: (r) => r.presentacion },
  { id: 'site', title: 'Sede', value: (r) => r.sede_nombre },
  { id: 'available', title: 'Disponible', value: (r) => r.cantidad_disponible, className: rightAligned },
  { id: 'minimum', title: 'Mínimo', value: (r) => r.cantidad_minima, className: rightAligned, hidden: true },
  { id: 'maximum', title: 'Máximo', value: (r) => r.cantidad_maxima, className: rightAligned, hidden: true },
  {
    id: 'status', title: 'Estado', value: stockStatusOf, flush: true, className: 'w-28',
    cell: (r) => <StatusCell tone={STOCK_TONE[stockStatusOf(r)]} text={stockStatusOf(r)} />,
  },
  {
    id: 'nextExpiry', title: 'Próx. vencimiento', value: (r) => r.proxima_vencimiento, className: 'tabular-nums',
    cell: (r) => r.proxima_vencimiento
      ? <span className={deadlineTone(daysUntilExpiry(r), EXPIRY_THRESHOLD_DAYS)}>{shortDate(r.proxima_vencimiento)}</span>
      : '—',
  },
];

const STOCK_FILTERS: TableFilter<StockRow>[] = [
  { id: 'site', title: 'Sede', value: (r) => r.sede_nombre },
  { id: 'type', title: 'Tipo', value: (r) => productTypeLabel(r.tipo_producto) },
  { id: 'status', title: 'Estado', value: stockStatusOf },
];

const STOCK_SEGMENTS: TableSegment<StockRow>[] = [
  { id: 'all', title: 'Todos', match: () => true },
  { id: 'lowStock', title: 'Stock bajo', match: (r) => stockStatusOf(r) === 'Bajo' },
  { id: 'outOfStock', title: 'Agotados', match: (r) => stockStatusOf(r) === 'Agotado' },
  { id: 'expiring', title: 'Por vencer', match: (r) => { const d = daysUntilExpiry(r); return d !== null && d <= EXPIRY_THRESHOLD_DAYS; } },
];

const stockKey = (r: StockRow) => r.id;

function StockView({ onRegisterMovement }: { onRegisterMovement: () => void }) {
  const { data = [], isLoading } = useStockData();
  const t = useDataTable({ id: 'inventory.stock', rows: data, columns: STOCK_COLUMNS, rowKey: stockKey, filters: STOCK_FILTERS, segments: STOCK_SEGMENTS });
  return (
    <DataTable
      t={t}
      loading={isLoading}
      toolbar={
        <TableToolbar
          t={t}
          name={['registro', 'registros']}
          placeholder="Buscar producto, presentación o sede"
          fileName="inventario-stock"
          actions={
            <Button className={primaryButtonClass} onClick={onRegisterMovement}>
              <PackagePlus className="h-4 w-4" />
              Registrar movimiento
            </Button>
          }
        />
      }
      empty="Aún no hay stock. Aparecerá cuando se registren movimientos de inventario."
    />
  );
}

// ─── Catálogo ───────────────────────────────────────────────

interface CatalogRow {
  id: string;
  codigo: string;
  nombre_generico: string;
  nombre_comercial: string | null;
  tipo_producto: string;
  principio_activo: string | null;
  fabricante: string | null;
  controlado: boolean | null;
  requiere_cadena_frio: boolean | null;
}

const yesNo = (v: boolean | null) => (v ? 'Sí' : 'No');

const CATALOG_COLUMNS: TableColumn<CatalogRow>[] = [
  { id: 'code', title: 'Código', value: (r) => r.codigo, className: 'font-mono text-xs', alwaysVisible: true },
  { id: 'genericName', title: 'Nombre genérico', value: (r) => r.nombre_generico, primary: true, className: 'min-w-[200px]' },
  { id: 'brandName', title: 'Comercial', value: (r) => r.nombre_comercial },
  { id: 'type', title: 'Tipo', value: (r) => productTypeLabel(r.tipo_producto) },
  { id: 'activeIngredient', title: 'Principio activo', value: (r) => r.principio_activo },
  { id: 'manufacturer', title: 'Fabricante', value: (r) => r.fabricante },
  { id: 'controlled', title: 'Controlado', value: (r) => yesNo(r.controlado), hidden: true },
  { id: 'coldChain', title: 'Cadena de frío', value: (r) => yesNo(r.requiere_cadena_frio), hidden: true },
];

const CATALOG_FILTERS: TableFilter<CatalogRow>[] = [
  { id: 'type', title: 'Tipo', value: (r) => productTypeLabel(r.tipo_producto) },
  { id: 'manufacturer', title: 'Fabricante', value: (r) => r.fabricante },
];

const CATALOG_SEGMENTS: TableSegment<CatalogRow>[] = [
  { id: 'all', title: 'Todos', match: () => true },
  { id: 'controlled', title: 'Controlados', match: (r) => !!r.controlado },
  { id: 'coldChain', title: 'Cadena de frío', match: (r) => !!r.requiere_cadena_frio },
];

const catalogKey = (r: CatalogRow) => r.id;

function CatalogView({ onEdit }: { onEdit: (id: string) => void }) {
  // Se cargan los productos activos y la búsqueda se resuelve en el cliente (kit de tablas).
  const { data = [], isLoading } = useQuery<CatalogRow[]>({
    queryKey: ['catalogo-productos'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: rows, error } = await db
        .from('catalogo_productos')
        .select('id, codigo, nombre_generico, nombre_comercial, tipo_producto, principio_activo, fabricante, controlado, requiere_cadena_frio')
        .eq('activo', true)
        .order('nombre_generico');
      if (error) throw error;
      return (rows || []) as CatalogRow[];
    },
  });
  const t = useDataTable({ id: 'inventory.catalog', rows: data, columns: CATALOG_COLUMNS, rowKey: catalogKey, filters: CATALOG_FILTERS, segments: CATALOG_SEGMENTS });
  return (
    <DataTable
      t={t}
      loading={isLoading}
      onRowClick={(r) => onEdit(r.id)}
      toolbar={<TableToolbar t={t} name={['producto', 'productos']} placeholder="Buscar por nombre, código o principio activo" fileName="inventario-catalogo" />}
      actions={(r) => <RowActions name={r.nombre_generico} onView={() => onEdit(r.id)} />}
      empty="Aún no hay productos en el catálogo. Registra uno con «Nuevo producto»."
    />
  );
}

// ─── Vistas pendientes ──────────────────────────────────────

const ComingSoon = ({ title }: { title: string }) => (
  <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-sm">
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="mt-0.5 text-[13px] text-muted-foreground">Próximamente</p>
  </div>
);

// ─── Página ─────────────────────────────────────────────────

const VIEWS = ['stock', 'catalog', 'batches', 'movements'] as const;
type View = (typeof VIEWS)[number];

const TABS: FolderTab<View>[] = [
  { id: 'stock', title: 'Stock por sede', pinned: true },
  { id: 'catalog', title: 'Catálogo' },
  { id: 'batches', title: 'Lotes' },
  { id: 'movements', title: 'Movimientos' },
];

const isView = oneOf(VIEWS);

const InventarioPage: React.FC = () => {
  const [view, setView] = usePersistentState<View>('inventory.view', 'stock', isView);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [showMovement, setShowMovement] = useState(false);

  const edit = (id: string) => { setEditProductId(id); setShowNewProduct(true); };

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader title="Inventario" primary={{ title: 'Nuevo producto', onClick: () => setShowNewProduct(true) }} />

      <FolderTabs
        id="inventory.tabs"
        label="Vistas de inventario"
        tabs={TABS}
        active={view}
        onChange={setView}
        initialVisible={['stock', 'catalog', 'batches', 'movements']}
      />
      {view === 'stock' && <StockView onRegisterMovement={() => setShowMovement(true)} />}
      {view === 'catalog' && <CatalogView onEdit={edit} />}
      {view === 'batches' && <ComingSoon title="Gestión de lotes" />}
      {view === 'movements' && <ComingSoon title="Historial de movimientos" />}

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
