import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { baseDatos } from "@/integrations/datos/cliente";
import { PackagePlus } from 'lucide-react';
import { ProductoDialog } from '@/components/inventario/ProductoDialog';
import { RegistrarMovimientoDialog } from '@/components/inventario/RegistrarMovimientoDialog';
import { Button } from '@/components/ui/button';
import { EncabezadoModulo } from '@/components/kit/EncabezadoModulo';
import { AccionesFila } from '@/components/kit/AccionesFila';
import { PestanasCarpeta, type PestanaCarpeta } from '@/components/kit/pestanas/PestanasCarpeta';
import {
  BarraTabla, CeldaEstado, TablaDatos, botonPrimario, tonoPlazo, unaDe, useEstadoPersistente, useTablaDatos,
  type ColumnaTabla, type FiltroTabla, type SegmentoTabla, type TonoEstado,
} from '@/components/kit/tabla';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/*
 * Inventario con la convención de tablas de Ker Hub: vistas del módulo como
 * pestañas de carpeta, cada una con su TablaDatos. Sin tarjetas KPI ni
 * alertas sueltas: lo urgente (stock bajo, agotado, por vencer) son segmentos
 * con conteo de la tabla de stock.
 */

const tipoLabel: Record<string, string> = {
  medicamento: 'Medicamento',
  insumo: 'Insumo',
  dispositivo_medico: 'Dispositivo',
};
const tipoTexto = (tipo: string) => tipoLabel[tipo] || tipo;

const derecha = 'text-right tabular-nums';
const DIA_MS = 86_400_000;
/** Días de anticipación con que un lote cuenta como «por vencer». */
const UMBRAL_VENCIMIENTO = 90;

const fechaCorta = (f: string) => format(new Date(f), 'd MMM yyyy', { locale: es });

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

type EstadoStock = 'Agotado' | 'Bajo' | 'Disponible';

const estadoStock = (r: StockRow): EstadoStock =>
  r.cantidad_disponible === 0
    ? 'Agotado'
    : r.cantidad_minima > 0 && r.cantidad_disponible <= r.cantidad_minima
      ? 'Bajo'
      : 'Disponible';

const TONO_STOCK: Record<EstadoStock, TonoEstado> = { Agotado: 'error', Bajo: 'aviso', Disponible: 'exito' };

const diasParaVencer = (r: StockRow) =>
  r.proxima_vencimiento ? Math.floor((new Date(r.proxima_vencimiento).getTime() - Date.now()) / DIA_MS) : null;

