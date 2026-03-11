import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import type { EstadoCotizacion } from "@/types/cotizacion-types";

const estadoBadge: Record<EstadoCotizacion, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  enviada: { label: "Enviada", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  aceptada: { label: "Aceptada", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  vencida: { label: "Vencida", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
};

interface Props {
  onNewClick: () => void;
}

const CotizacionList = ({ onNewClick }: Props) => {
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();

  const { data: cotizaciones, isLoading } = useQuery({
    queryKey: ["cotizaciones", estadoFilter, fechaDesde, fechaHasta],
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
      return data as any[];
    },
  });

  const formatCurrency = (val: number, moneda: string = "COP") => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: moneda, minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona las cotizaciones de servicios</p>
        </div>
        <Button onClick={onNewClick} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
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
            <DatePicker date={fechaDesde} setDate={setFechaDesde} placeholder="Desde" />
            <DatePicker date={fechaHasta} setDate={setFechaHasta} placeholder="Hasta" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Cotización</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Validez</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Cargando cotizaciones...
                  </TableCell>
                </TableRow>
              ) : !cotizaciones?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay cotizaciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                cotizaciones.map((cot: any) => {
                  const estado = cot.estado as EstadoCotizacion;
                  const badge = estadoBadge[estado] || estadoBadge.borrador;
                  return (
                    <TableRow key={cot.id}>
                      <TableCell className="font-medium">{cot.numero_cotizacion}</TableCell>
                      <TableCell>{cot.clientes_cotizacion?.nombre_razon_social || "—"}</TableCell>
                      <TableCell>{format(new Date(cot.fecha_emision), "dd MMM yyyy", { locale: es })}</TableCell>
                      <TableCell>{format(new Date(cot.fecha_validez), "dd MMM yyyy", { locale: es })}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(cot.total, cot.moneda)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CotizacionList;
