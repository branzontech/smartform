import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { baseDatos } from "@/integrations/datos/cliente";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Copy, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { EncabezadoModulo } from "@/components/kit/EncabezadoModulo";
import { AccionesFila } from "@/components/kit/AccionesFila";
import {
  BarraTabla, CeldaEstado, TablaDatos, useTablaDatos,
  type ColumnaTabla, type FiltroTabla, type SegmentoTabla, type TonoEstado,
} from "@/components/kit/tabla";
import type { ClienteCotizacion, EstadoCotizacion } from "@/types/cotizacion-types";

const ESTADOS: Record<EstadoCotizacion, { label: string; tono: TonoEstado }> = {
  borrador: { label: "Borrador", tono: "neutro" },
  enviada: { label: "Enviada", tono: "info" },
  aceptada: { label: "Aceptada", tono: "exito" },
  rechazada: { label: "Rechazada", tono: "error" },
  vencida: { label: "Vencida", tono: "aviso" },
};

/** Fila de public.cotizaciones con el cliente y el nombre de quien la hizo. */
interface CotizacionFila {
  id: string;
  numero_cotizacion: string;
  fecha_emision: string;
  fecha_validez: string;
  estado: EstadoCotizacion;
  total: number;
  moneda: string;
  creado_por: string | null;
  clientes_cotizacion?: Pick<ClienteCotizacion, "nombre_razon_social"> | null;
  creador: string;
}

const estadoDe = (c: CotizacionFila) => ESTADOS[c.estado] ?? ESTADOS.borrador;
const fechaCorta = (f: string) => format(new Date(f), "dd MMM yyyy", { locale: es });
const formatCurrency = (val: number, moneda: string = "COP") =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda, minimumFractionDigits: 0 }).format(val);

/** Una celda, un dato, una línea. */
const COLUMNAS: ColumnaTabla<CotizacionFila>[] = [
  { id: "numero", titulo: "N° cotización", valor: (c) => c.numero_cotizacion, className: "font-mono text-xs", fija: true },
  { id: "cliente", titulo: "Cliente", valor: (c) => c.clientes_cotizacion?.nombre_razon_social, principal: true, className: "min-w-[220px]" },
  { id: "creador", titulo: "Realizada por", valor: (c) => c.creador },
  { id: "emision", titulo: "Fecha emisión", valor: (c) => c.fecha_emision, celda: (c) => fechaCorta(c.fecha_emision), className: "tabular-nums" },
  { id: "validez", titulo: "Validez", valor: (c) => c.fecha_validez, celda: (c) => fechaCorta(c.fecha_validez), className: "tabular-nums" },
  { id: "moneda", titulo: "Moneda", valor: (c) => c.moneda, oculta: true },
  {
    id: "total", titulo: "Total", valor: (c) => Number(c.total), className: "text-right tabular-nums",
    celda: (c) => formatCurrency(Number(c.total), c.moneda),
  },
  {
    id: "estado", titulo: "Estado", valor: (c) => estadoDe(c).label, sinPadding: true, className: "w-28",
    celda: (c) => <CeldaEstado tono={estadoDe(c).tono} texto={estadoDe(c).label} />,
  },
];

const FILTROS: FiltroTabla<CotizacionFila>[] = [
  { id: "creador", titulo: "Realizada por", valor: (c) => c.creador },
  { id: "moneda", titulo: "Moneda", valor: (c) => c.moneda },
];

const SEGMENTOS: SegmentoTabla<CotizacionFila>[] = [
  { id: "todos", titulo: "Todas", cumple: () => true },
  ...(Object.keys(ESTADOS) as EstadoCotizacion[]).map((e) => ({
    id: e, titulo: ESTADOS[e].label, cumple: (c: CotizacionFila) => c.estado === e,
  })),
];

const claveFila = (c: CotizacionFila) => c.id;

