import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Search, X, Plus, Trash2, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useServiciosClinicos, useCatalogoProcedimientos } from '@/hooks/useServiciosClinicos';
import { useCreateOrdenProcedimiento } from '@/hooks/useOrdenesProcedimientos';
import type { CatalogoProcedimiento } from '@/types/servicios';

const inputBase =
  'w-full bg-transparent border-0 border-b border-border/60 focus:border-primary focus:ring-0 outline-none px-1 py-1.5 text-xs placeholder:text-muted-foreground/50 transition-colors';
const labelBase = 'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

interface LineItem {
  procedimiento_id: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  dias: number;
  notas: string;
}

interface ProcedureOrderFormProps {
  admisionId: string | null;
  pacienteId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export const ProcedureOrderForm: React.FC<ProcedureOrderFormProps> = ({
  admisionId, pacienteId, onSaved, onCancel,
}) => {
  const { user: authUser } = useAuth();
  const medicoNombre = authUser?.user_metadata?.full_name || 'Médico';
  const medicoId = authUser?.id || '';

  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState(() => new Date().toTimeString().slice(0, 5));
  const [descripcion, setDescripcion] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const [selectedProc, setSelectedProc] = useState<CatalogoProcedimiento | null>(null);
  const [addCantidad, setAddCantidad] = useState(1);
  const [addDias, setAddDias] = useState(1);
  const [addNotas, setAddNotas] = useState('');

  const [items, setItems] = useState<LineItem[]>([]);

  const { data: servicios = [] } = useServiciosClinicos();
  const { data: resultados = [], isLoading: searching } = useCatalogoProcedimientos(
    debouncedSearch, servicioId || undefined
  );
  const createMutation = useCreateOrdenProcedimiento();

  useEffect(() => {
    if (servicios.length > 0 && !servicioId) {
      const def = servicios.find(s => s.tipo === 'procedimientos');
      setServicioId(def ? def.id : servicios[0].id);
    }
  }, [servicios, servicioId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSelectProc = useCallback((proc: CatalogoProcedimiento) => {
    setSelectedProc(proc);
    setSearchTerm('');
    setShowResults(false);
    setAddCantidad(1);
    setAddDias(1);
    setAddNotas('');
  }, []);

  const handleAddItem = useCallback(() => {
    if (!selectedProc) return;
    if (items.some(i => i.procedimiento_id === selectedProc.id)) {
      toast.error('Procedimiento ya agregado');
      return;
    }
    setItems(prev => [...prev, {
      procedimiento_id: selectedProc.id,
      codigo: selectedProc.codigo,
      descripcion: selectedProc.descripcion,
      cantidad: addCantidad,
      dias: addDias,
      notas: addNotas,
    }]);
    setSelectedProc(null);
  }, [selectedProc, addCantidad, addDias, addNotas, items]);

  const handleRemoveItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.procedimiento_id !== id));
  }, []);

  const handleSave = async () => {
    if (!servicioId) { toast.error('Seleccione un servicio'); return; }
    if (items.length === 0) { toast.error('Agregue al menos un procedimiento'); return; }
    if (!admisionId || !pacienteId) return;

    try {
      const result = await createMutation.mutateAsync({
        orden: {
          admision_id: admisionId,
          paciente_id: pacienteId,
          medico_id: medicoId,
          medico_nombre: medicoNombre,
          servicio_id: servicioId,
          alcance: 'interna',
          prioridad: 'routine',
          indicaciones: descripcion || null,
        },
        items: items.map(i => ({
          procedimiento_id: i.procedimiento_id,
          codigo_procedimiento: i.codigo,
          descripcion_procedimiento: i.descripcion,
          cantidad: i.cantidad,
          dias: i.dias,
          notas: i.notas || null,
        })),
      });
      toast.success(`Orden ${(result as any)?.numero_orden || ''} creada`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear la orden');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4">
        {/* Header fields */}
        <div className="space-y-2">
          <p className={labelBase}>DATOS DE LA ORDEN</p>

          <div>
            <label className={labelBase}>Servicio *</label>
            <select
              value={servicioId}
              onChange={e => { setServicioId(e.target.value); setItems([]); }}
              className={cn(inputBase, 'cursor-pointer')}
            >
              <option value="">Seleccionar...</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelBase}>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputBase} />
            </div>
            <div>
              <label className={labelBase}>Hora</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inputBase} />
            </div>
          </div>

          <div>
            <label className={labelBase}>Indicaciones</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Observaciones generales..."
              rows={2}
              className={cn(inputBase, 'resize-none')}
            />
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <p className={labelBase}>AGREGAR PROCEDIMIENTOS</p>

          {!servicioId && (
            <p className="text-[10px] text-amber-600">Seleccione un servicio primero</p>
          )}

          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
              onFocus={() => debouncedSearch.length >= 2 && setShowResults(true)}
              placeholder="Buscar código o descripción..."
              disabled={!servicioId}
              className={cn(inputBase, 'pl-6')}
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setShowResults(false); }}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded">
                <X className="w-3 h-3" />
              </button>
            )}

            {showResults && debouncedSearch.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                {searching ? (
                  <div className="flex items-center gap-2 px-2 py-2 text-[10px] text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                  </div>
                ) : resultados.length === 0 ? (
                  <p className="px-2 py-2 text-[10px] text-muted-foreground">Sin resultados</p>
                ) : (
                  resultados.map(proc => (
                    <button
                      key={proc.id}
                      onClick={() => handleSelectProc(proc)}
                      className="w-full text-left px-2 py-1.5 hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
                    >
                      <span className="text-[10px] font-mono font-semibold text-primary">{proc.codigo}</span>
                      <span className="text-[10px] ml-1.5">{proc.descripcion}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Inline add */}
          {selectedProc && (
            <div className="p-2 rounded-lg border border-dashed border-border/60 bg-muted/20 space-y-1.5">
              <div>
                <span className="text-[10px] font-mono font-semibold text-primary">{selectedProc.codigo}</span>
                <span className="text-[10px] ml-1">{selectedProc.descripcion}</span>
              </div>
              <div className="flex items-end gap-2">
                <div className="w-14">
                  <label className={labelBase}>Cant.</label>
                  <input type="number" min={1} value={addCantidad}
                    onChange={e => setAddCantidad(Math.max(1, +e.target.value))}
                    className={cn(inputBase, 'text-center')} />
                </div>
                <div className="w-14">
                  <label className={labelBase}>Días</label>
                  <input type="number" min={1} value={addDias}
                    onChange={e => setAddDias(Math.max(1, +e.target.value))}
                    className={cn(inputBase, 'text-center')} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className={labelBase}>Notas</label>
                  <input type="text" value={addNotas} onChange={e => setAddNotas(e.target.value)}
                    placeholder="Opcional" className={inputBase} />
                </div>
                <Button size="sm" onClick={handleAddItem} className="shrink-0 h-7 text-[10px] gap-1 px-2">
                  <Plus className="w-3 h-3" /> Agregar
                </Button>
                <button onClick={() => setSelectedProc(null)}
                  className="shrink-0 p-1 hover:bg-muted rounded text-muted-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Items summary */}
        <div>
          <p className={cn(labelBase, 'mb-1.5')}>
            RESUMEN
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[9px] px-1 py-0 h-3.5">{items.length}</Badge>
            )}
          </p>

          {items.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground/50">
              <Scissors className="w-6 h-6 mx-auto mb-1 opacity-30" />
              <p className="text-[10px]">Sin procedimientos</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map(item => (
                <div key={item.procedimiento_id}
                  className="flex items-center gap-1.5 py-1.5 border-b border-dashed border-border/40 text-[10px]">
                  <span className="font-mono font-semibold text-primary shrink-0">{item.codigo}</span>
                  <span className="flex-1 min-w-0 truncate">{item.descripcion}</span>
                  <span className="shrink-0 text-muted-foreground">{item.cantidad}×{item.dias}d</span>
                  <button onClick={() => handleRemoveItem(item.procedimiento_id)}
                    className="shrink-0 p-0.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/40 px-3 py-2 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={createMutation.isPending}
          className="flex-1 h-8 text-xs">
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave}
          disabled={items.length === 0 || !servicioId || createMutation.isPending}
          className="flex-1 h-8 text-xs gap-1">
          {createMutation.isPending
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Guardando...</>
            : <><Save className="w-3 h-3" /> Guardar orden</>}
        </Button>
      </div>
    </div>
  );
};
