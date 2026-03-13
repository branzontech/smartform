import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PanelRightClose, Plus, X, Pill, TestTube, Scan, UserPlus, Scissors } from 'lucide-react';
import { PatientHistoryPanel } from '@/components/patients/PatientHistoryPanel';
import { OrdersListPanel } from './OrdersListPanel';
import { MedicationOrderForm } from './MedicationOrderForm';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface OrderTab {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  isDirty?: boolean;
}

const ORDER_TYPES = [
  { type: 'medicamento', label: 'Medicamentos', icon: <Pill className="w-3.5 h-3.5" /> },
  { type: 'laboratorio', label: 'Laboratorio', icon: <TestTube className="w-3.5 h-3.5" /> },
  { type: 'imagenologia', label: 'Imagenología', icon: <Scan className="w-3.5 h-3.5" /> },
  { type: 'interconsulta', label: 'Interconsulta', icon: <UserPlus className="w-3.5 h-3.5" /> },
  { type: 'procedimiento', label: 'Procedimientos', icon: <Scissors className="w-3.5 h-3.5" /> },
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
  const [activeTab, setActiveTab] = useState<string>('antecedentes');
  const [orderTabs, setOrderTabs] = useState<OrderTab[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch orders count
  const fetchCount = useCallback(async () => {
    if (!admisionId) { setOrdersCount(0); return; }
    const { count } = await supabase
      .from('ordenes_medicas')
      .select('id', { count: 'exact', head: true })
      .eq('admision_id', admisionId);
    setOrdersCount(count || 0);
  }, [admisionId]);

  useEffect(() => { fetchCount(); }, [fetchCount, refreshKey]);

  const addOrderTab = (type: string) => {
    const def = ORDER_TYPES.find(t => t.type === type);
    if (!def) return;
    const newTab: OrderTab = {
      id: `order-${type}-${Date.now()}`,
      type,
      label: def.label,
      icon: def.icon,
    };
    setOrderTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    setAddMenuOpen(false);
  };

  const closeOrderTab = (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOrderTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTab === tabId) setActiveTab('ordenes');
  };

  const handleOrderSaved = (tabId: string) => {
    closeOrderTab(tabId);
    setRefreshKey(k => k + 1);
  };

  const renderTabContent = () => {
    if (activeTab === 'antecedentes') {
      return <PatientHistoryPanel patientId={patientId} className="h-full" />;
    }
    if (activeTab === 'ordenes') {
      return <OrdersListPanel key={refreshKey} admisionId={admisionId} />;
    }
    // Dynamic order tab
    const tab = orderTabs.find(t => t.id === activeTab);
    if (!tab) return null;

    if (tab.type === 'medicamento') {
      return (
        <MedicationOrderForm
          admisionId={admisionId}
          pacienteId={patientId}
          onSaved={() => handleOrderSaved(tab.id)}
          onCancel={() => closeOrderTab(tab.id)}
        />
      );
    }

    // Placeholder for other types
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="mb-3">{tab.icon}</div>
        <p className="text-sm font-medium mb-1">{tab.label}</p>
        <p className="text-xs text-muted-foreground">Próximamente</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs row */}
      <div className="shrink-0 border-b bg-card">
        <div className="flex items-center h-9 overflow-x-auto scrollbar-none">
          {/* Fixed: Antecedentes */}
          <button
            onClick={() => setActiveTab('antecedentes')}
            className={cn(
              'shrink-0 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap',
              activeTab === 'antecedentes'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Antecedentes
          </button>

          {/* Fixed: Órdenes */}
          <button
            onClick={() => setActiveTab('ordenes')}
            className={cn(
              'shrink-0 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1',
              activeTab === 'ordenes'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Órdenes
            {ordersCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                {ordersCount}
              </span>
            )}
          </button>

          {/* Dynamic order tabs */}
          {orderTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 px-2 py-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1 max-w-[140px] group',
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
              <button
                onClick={(e) => closeOrderTab(tab.id, e)}
                className="shrink-0 ml-0.5 p-0.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </button>
          ))}

          {/* Add button */}
          <Popover open={addMenuOpen} onOpenChange={setAddMenuOpen}>
            <PopoverTrigger asChild>
              <button className="shrink-0 mx-1 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-1" sideOffset={4}>
              {ORDER_TYPES.map(ot => (
                <button
                  key={ot.type}
                  onClick={() => addOrderTab(ot.type)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-accent transition-colors text-left"
                >
                  {ot.icon}
                  {ot.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Spacer + collapse button */}
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
        {renderTabContent()}
      </div>
    </div>
  );
};

export default RightPanelTabs;