interface Props {
  onNewClick: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const CotizacionList = ({ onNewClick, onView, onEdit }: Props) => {
  const queryClient = useQueryClient();
  // El rango de fechas define qué se consulta (va al inicio de la barra); el resto se filtra en el cliente.
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();

  const { data: cotizaciones, isLoading } = useQuery({
    queryKey: ["cotizaciones", fechaDesde, fechaHasta],
    queryFn: async () => {
      let query = baseDatos
        .from("cotizaciones" as any)
        .select("*, clientes_cotizacion:cliente_cotizacion_id(*)")
        .order("created_at", { ascending: false });

      if (fechaDesde) {
        query = query.gte("fecha_emision", format(fechaDesde, "yyyy-MM-dd"));
      }
      if (fechaHasta) {
        query = query.lte("fecha_emision", format(fechaHasta, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Omit<CotizacionFila, "creador">[];
    },
  });

  // Nombres de quienes crearon las cotizaciones
  const creatorIds = useMemo(() => {
    if (!cotizaciones) return [];
    return [...new Set(cotizaciones.map((c) => c.creado_por).filter((id): id is string => !!id))];
  }, [cotizaciones]);

  const { data: profilesMap } = useQuery({
    queryKey: ["profiles-map", creatorIds],
    queryFn: async () => {
      if (creatorIds.length === 0) return {};
      const { data, error } = await baseDatos
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", creatorIds);
      if (error) return {};
      const map: Record<string, string> = {};
      (data || []).forEach((p) => {
        map[p.user_id] = p.full_name || "Sin nombre";
      });
      return map;
    },
    enabled: creatorIds.length > 0,
  });

  const filas = useMemo<CotizacionFila[]>(
    () => (cotizaciones ?? []).map((c) => ({ ...c, creador: (c.creado_por && profilesMap?.[c.creado_por]) || "—" })),
    [cotizaciones, profilesMap],
  );

  const t = useTablaDatos({ id: "cotizaciones.lista", filas, columnas: COLUMNAS, claveFila, filtros: FILTROS, segmentos: SEGMENTOS });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await baseDatos.from("cotizacion_items" as any).delete().eq("cotizacion_id", id);
      const { error } = await baseDatos.from("cotizaciones" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      toast.success("Cotización eliminada");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al eliminar");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (cotId: string) => {
      const { data: original, error: fetchErr } = await baseDatos
        .from("cotizaciones" as any)
        .select("*")
        .eq("id", cotId)
        .single();
      if (fetchErr) throw fetchErr;
      const orig = original as any;

      const { data: origItems, error: itemsErr } = await baseDatos
        .from("cotizacion_items" as any)
        .select("*")
        .eq("cotizacion_id", cotId)
        .order("orden", { ascending: true });
      if (itemsErr) throw itemsErr;

      const { data: newCot, error: insertErr } = await baseDatos
        .from("cotizaciones" as any)
        .insert({
          numero_cotizacion: "",
          cliente_cotizacion_id: orig.cliente_cotizacion_id,
          fecha_emision: format(new Date(), "yyyy-MM-dd"),
          fecha_validez: orig.fecha_validez,
          estado: "borrador",
          subtotal: orig.subtotal,
          descuento_porcentaje: orig.descuento_porcentaje,
          descuento_valor: orig.descuento_valor,
          impuesto_porcentaje: orig.impuesto_porcentaje,
          impuesto_valor: orig.impuesto_valor,
          total: orig.total,
          moneda: orig.moneda,
          observaciones: orig.observaciones,
          leyenda_validez: orig.leyenda_validez,
          creado_por: orig.creado_por,
        } as any)
        .select()
        .single();
      if (insertErr) throw insertErr;

      const newId = (newCot as any).id;
      if (origItems && (origItems as any[]).length > 0) {
        const newItems = (origItems as any[]).map((item: any) => ({
          cotizacion_id: newId,
          tarifario_servicio_id: item.tarifario_servicio_id,
          codigo_servicio: item.codigo_servicio,
          descripcion_servicio: item.descripcion_servicio,
          cantidad: item.cantidad,
          valor_unitario: item.valor_unitario,
          descuento_porcentaje: item.descuento_porcentaje,
          valor_total: item.valor_total,
          orden: item.orden,
        }));
        await baseDatos.from("cotizacion_items" as any).insert(newItems as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      toast.success("Cotización duplicada como borrador");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al duplicar");
    },
  });

  const rangoFechas = (
    <div className="flex items-center gap-1.5">
      <DatePicker value={fechaDesde as Date} onChange={setFechaDesde} placeholder="Desde" className="h-8 w-[130px] rounded-lg text-[13px]" />
      <DatePicker value={fechaHasta as Date} onChange={setFechaHasta} placeholder="Hasta" className="h-8 w-[130px] rounded-lg text-[13px]" />
      {(fechaDesde || fechaHasta) && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Quitar rango de fechas"
          title="Quitar fechas"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => { setFechaDesde(undefined); setFechaHasta(undefined); }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <EncabezadoModulo titulo="Cotizaciones" primaria={{ titulo: "Nueva cotización", onClick: onNewClick }} />
      <TablaDatos
        t={t}
        cargando={isLoading}
        onFilaClick={(c) => onView(c.id)}
        barra={
          <BarraTabla
            t={t}
            nombre={["cotización", "cotizaciones"]}
            placeholder="Buscar por cliente o número"
            nombreArchivo="cotizaciones"
            inicio={rangoFechas}
          />
        }
        acciones={(c) => (
          <AccionesFila
            nombre={c.numero_cotizacion || "cotización"}
            onVer={() => onView(c.id)}
            menu={[
              { titulo: "Editar", icono: Pencil, onClick: () => onEdit(c.id) },
              { titulo: "Duplicar", icono: Copy, onClick: () => { if (!duplicateMutation.isPending) duplicateMutation.mutate(c.id); } },
            ]}
            onEliminar={() => deleteMutation.mutate(c.id)}
            confirmarEliminar={{
              titulo: "¿Eliminar cotización?",
              descripcion: "Esta acción no se puede deshacer. Se eliminará la cotización y todos sus ítems permanentemente.",
            }}
          />
        )}
        vacio="Aún no hay cotizaciones. Crea una con «Nueva cotización»."
      />
    </div>
  );
};

export default CotizacionList;
