import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/data/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Copy, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { ModuleHeader } from "@/components/kit/ModuleHeader";
import { RowActions } from "@/components/kit/RowActions";
import {
  TableToolbar, StatusCell, DataTable, useDataTable,
  type TableColumn, type TableFilter, type TableSegment, type StatusTone,
} from "@/components/kit/table";
import type { ClienteCotizacion, EstadoCotizacion } from "@/types/cotizacion-types";

const QUOTE_STATUS: Record<EstadoCotizacion, { label: string; tone: StatusTone }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  enviada: { label: "Enviada", tone: "info" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "error" },
  vencida: { label: "Vencida", tone: "warning" },
};

/** Fila de public.cotizaciones con el cliente y el nombre de quien la hizo. */
interface QuoteRow {
  id: string;
  numero_cotizacion: string;
  fecha_emision: string;
  fecha_validez: string;
  estado: EstadoCotizacion;
  total: number;
  moneda: string;
  creado_por: string | null;
  clientes_cotizacion?: Pick<ClienteCotizacion, "nombre_razon_social"> | null;
  creatorName: string;
}

const statusOf = (c: QuoteRow) => QUOTE_STATUS[c.estado] ?? QUOTE_STATUS.borrador;
const shortDate = (f: string) => format(new Date(f), "dd MMM yyyy", { locale: es });
const formatCurrency = (val: number, moneda: string = "COP") =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda, minimumFractionDigits: 0 }).format(val);

/** Una celda, un dato, una línea. */
const COLUMNS: TableColumn<QuoteRow>[] = [
  { id: "number", title: "N° cotización", value: (c) => c.numero_cotizacion, className: "font-mono text-xs", alwaysVisible: true },
  { id: "customer", title: "Cliente", value: (c) => c.clientes_cotizacion?.nombre_razon_social, primary: true, className: "min-w-[220px]" },
  { id: "creator", title: "Realizada por", value: (c) => c.creatorName },
  { id: "issueDate", title: "Fecha emisión", value: (c) => c.fecha_emision, cell: (c) => shortDate(c.fecha_emision), className: "tabular-nums" },
  { id: "validUntil", title: "Validez", value: (c) => c.fecha_validez, cell: (c) => shortDate(c.fecha_validez), className: "tabular-nums" },
  { id: "currency", title: "Moneda", value: (c) => c.moneda, hidden: true },
  {
    id: "total", title: "Total", value: (c) => Number(c.total), className: "text-right tabular-nums",
    cell: (c) => formatCurrency(Number(c.total), c.moneda),
  },
  {
    id: "status", title: "Estado", value: (c) => statusOf(c).label, flush: true, className: "w-28",
    cell: (c) => <StatusCell tone={statusOf(c).tone} text={statusOf(c).label} />,
  },
];

const FILTERS: TableFilter<QuoteRow>[] = [
  { id: "creator", title: "Realizada por", value: (c) => c.creatorName },
  { id: "currency", title: "Moneda", value: (c) => c.moneda },
];

const SEGMENTS: TableSegment<QuoteRow>[] = [
  { id: "all", title: "Todas", match: () => true },
  ...(Object.keys(QUOTE_STATUS) as EstadoCotizacion[]).map((e) => ({
    id: e, title: QUOTE_STATUS[e].label, match: (c: QuoteRow) => c.estado === e,
  })),
];

const rowKey = (c: QuoteRow) => c.id;

interface Props {
  onNewClick: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const CotizacionList = ({ onNewClick, onView, onEdit }: Props) => {
  const queryClient = useQueryClient();
  // El rango de fechas define qué se consulta (va al inicio de la barra); el resto se filtra en el cliente.
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: cotizaciones, isLoading } = useQuery({
    queryKey: ["cotizaciones", dateFrom, dateTo],
    queryFn: async () => {
      let query = db
        .from("cotizaciones" as any)
        .select("*, clientes_cotizacion:cliente_cotizacion_id(*)")
        .order("created_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("fecha_emision", format(dateFrom, "yyyy-MM-dd"));
      }
      if (dateTo) {
        query = query.lte("fecha_emision", format(dateTo, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Omit<QuoteRow, "creatorName">[];
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
      const { data, error } = await db
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

  const rows = useMemo<QuoteRow[]>(
    () => (cotizaciones ?? []).map((c) => ({ ...c, creatorName: (c.creado_por && profilesMap?.[c.creado_por]) || "—" })),
    [cotizaciones, profilesMap],
  );

  const t = useDataTable({ id: "quotes.list", rows, columns: COLUMNS, rowKey, filters: FILTERS, segments: SEGMENTS });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await db.from("cotizacion_items" as any).delete().eq("cotizacion_id", id);
      const { error } = await db.from("cotizaciones" as any).delete().eq("id", id);
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
      const { data: original, error: fetchErr } = await db
        .from("cotizaciones" as any)
        .select("*")
        .eq("id", cotId)
        .single();
      if (fetchErr) throw fetchErr;
      const orig = original as any;

      const { data: origItems, error: itemsErr } = await db
        .from("cotizacion_items" as any)
        .select("*")
        .eq("cotizacion_id", cotId)
        .order("orden", { ascending: true });
      if (itemsErr) throw itemsErr;

      const { data: newCot, error: insertErr } = await db
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
        await db.from("cotizacion_items" as any).insert(newItems as any);
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

  const dateRange = (
    <div className="flex items-center gap-1.5">
      <DatePicker value={dateFrom as Date} onChange={setDateFrom} placeholder="Desde" className="h-8 w-[130px] rounded-lg text-[13px]" />
      <DatePicker value={dateTo as Date} onChange={setDateTo} placeholder="Hasta" className="h-8 w-[130px] rounded-lg text-[13px]" />
      {(dateFrom || dateTo) && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Quitar rango de fechas"
          title="Quitar fechas"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 py-6">
      <ModuleHeader title="Cotizaciones" primary={{ title: "Nueva cotización", onClick: onNewClick }} />
      <DataTable
        t={t}
        loading={isLoading}
        onRowClick={(c) => onView(c.id)}
        toolbar={
          <TableToolbar
            t={t}
            name={["cotización", "cotizaciones"]}
            placeholder="Buscar por cliente o número"
            fileName="cotizaciones"
            leading={dateRange}
          />
        }
        actions={(c) => (
          <RowActions
            name={c.numero_cotizacion || "cotización"}
            onView={() => onView(c.id)}
            menu={[
              { title: "Editar", icon: Pencil, onClick: () => onEdit(c.id) },
              { title: "Duplicar", icon: Copy, onClick: () => { if (!duplicateMutation.isPending) duplicateMutation.mutate(c.id); } },
            ]}
            onDelete={() => deleteMutation.mutate(c.id)}
            deleteConfirmation={{
              title: "¿Eliminar cotización?",
              description: "Esta acción no se puede deshacer. Se eliminará la cotización y todos sus ítems permanentemente.",
            }}
          />
        )}
        empty="Aún no hay cotizaciones. Crea una con «Nueva cotización»."
      />
    </div>
  );
};

export default CotizacionList;
