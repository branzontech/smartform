import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PanelRightClose, Pill, TestTube, Scan, UserPlus, Scissors, ChevronRight, ChevronDown, ClipboardList } from 'lucide-react';
import { PatientHistoryPanel } from '@/components/patients/PatientHistoryPanel';
import { OrdersListPanel } from './OrdersListPanel';
import { MedicationOrderForm } from './MedicationOrderForm';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const ORDER_TYPES = [
  { type: 'medicamento', label: 'Medicamentos', icon: Pill },
  { type: 'laboratorio', label: 'Laboratorio', icon: TestTube },
  { type: 'imagenologia', label: 'Imagenología', icon: Scan },
  { type: 'interconsulta', label: 'Interconsulta', icon: UserPlus },
  { type: 'procedimiento', label: 'Procedimientos', icon: Scissors },
];

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
  // 'antecedentes' | 'ordenes-medicamento' | 'ordenes-laboratorio' | etc.
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
      setActiveTab('ordenes-historial');
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
    setActiveTab('ordenes-historial');
  };

  const isOrderTypeActive = (type: string) => activeTab === `ordenes-${type}`;

  const renderContent = () => {
    if (activeTab === 'antecedentes') {
      return <PatientHistoryPanel patientId={patientId} className="h-full" />;
    }

    if (activeTab === 'ordenes-historial') {
      return <OrdersListPanel key={refreshKey} admisionId={admisionId} />;
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
          {/* Antecedentes */}
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

          {/* Órdenes toggle */}
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

          {/* Order sub-tabs (visible when expanded) */}
          {ordenesExpanded && (
            <>
              <button
                onClick={() => setActiveTab('ordenes-historial')}
                className={cn(
                  'shrink-0 px-2 py-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1',
                  activeTab === 'ordenes-historial'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ClipboardList className="w-3 h-3" />
                <span className="hidden sm:inline">Historial</span>
              </button>
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
