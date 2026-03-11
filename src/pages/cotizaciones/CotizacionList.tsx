import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Search, FileText, Eye, Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import type { EstadoCotizacion } from "@/types/cotizacion-types";

const estadoBadge: Record<EstadoCotizacion, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-0" },
  enviada: { label: "Enviada", className: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border-0" },
  aceptada: { label: "Aceptada", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 border-0" },
  rechazada: { label: "Rechazada", className: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 border-0" },
  vencida: { label: "Vencida", className: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300 border-0" },
};

interface Props {
  onNewClick: () => void;
}

const CotizacionList = ({ onNewClick }: Props) => {
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [searchCliente, setSearchCliente] = useState("");

  const { data: cotizaciones, isLoading } = useQuery({
    queryKey: ["cotizaciones", estadoFilter, fechaDesde, fechaHasta, searchCliente],
    queryFn: async () => {
      let query = supabase
        .from("cotizaciones" as any)
        .select("*, clientes_cotizacion:cliente_cotizacion_id(*)")
        .order("created_at", { ascending: false });

      if (estadoFilter !== "todos") {
        query = query.eq("estado", estadoFilter);
      }
      if (fechaDesde) {
        query = query.gte("fecha_emision", format(fechaDesde, "yyyy-MM-dd"));
      }
      if (fechaHasta) {
        query = query.lte("fecha_emision", format(fechaHasta, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data as any[];
      if (searchCliente.trim()) {
        const term = searchCliente.toLowerCase();
        results = results.filter((c: any) =>
          c.clientes_cotizacion?.nombre_razon_social?.toLowerCase().includes(term)
        );
      }
      return results;
    },
  });

  const formatCurrency = (val: number, moneda: string = "COP") => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda, minimumFractionDigits: 0 }).format(val);
  };

  const isEmpty = !isLoading && (!cotizaciones || cotizaciones.length === 0);

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestiona las cotizaciones de servicios</p>
        </div>
        <Button onClick={onNewClick} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </Button>
      </div>

      {/* Filters — single row */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-[170px] h-9 text-sm bg-background/80">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="aceptada">Aceptada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker value={fechaDesde as Date} onChange={(d) => setFechaDesde(d)} placeholder="Desde" className="w-[150px] h-9 text-sm bg-background/80" />
        <DatePicker value={fechaHasta as Date} onChange={(d) => setFechaHasta(d)} placeholder="Hasta" className="w-[150px] h-9 text-sm bg-background/80" />
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchCliente}
            onChange={(e) => setSearchCliente(e.target.value)}
            className="pl-9 h-9 text-sm bg-background/80"
          />
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
          <div className="rounded-full bg-muted/50 p-6 mb-5">
            <FileText className="w-12 h-12 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No hay cotizaciones aún</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
            Crea tu primera cotización para comenzar a gestionar presupuestos de servicios.
          </p>
          <Button onClick={onNewClick} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Crear primera cotización
          </Button>
        </div>
      )}

      {/* Table */}
      {!isEmpty && (
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/50">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">N° Cotización</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha Emisión</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Validez</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">Total</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Cargando cotizaciones...
                  </TableCell>
                </TableRow>
              ) : (
                cotizaciones!.map((cot: any) => {
                  const estado = cot.estado as EstadoCotizacion;
                  const badge = estadoBadge[estado] || estadoBadge.borrador;
                  return (
                    <TableRow key={cot.id} className="hover:bg-muted/30 transition-colors duration-150 border-b border-border/30">
                      <TableCell className="font-medium text-sm text-foreground">{cot.numero_cotizacion}</TableCell>
                      <TableCell className="text-sm text-foreground">{cot.clientes_cotizacion?.nombre_razon_social || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(cot.fecha_emision), "dd MMM yyyy", { locale: es })}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(cot.fecha_validez), "dd MMM yyyy", { locale: es })}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-foreground">{formatCurrency(cot.total, cot.moneda)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CotizacionList;
