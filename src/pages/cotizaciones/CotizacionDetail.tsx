import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/data/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Printer, Send, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FormHeaderPreview } from "@/components/forms/FormHeaderPreview";
import { SimpleTable, type SimpleColumn } from "@/components/kit/table";
import type { CotizacionItem, EstadoCotizacion } from "@/types/cotizacion-types";

const estadoBadge: Record<EstadoCotizacion, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-0" },
  enviada: { label: "Enviada", className: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border-0" },
  aceptada: { label: "Aceptada", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 border-0" },
  rechazada: { label: "Rechazada", className: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 border-0" },
  vencida: { label: "Vencida", className: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300 border-0" },
};

const formatCurrency = (val: number, moneda: string = "COP") =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda, minimumFractionDigits: 0 }).format(val);

const rightAligned = "text-right tabular-nums";

/** Columnas de los ítems: una celda, un dato (el código del servicio va en su propia columna). */
const itemColumns = (moneda: string): SimpleColumn<CotizacionItem>[] => [
  { id: "description", title: "Descripción", cell: (i) => i.descripcion_servicio, primary: true },
  { id: "code", title: "Código", cell: (i) => i.codigo_servicio || "—", className: "w-28 font-mono text-xs" },
  { id: "quantity", title: "Cant.", cell: (i) => i.cantidad, className: `w-16 ${rightAligned}` },
  { id: "unitPrice", title: "V. unit.", cell: (i) => formatCurrency(Number(i.valor_unitario), moneda), className: `w-32 ${rightAligned}` },
  { id: "discount", title: "Dto. %", cell: (i) => (Number(i.descuento_porcentaje) > 0 ? `${i.descuento_porcentaje}%` : "—"), className: `w-20 ${rightAligned}` },
  { id: "total", title: "Total", cell: (i) => formatCurrency(Number(i.valor_total), moneda), className: `w-32 font-medium text-foreground ${rightAligned}` },
];

interface Props {
  cotizacionId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

const CotizacionDetail = ({ cotizacionId, onBack, onEdit }: Props) => {
  const queryClient = useQueryClient();

  const { data: cotizacion, isLoading } = useQuery({
    queryKey: ["cotizacion", cotizacionId],
    queryFn: async () => {
      const { data, error } = await db
        .from("cotizaciones" as any)
        .select("*, clientes_cotizacion:cliente_cotizacion_id(*)")
        .eq("id", cotizacionId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["cotizacion-items", cotizacionId],
    queryFn: async () => {
      const { data, error } = await db
        .from("cotizacion_items" as any)
        .select("*")
        .eq("cotizacion_id", cotizacionId)
        .order("orden", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CotizacionItem[];
    },
  });

  const { data: headerConfig } = useQuery({
    queryKey: ["configuracion-encabezado"],
    queryFn: async () => {
      const { data, error } = await db
        .from("configuracion_encabezado")
        .select("*")
        .limit(1)
        .single();
      if (error) return null;
      return data;
    },
  });

  const { data: config } = useQuery({
    queryKey: ["configuracion-cotizaciones"],
    queryFn: async () => {
      const { data, error } = await db
        .from("configuracion_cotizaciones" as any)
        .select("*")
        .limit(1)
        .single();
      if (error) return null;
      return data as any;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newEstado: string) => {
      const { error } = await db
        .from("cotizaciones" as any)
        .update({ estado: newEstado } as any)
        .eq("id", cotizacionId);
      if (error) throw error;
    },
    onSuccess: (_, newEstado) => {
      queryClient.invalidateQueries({ queryKey: ["cotizacion", cotizacionId] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      const labels: Record<string, string> = {
        enviada: "Cotización marcada como enviada",
        aceptada: "Cotización aceptada",
        rechazada: "Cotización rechazada",
        vencida: "Cotización marcada como vencida",
        borrador: "Cotización regresada a borrador",
      };
      toast.success(labels[newEstado] || "Estado actualizado");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al cambiar estado");
    },
  });

  if (isLoading || !cotizacion) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-6" aria-busy="true" aria-label="Cargando cotización">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    );
  }

  const estado = cotizacion.estado as EstadoCotizacion;
  const badge = estadoBadge[estado] || estadoBadge.borrador;
  const cliente = cotizacion.clientes_cotizacion;

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium text-foreground">{cotizacion.numero_cotizacion}</span>
          <Badge variant="secondary" className={`text-xs font-medium ${badge.className}`}>
            {badge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Status actions based on current state */}
          {estado === "borrador" && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => statusMutation.mutate("enviada")} disabled={statusMutation.isPending}>
              <Send className="w-3.5 h-3.5" />
              Marcar como Enviada
            </Button>
          )}
          {estado === "enviada" && (
            <>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => statusMutation.mutate("aceptada")} disabled={statusMutation.isPending}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aceptar
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => statusMutation.mutate("rechazada")} disabled={statusMutation.isPending}>
                <XCircle className="w-3.5 h-3.5" />
                Rechazar
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => statusMutation.mutate("vencida")} disabled={statusMutation.isPending}>
                <Clock className="w-3.5 h-3.5" />
                Vencida
              </Button>
            </>
          )}
          {(estado === "rechazada" || estado === "vencida") && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => statusMutation.mutate("borrador")} disabled={statusMutation.isPending}>
              Volver a Borrador
            </Button>
          )}
          <Separator orientation="vertical" className="h-5" />
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => onEdit(cotizacionId)}>
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Document preview */}
      <div className="bg-muted/20 p-6 md:p-10 print:bg-white print:p-0">
        <div className="max-w-3xl mx-auto bg-background rounded-xl shadow-sm border border-border/50 p-8 text-sm space-y-6 print:shadow-none print:border-0 print:rounded-none print:p-0 print:max-w-none">
          {/* Institution header */}
          {headerConfig && <FormHeaderPreview config={headerConfig as any} />}

          {/* Title */}
          <div className="text-center py-2">
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">Cotización</h2>
            <p className="text-sm text-muted-foreground mt-0.5">N° {cotizacion.numero_cotizacion}</p>
          </div>

          {/* Client info */}
          {cliente && (
            <div className="rounded-lg border border-border/50 p-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos del cliente</p>
              <p className="font-medium text-foreground">{cliente.nombre_razon_social}</p>
              <p className="text-xs text-muted-foreground">{cliente.tipo_documento} {cliente.numero_documento}</p>
              {cliente.correo && <p className="text-xs text-muted-foreground">{cliente.correo}</p>}
              {cliente.telefono_contacto && <p className="text-xs text-muted-foreground">Tel: {cliente.telefono_contacto}</p>}
              {cliente.direccion && <p className="text-xs text-muted-foreground">{cliente.direccion}{cliente.ciudad ? `, ${cliente.ciudad}` : ""}</p>}
            </div>
          )}

          {/* Dates */}
          <div className="flex gap-8 text-xs">
            <div>
              <span className="text-muted-foreground">Fecha emisión: </span>
              <span className="font-medium text-foreground">{format(new Date(cotizacion.fecha_emision), "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Válida hasta: </span>
              <span className="font-medium text-foreground">{format(new Date(cotizacion.fecha_validez), "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
            </div>
          </div>

          {/* Items table */}
          {items && items.length > 0 && (
            <SimpleTable
              columns={itemColumns(cotizacion.moneda)}
              rows={items}
              rowKey={(i) => i.id}
              className="shadow-none print:rounded-none"
            />
          )}

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatCurrency(Number(cotizacion.subtotal), cotizacion.moneda)}</span>
              </div>
              {Number(cotizacion.descuento_porcentaje) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento ({cotizacion.descuento_porcentaje}%)</span>
                  <span className="text-foreground">-{formatCurrency(Number(cotizacion.descuento_valor), cotizacion.moneda)}</span>
                </div>
              )}
              {Number(cotizacion.impuesto_porcentaje) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{config?.nombre_impuesto || "Impuesto"} ({cotizacion.impuesto_porcentaje}%)</span>
                  <span className="text-foreground">+{formatCurrency(Number(cotizacion.impuesto_valor), cotizacion.moneda)}</span>
                </div>
              )}
              <Separator className="opacity-50" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatCurrency(Number(cotizacion.total), cotizacion.moneda)}</span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {cotizacion.observaciones && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Observaciones</p>
              <p className="text-sm text-foreground whitespace-pre-line">{cotizacion.observaciones}</p>
            </div>
          )}

          {/* Leyenda */}
          {cotizacion.leyenda_validez && (
            <p className="text-xs text-muted-foreground italic border-t border-border/30 pt-3">{cotizacion.leyenda_validez}</p>
          )}

          {/* Notas legales */}
          {config?.notas_legales && (
            <p className="text-xs text-muted-foreground border-t border-border/30 pt-3">{config.notas_legales}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CotizacionDetail;
