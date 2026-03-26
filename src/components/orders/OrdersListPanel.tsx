import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pill, TestTube, Scan, UserPlus, Scissors, ClipboardList, Loader2, Clock, User, ChevronRight, Printer, Mail, MessageCircle } from 'lucide-react';
import { printOrder, shareOrderWhatsApp, shareOrderEmail } from '@/utils/order-print-utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface Order {
  id: string;
  tipo: string;
  numero_orden: string;
  estado: string;
  fecha_orden: string | null;
  prioridad: string | null;
  medico_nombre: string;
  diagnostico_descripcion: string | null;
  indicaciones: string | null;
  items: any;
}

interface OrdersListPanelProps {
  admisionId: string | null;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  medicamento: { icon: <Pill className="w-3.5 h-3.5" />, label: 'Medicamentos', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
  laboratorio: { icon: <TestTube className="w-3.5 h-3.5" />, label: 'Laboratorio', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
  imagenologia: { icon: <Scan className="w-3.5 h-3.5" />, label: 'Imagenología', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400' },
  interconsulta: { icon: <UserPlus className="w-3.5 h-3.5" />, label: 'Interconsulta', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
  procedimiento: { icon: <Scissors className="w-3.5 h-3.5" />, label: 'Procedimiento', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
};

const statusVariant = (estado: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (estado) {
    case 'activa': return 'default';
    case 'completada': return 'success';
    case 'cancelada': return 'destructive';
    default: return 'outline';
  }
};

const prioridadLabel: Record<string, string> = {
  routine: 'Rutina',
  urgent: 'Urgente',
  stat: 'Stat',
  asap: 'Lo antes posible',
};

export const OrdersListPanel: React.FC<OrdersListPanelProps> = ({ admisionId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!admisionId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('ordenes_medicas')
      .select('id, tipo, numero_orden, estado, fecha_orden, prioridad, medico_nombre, diagnostico_descripcion, indicaciones, items')
      .eq('admision_id', admisionId)
      .order('fecha_orden', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, [admisionId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ClipboardList className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No hay órdenes en esta atención</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Usa los tabs de arriba para crear una nueva orden</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const renderItems = (items: any) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null;
    return (
      <div className="mt-2 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Medicamentos</p>
        {items.map((item: any, idx: number) => (
          <div key={idx} className="text-xs bg-muted/50 rounded px-2 py-1.5">
            <span className="font-medium">{item.nombre || 'Sin nombre'}</span>
            {item.dosis && <span className="text-muted-foreground"> — {item.dosis} {item.unidad}, {item.via}, c/{item.frecuencia}, {item.duracion}</span>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {orders.map((order) => {
          const config = typeConfig[order.tipo] || { icon: <ClipboardList className="w-3.5 h-3.5" />, label: order.tipo, color: 'text-muted-foreground bg-muted' };
          const isExpanded = expandedId === order.id;

          return (
            <Card
              key={order.id}
              className={cn(
                "overflow-hidden transition-all cursor-pointer border",
                isExpanded ? "ring-1 ring-primary/20" : "hover:border-primary/30"
              )}
              onClick={() => toggleExpand(order.id)}
            >
              {/* Header row */}
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className={cn("flex items-center justify-center w-7 h-7 rounded-md shrink-0", config.color)}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold truncate">{order.numero_orden}</span>
                    <Badge variant={statusVariant(order.estado)} className="text-[9px] h-4 px-1.5 shrink-0">
                      {order.estado}
                    </Badge>
                    {order.prioridad && order.prioridad !== 'routine' && (
                      <Badge variant="warning" className="text-[9px] h-4 px-1.5 shrink-0">
                        {prioridadLabel[order.prioridad] || order.prioridad}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {order.fecha_orden && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(order.fecha_orden), "d MMM yyyy · HH:mm", { locale: es })}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                      <User className="w-2.5 h-2.5 shrink-0" />
                      {order.medico_nombre}
                    </span>
                  </div>
                </div>
                <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground/50 shrink-0 transition-transform", isExpanded && "rotate-90")} />
              </div>

              {/* Diagnosis preview (always visible if exists) */}
              {order.diagnostico_descripcion && !isExpanded && (
                <div className="px-3 pb-2 -mt-0.5">
                  <p className="text-[10px] text-muted-foreground truncate">
                    Dx: {order.diagnostico_descripcion}
                  </p>
                </div>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-dashed space-y-2 pt-2">
                  {order.diagnostico_descripcion && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Diagnóstico</p>
                      <p className="text-xs">{order.diagnostico_descripcion}</p>
                    </div>
                  )}

                  {renderItems(order.items)}

                  {order.indicaciones && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Indicaciones</p>
                      <p className="text-xs text-muted-foreground">{order.indicaciones}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-dashed">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] gap-1"
                      onClick={(e) => { e.stopPropagation(); printOrder(order); }}
                    >
                      <Printer className="w-3 h-3" /> Imprimir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] gap-1"
                      onClick={(e) => { e.stopPropagation(); shareOrderEmail(order); }}
                    >
                      <Mail className="w-3 h-3" /> Email
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] gap-1 text-emerald-600"
                      onClick={(e) => { e.stopPropagation(); shareOrderWhatsApp(order); }}
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default OrdersListPanel;