function useStockData() {
  return useQuery<StockRow[]>({
    queryKey: ['inventario-stock-table'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: stocks, error } = await baseDatos
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
        baseDatos.from('catalogo_productos').select('id, nombre_generico, tipo_producto').in('id', prodIds),
        baseDatos.from('presentaciones_producto').select('id, forma_farmaceutica, concentracion').in('id', presIds),
        baseDatos.from('sedes').select('id, nombre').in('id', sedeIds),
        baseDatos.from('inventario_lotes')
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

const COLUMNAS_STOCK: ColumnaTabla<StockRow>[] = [
  { id: 'producto', titulo: 'Producto', valor: (r) => r.producto_nombre, principal: true, fija: true, className: 'min-w-[200px]' },
  { id: 'tipo', titulo: 'Tipo', valor: (r) => tipoTexto(r.tipo_producto) },
  { id: 'presentacion', titulo: 'Presentación', valor: (r) => r.presentacion },
  { id: 'sede', titulo: 'Sede', valor: (r) => r.sede_nombre },
  { id: 'disponible', titulo: 'Disponible', valor: (r) => r.cantidad_disponible, className: derecha },
  { id: 'minimo', titulo: 'Mínimo', valor: (r) => r.cantidad_minima, className: derecha, oculta: true },
  { id: 'maximo', titulo: 'Máximo', valor: (r) => r.cantidad_maxima, className: derecha, oculta: true },
  {
    id: 'estado', titulo: 'Estado', valor: estadoStock, sinPadding: true, className: 'w-28',
    celda: (r) => <CeldaEstado tono={TONO_STOCK[estadoStock(r)]} texto={estadoStock(r)} />,
  },
  {
    id: 'vencimiento', titulo: 'Próx. vencimiento', valor: (r) => r.proxima_vencimiento, className: 'tabular-nums',
    celda: (r) => r.proxima_vencimiento
      ? <span className={tonoPlazo(diasParaVencer(r), UMBRAL_VENCIMIENTO)}>{fechaCorta(r.proxima_vencimiento)}</span>
      : '—',
  },
];

const FILTROS_STOCK: FiltroTabla<StockRow>[] = [
  { id: 'sede', titulo: 'Sede', valor: (r) => r.sede_nombre },
  { id: 'tipo', titulo: 'Tipo', valor: (r) => tipoTexto(r.tipo_producto) },
  { id: 'estado', titulo: 'Estado', valor: estadoStock },
];

const SEGMENTOS_STOCK: SegmentoTabla<StockRow>[] = [
  { id: 'todos', titulo: 'Todos', cumple: () => true },
  { id: 'bajo', titulo: 'Stock bajo', cumple: (r) => estadoStock(r) === 'Bajo' },
  { id: 'agotado', titulo: 'Agotados', cumple: (r) => estadoStock(r) === 'Agotado' },
  { id: 'por-vencer', titulo: 'Por vencer', cumple: (r) => { const d = diasParaVencer(r); return d !== null && d <= UMBRAL_VENCIMIENTO; } },
];

const claveStock = (r: StockRow) => r.id;

function StockVista({ onRegistrarMovimiento }: { onRegistrarMovimiento: () => void }) {
  const { data = [], isLoading } = useStockData();
  const t = useTablaDatos({ id: 'inventario.stock', filas: data, columnas: COLUMNAS_STOCK, claveFila: claveStock, filtros: FILTROS_STOCK, segmentos: SEGMENTOS_STOCK });
  return (
    <TablaDatos
      t={t}
      cargando={isLoading}
      barra={
        <BarraTabla
          t={t}
          nombre={['registro', 'registros']}
          placeholder="Buscar producto, presentación o sede"
          nombreArchivo="inventario-stock"
          acciones={
            <Button className={botonPrimario} onClick={onRegistrarMovimiento}>
              <PackagePlus className="h-4 w-4" />
              Registrar movimiento
            </Button>
          }
        />
      }
      vacio="Aún no hay stock. Aparecerá cuando se registren movimientos de inventario."
    />
  );
}

// ─── Catálogo ───────────────────────────────────────────────

interface CatalogoRow {
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

const siNo = (v: boolean | null) => (v ? 'Sí' : 'No');

const COLUMNAS_CATALOGO: ColumnaTabla<CatalogoRow>[] = [
  { id: 'codigo', titulo: 'Código', valor: (r) => r.codigo, className: 'font-mono text-xs', fija: true },
  { id: 'nombre', titulo: 'Nombre genérico', valor: (r) => r.nombre_generico, principal: true, className: 'min-w-[200px]' },
  { id: 'comercial', titulo: 'Comercial', valor: (r) => r.nombre_comercial },
  { id: 'tipo', titulo: 'Tipo', valor: (r) => tipoTexto(r.tipo_producto) },
  { id: 'principio', titulo: 'Principio activo', valor: (r) => r.principio_activo },
  { id: 'fabricante', titulo: 'Fabricante', valor: (r) => r.fabricante },
  { id: 'controlado', titulo: 'Controlado', valor: (r) => siNo(r.controlado), oculta: true },
  { id: 'frio', titulo: 'Cadena de frío', valor: (r) => siNo(r.requiere_cadena_frio), oculta: true },
];

const FILTROS_CATALOGO: FiltroTabla<CatalogoRow>[] = [
  { id: 'tipo', titulo: 'Tipo', valor: (r) => tipoTexto(r.tipo_producto) },
  { id: 'fabricante', titulo: 'Fabricante', valor: (r) => r.fabricante },
];

const SEGMENTOS_CATALOGO: SegmentoTabla<CatalogoRow>[] = [
  { id: 'todos', titulo: 'Todos', cumple: () => true },
  { id: 'controlados', titulo: 'Controlados', cumple: (r) => !!r.controlado },
  { id: 'frio', titulo: 'Cadena de frío', cumple: (r) => !!r.requiere_cadena_frio },
];

const claveCatalogo = (r: CatalogoRow) => r.id;

function CatalogoVista({ onEdit }: { onEdit: (id: string) => void }) {
  // Se cargan los productos activos y la búsqueda se resuelve en el cliente (kit de tablas).
  const { data = [], isLoading } = useQuery<CatalogoRow[]>({
    queryKey: ['catalogo-productos'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: filas, error } = await baseDatos
        .from('catalogo_productos')
        .select('id, codigo, nombre_generico, nombre_comercial, tipo_producto, principio_activo, fabricante, controlado, requiere_cadena_frio')
        .eq('activo', true)
        .order('nombre_generico');
      if (error) throw error;
      return (filas || []) as CatalogoRow[];
    },
  });
  const t = useTablaDatos({ id: 'inventario.catalogo', filas: data, columnas: COLUMNAS_CATALOGO, claveFila: claveCatalogo, filtros: FILTROS_CATALOGO, segmentos: SEGMENTOS_CATALOGO });
  return (
    <TablaDatos
      t={t}
      cargando={isLoading}
      onFilaClick={(r) => onEdit(r.id)}
      barra={<BarraTabla t={t} nombre={['producto', 'productos']} placeholder="Buscar por nombre, código o principio activo" nombreArchivo="inventario-catalogo" />}
      acciones={(r) => <AccionesFila nombre={r.nombre_generico} onVer={() => onEdit(r.id)} />}
      vacio="Aún no hay productos en el catálogo. Registra uno con «Nuevo producto»."
    />
  );
}

// ─── Vistas pendientes ──────────────────────────────────────

const Proximamente = ({ titulo }: { titulo: string }) => (
  <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-sm">
    <p className="text-sm font-medium text-foreground">{titulo}</p>
    <p className="mt-0.5 text-[13px] text-muted-foreground">Próximamente</p>
  </div>
);

// ─── Página ─────────────────────────────────────────────────

const VISTAS = ['stock', 'catalogo', 'lotes', 'movimientos'] as const;
type Vista = (typeof VISTAS)[number];

const PESTANAS: PestanaCarpeta<Vista>[] = [
  { id: 'stock', titulo: 'Stock por sede', fija: true },
  { id: 'catalogo', titulo: 'Catálogo' },
  { id: 'lotes', titulo: 'Lotes' },
  { id: 'movimientos', titulo: 'Movimientos' },
];

const esVista = unaDe(VISTAS);

const InventarioPage: React.FC = () => {
  const [vista, setVista] = useEstadoPersistente<Vista>('inventario.vista', 'stock', esVista);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [showMovement, setShowMovement] = useState(false);

  const editar = (id: string) => { setEditProductId(id); setShowNewProduct(true); };

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo titulo="Inventario" primaria={{ titulo: 'Nuevo producto', onClick: () => setShowNewProduct(true) }} />

      <PestanasCarpeta
        id="inventario.pestanas"
        etiqueta="Vistas de inventario"
        pestanas={PESTANAS}
        activa={vista}
        onCambio={setVista}
        visiblesIniciales={['stock', 'catalogo', 'lotes', 'movimientos']}
      />
      {vista === 'stock' && <StockVista onRegistrarMovimiento={() => setShowMovement(true)} />}
      {vista === 'catalogo' && <CatalogoVista onEdit={editar} />}
      {vista === 'lotes' && <Proximamente titulo="Gestión de lotes" />}
      {vista === 'movimientos' && <Proximamente titulo="Historial de movimientos" />}

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
