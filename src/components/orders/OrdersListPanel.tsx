import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Pill, TestTube, Scan, UserPlus, Scissors, ClipboardList, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Order {
  id: string;
  tipo: string;
  numero_orden: string;
  estado: string;
  fecha_orden: string | null;
  prioridad: string | null;
}

interface OrdersListPanelProps {
  admisionId: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  medicamento: <Pill className="w-3.5 h-3.5 text-primary" />,
  laboratorio: <TestTube className="w-3.5 h-3.5 text-primary" />,
  imagenologia: <Scan className="w-3.5 h-3.5 text-primary" />,
  interconsulta: <UserPlus className="w-3.5 h-3.5 text-primary" />,
  procedimiento: <Scissors className="w-3.5 h-3.5 text-primary" />,
};

const statusVariant = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (estado) {
    case 'activa': return 'default';
    case 'completada': return 'secondary';
    case 'cancelada': return 'destructive';
    default: return 'outline';
  }
};

export const OrdersListPanel: React.FC<OrdersListPanelProps> = ({ admisionId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!admisionId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('ordenes_medicas')
      .select('id, tipo, numero_orden, estado, fecha_orden, prioridad')
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
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
          <span className="shrink-0">{typeIcons[order.tipo] || <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{order.numero_orden}</p>
            {order.fecha_orden && (
              <p className="text-[11px] text-muted-foreground">
                {format(new Date(order.fecha_orden), "d MMM yyyy", { locale: es })}
              </p>
            )}
          </div>
          <Badge variant={statusVariant(order.estado)} className="text-[10px] h-5 px-1.5">
            {order.estado}
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default OrdersListPanel;
