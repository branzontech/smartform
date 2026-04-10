import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PanelRightClose, Pill, TestTube, Scan, UserPlus, Scissors, ChevronRight, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { PatientHistoryPanel } from '@/components/patients/PatientHistoryPanel';
import { MedicationOrderForm } from './MedicationOrderForm';
import { ProcedureOrderForm } from './ProcedureOrderForm';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useOrdenesProcedimientosByAdmision, useOrdenProcedimientoDetail } from '@/hooks/useOrdenesProcedimientos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ORDER_TYPES = [
  { type: 'medicamento', label: 'Medicamentos', icon: Pill },
  { type: 'laboratorio', label: 'Laboratorio', icon: TestTube },
  { type: 'imagenologia', label: 'Imagenología', icon: Scan },
  { type: 'interconsulta', label: 'Interconsulta', icon: UserPlus },
  { type: 'procedimiento', label: 'Procedimientos', icon: Scissors },
];

/* ─── Procedimientos Tab Content ─── */
const ProcedimientosTabContent: React.FC<{
  admisionId: string | null;
  patientId: string;
  onOrderSaved: () => void;
}> = ({ admisionId, patientId, onOrderSaved }) => {
  const [showForm, setShowForm] = useState(false);
  const [detailOrdenId, setDetailOrdenId] = useState<string | null>(null);

  const { data: ordenes = [], isLoading } = useOrdenesProcedimientosByAdmision(admisionId);
  const { data: ordenDetail } = useOrdenProcedimientoDetail(detailOrdenId);

  if (showForm) {
    return (
      <ProcedureOrderForm
        admisionId={admisionId}
        pacienteId={patientId}
        onSaved={() => { setShowForm(false); onOrderSaved(); }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* New order button */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <Button size="sm" className="w-full gap-1.5 h-8 text-xs"
          onClick={() => setShowForm(true)} disabled={!admisionId}>
          <Plus className="w-3 h-3" /> Nueva Orden
        </Button>
      </div>

      {/* Orders list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : ordenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Scissors className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">No hay órdenes de procedimientos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ordenes.map(orden => (
              <button key={orden.id} onClick={() => setDetailOrdenId(orden.id)}
                className="w-full text-left p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-primary">{orden.numero_orden}</span>
                  <Badge variant={orden.estado === 'activa' ? 'default' : 'secondary'}
                    className="text-[9px] px-1.5 py-0 h-4">{orden.estado}</Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{orden.fecha_orden ? format(new Date(orden.fecha_orden), 'dd/MM/yyyy') : '—'}</span>
                  <span>•</span>
                  <span>{orden.items_detalle?.length || 0} items</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailOrdenId} onOpenChange={open => !open && setDetailOrdenId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0" aria-describedby={undefined}>
          <DialogHeader className="px-5 pt-4 pb-3 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Scissors className="w-4 h-4 text-primary" />
              {ordenDetail?.numero_orden || 'Cargando...'}
            </DialogTitle>
          </DialogHeader>
          {ordenDetail && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-5 py-3 bg-muted/30 border-y border-border/40">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Médico</span>
                    <p className="font-medium">{ordenDetail.medico_nombre}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Fecha</span>
                    <p>{ordenDetail.fecha_orden ? format(new Date(ordenDetail.fecha_orden), 'dd/MM/yyyy HH:mm') : '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Estado</span>
                    <p><Badge variant="secondary" className="text-[9px]">{ordenDetail.estado}</Badge></p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Servicio</span>
                    <p>{ordenDetail.servicio?.nombre || '—'}</p>
                  </div>
                </div>
                {ordenDetail.indicaciones && (
                  <div className="mt-2">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Indicaciones</span>
                    <p className="text-xs">{ordenDetail.indicaciones}</p>
                  </div>
                )}
              </div>
              <div className="px-5 py-3">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Procedimientos</p>
                {ordenDetail.items_detalle && ordenDetail.items_detalle.length > 0 ? (
                  <div className="border border-border/40 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/40 text-muted-foreground">
                          <th className="text-left px-3 py-1.5 font-semibold">Código</th>
                          <th className="text-left px-3 py-1.5 font-semibold">Descripción</th>
                          <th className="text-center px-2 py-1.5 font-semibold w-14">Cant.</th>
                          <th className="text-center px-2 py-1.5 font-semibold w-14">Días</th>
                          <th className="text-left px-2 py-1.5 font-semibold">Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenDetail.items_detalle.map(item => (
                          <tr key={item.id} className="border-t border-border/30">
                            <td className="px-3 py-1.5 font-mono font-semibold text-primary">{item.codigo_procedimiento}</td>
                            <td className="px-3 py-1.5">{item.descripcion_procedimiento}</td>
                            <td className="text-center px-2 py-1.5">{item.cantidad}</td>
                            <td className="text-center px-2 py-1.5">{item.dias}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{item.notas || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin items</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
/* ─── Main Component ─── */
interface RightPanelTabsProps {
  patientId: string;
  admisionId: string | null;
  onCollapse: () => void;
}

export const RightPanelTabs: React.FC<RightPanelTabsProps> = ({
  patientId,
  admisionId,
  onCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<string>('antecedentes');
  const [ordenesExpanded, setOrdenesExpanded] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!admisionId) { setOrdersCount(0); return; }
    const { count } = await supabase
      .from('ordenes_medicas')
      .select('id', { count: 'exact', head: true })
      .eq('admision_id', admisionId);
    setOrdersCount(count || 0);
  }, [admisionId]);

  useEffect(() => { fetchCount(); }, [fetchCount, refreshKey]);

  const handleOrdenesClick = () => {
    if (ordenesExpanded) {
      setOrdenesExpanded(false);
      setActiveTab('antecedentes');
    } else {
      setOrdenesExpanded(true);
      setActiveTab(`ordenes-${ORDER_TYPES[0].type}`);
    }
  };

  const handleAntecedentesClick = () => {
    setActiveTab('antecedentes');
    setOrdenesExpanded(false);
  };

  const handleOrderTypClick = (type: string) => {
    setActiveTab(`ordenes-${type}`);
  };

  const handleOrderSaved = () => {
    setRefreshKey(k => k + 1);
  };

  const isOrderTypeActive = (type: string) => activeTab === `ordenes-${type}`;

  const renderContent = () => {
    if (activeTab === 'antecedentes') {
      return <PatientHistoryPanel patientId={patientId} className="h-full" />;
    }

    const activeType = ORDER_TYPES.find(t => activeTab === `ordenes-${t.type}`);
    if (!activeType) return null;

    if (activeType.type === 'medicamento') {
      return (
        <MedicationOrderForm
          admisionId={admisionId}
          pacienteId={patientId}
          onSaved={handleOrderSaved}
          onCancel={() => handleAntecedentesClick()}
        />
      );
    }

    if (activeType.type === 'procedimiento') {
      return (
        <ProcedimientosTabContent
          admisionId={admisionId}
          patientId={patientId}
          onOrderSaved={handleOrderSaved}
        />
      );
    }

    const Icon = activeType.icon;
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <Icon className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium mb-1">{activeType.label}</p>
        <p className="text-xs text-muted-foreground">Próximamente</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs row */}
      <div className="shrink-0 border-b bg-card">
        <div className="flex items-center h-9 overflow-x-auto scrollbar-none">
          <button
            onClick={handleAntecedentesClick}
            className={cn(
              'shrink-0 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap',
              activeTab === 'antecedentes'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Antecedentes
          </button>

          <button
            onClick={handleOrdenesClick}
            className={cn(
              'shrink-0 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1',
              ordenesExpanded
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {ordenesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Órdenes
            {ordersCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                {ordersCount}
              </span>
            )}
          </button>

          {ordenesExpanded && (
            <>
              {ORDER_TYPES.map(ot => {
                const Icon = ot.icon;
                return (
                  <button
                    key={ot.type}
                    onClick={() => handleOrderTypClick(ot.type)}
                    className={cn(
                      'shrink-0 px-2 py-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1',
                      isOrderTypeActive(ot.type)
                        ? 'border-b-2 border-primary text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{ot.label}</span>
                  </button>
                );
              })}
            </>
          )}

          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className="h-7 w-7 shrink-0 text-muted-foreground mr-1"
          >
            <PanelRightClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default RightPanelTabs;
