import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MedicationBlock {
  id: string;
  nombre: string;
  dosis: string;
  unidad: string;
  via: string;
  frecuenciaValor: string;
  frecuenciaUnidad: string;
  duracionValor: string;
  duracionUnidad: string;
  indicaciones: string;
  showIndicaciones: boolean;
}

interface MedicationOrderFormProps {
  admisionId: string | null;
  pacienteId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

const emptyMed = (): MedicationBlock => ({
  id: crypto.randomUUID(),
  nombre: '',
  dosis: '',
  unidad: 'mg',
  via: 'oral',
  frecuenciaValor: '',
  frecuenciaUnidad: 'horas',
  duracionValor: '',
  duracionUnidad: 'días',
  indicaciones: '',
  showIndicaciones: false,
});

const UNIDADES = ['mg', 'ml', 'g', 'mcg', 'UI', 'gotas', 'tabletas', 'cápsulas'];
const VIAS = ['oral', 'IV', 'IM', 'SC', 'tópica', 'inhalatoria', 'rectal', 'sublingual', 'oftálmica', 'ótica'];
const FREQ_UNIDADES = ['horas', 'días'];
const DUR_UNIDADES = ['días', 'semanas', 'meses'];

function calcDosis(med: MedicationBlock): string | null {
  const dosis = parseFloat(med.dosis);
  const freq = parseFloat(med.frecuenciaValor);
  const dur = parseFloat(med.duracionValor);
  if (!dosis || !freq || !dur || freq <= 0) return null;

  // Convert duration to hours
  let durHours = dur;
  if (med.duracionUnidad === 'días') durHours = dur * 24;
  else if (med.duracionUnidad === 'semanas') durHours = dur * 24 * 7;
  else if (med.duracionUnidad === 'meses') durHours = dur * 24 * 30;

  // Convert frequency to hours
  let freqHours = freq;
  if (med.frecuenciaUnidad === 'días') freqHours = freq * 24;

  const totalDosis = Math.ceil(durHours / freqHours);
  const totalAmount = dosis * totalDosis;

  return `${dosis} ${med.unidad} c/${freq} ${med.frecuenciaUnidad} × ${dur} ${med.duracionUnidad} = ${totalDosis} dosis (${totalAmount} ${med.unidad} total)`;
}

export const MedicationOrderForm: React.FC<MedicationOrderFormProps> = ({
  admisionId,
  pacienteId,
  onSaved,
  onCancel,
}) => {
  const { user, profile } = useAuth();
  const [diagnosticoCodigo, setDiagnosticoCodigo] = useState('');
  const [diagnosticoDescripcion, setDiagnosticoDescripcion] = useState('');
  const [diagnosticoSearch, setDiagnosticoSearch] = useState('');
  const [diagResults, setDiagResults] = useState<any[]>([]);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [medications, setMedications] = useState<MedicationBlock[]>([emptyMed()]);
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [saving, setSaving] = useState(false);

  // Diagnosis search
  const searchDiagnosis = useCallback(async (term: string) => {
    if (term.length < 2) { setDiagResults([]); return; }
    setDiagLoading(true);
    const { data } = await supabase
      .from('catalogo_diagnosticos')
      .select('codigo, descripcion, sistema, fhir_system_uri')
      .eq('sistema', 'CIE-10')
      .eq('activo', true)
      .or(`codigo.ilike.%${term}%,descripcion.ilike.%${term}%`)
      .limit(8);
    setDiagResults(data || []);
    setDiagLoading(false);
    setDiagOpen(true);
  }, []);

  const diagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDiagSearch = (val: string) => {
    setDiagnosticoSearch(val);
    if (diagTimerRef.current) clearTimeout(diagTimerRef.current);
    if (val.length >= 2) {
      diagTimerRef.current = setTimeout(() => searchDiagnosis(val), 300);
    } else {
      setDiagResults([]);
      setDiagOpen(false);
    }
  };

  const selectDiagnosis = (diag: any) => {
    setDiagnosticoCodigo(diag.codigo);
    setDiagnosticoDescripcion(diag.descripcion);
    setDiagnosticoSearch(`${diag.codigo} - ${diag.descripcion}`);
    setDiagOpen(false);
  };

  const updateMed = (id: string, field: keyof MedicationBlock, value: any) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMed = (id: string) => {
    if (medications.length === 1) return;
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const addMed = () => {
    setMedications(prev => [...prev, emptyMed()]);
  };

  const handleSave = async () => {
    if (!user || !pacienteId) {
      toast.error('Faltan datos de usuario o paciente');
      return;
    }

    const validMeds = medications.filter(m => m.nombre.trim());
    if (validMeds.length === 0) {
      toast.error('Agregue al menos un medicamento');
      return;
    }

    setSaving(true);
    try {
      const items = validMeds.map(m => ({
        nombre: m.nombre,
        dosis: m.dosis,
        unidad: m.unidad,
        via: m.via,
        frecuencia: m.frecuencia,
        duracion: m.duracion,
        indicaciones: m.indicaciones,
      }));

      const { error } = await supabase.from('ordenes_medicas').insert({
        tipo: 'medicamento',
        paciente_id: pacienteId,
        admision_id: admisionId,
        medico_id: user.id,
        medico_nombre: profile?.full_name || 'Médico',
        numero_orden: '',
        items: items as any,
        indicaciones: indicacionesGenerales || null,
        diagnostico_codigo: diagnosticoCodigo || null,
        diagnostico_descripcion: diagnosticoDescripcion || null,
        diagnostico_sistema: diagnosticoCodigo ? 'CIE-10' : null,
      });

      if (error) throw error;
      toast.success('Orden de medicamentos guardada');
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la orden');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ overscrollBehavior: 'contain' }}>
        {/* Diagnosis */}
        <div className="relative">
          <Label className="text-[11px] text-muted-foreground mb-1 block">Diagnóstico asociado (CIE-10)</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              value={diagnosticoSearch}
              onChange={(e) => handleDiagSearch(e.target.value)}
              placeholder="Buscar diagnóstico..."
              className="h-7 text-xs pl-7"
              onFocus={() => diagResults.length > 0 && setDiagOpen(true)}
              onBlur={() => setTimeout(() => setDiagOpen(false), 200)}
            />
            {diagLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          {diagOpen && diagResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
              {diagResults.map((d: any) => (
                <button
                  key={d.codigo}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                  onMouseDown={() => selectDiagnosis(d)}
                >
                  <span className="font-medium text-primary">{d.codigo}</span>
                  <span className="ml-1.5 text-muted-foreground">{d.descripcion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Medication blocks */}
        {medications.map((med, idx) => (
          <div key={med.id} className="space-y-2">
            {idx > 0 && <div className="border-b border-dashed border-border" />}

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Medicamento {idx + 1}</span>
              {medications.length > 1 && (
                <button onClick={() => removeMed(med.id)} className="text-destructive hover:text-destructive/80 p-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <Input
              value={med.nombre}
              onChange={(e) => updateMed(med.id, 'nombre', e.target.value)}
              placeholder="Nombre del medicamento"
              className="h-7 text-xs"
            />

            {/* Row 1: Dosis + Unidad + Vía */}
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <Label className="text-[10px] text-muted-foreground">Dosis</Label>
                <Input
                  value={med.dosis}
                  onChange={(e) => updateMed(med.id, 'dosis', e.target.value)}
                  placeholder="500"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Unidad</Label>
                <Select value={med.unidad} onValueChange={(v) => updateMed(med.id, 'unidad', v)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Vía</Label>
                <Select value={med.via} onValueChange={(v) => updateMed(med.id, 'via', v)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIAS.map(v => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Frecuencia + Duración */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <Label className="text-[10px] text-muted-foreground">Frecuencia</Label>
                <Input
                  value={med.frecuencia}
                  onChange={(e) => updateMed(med.id, 'frecuencia', e.target.value)}
                  placeholder="Cada 8 horas"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Duración</Label>
                <Input
                  value={med.duracion}
                  onChange={(e) => updateMed(med.id, 'duracion', e.target.value)}
                  placeholder="7 días"
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* Indicaciones toggle */}
            {!med.showIndicaciones ? (
              <button
                type="button"
                onClick={() => updateMed(med.id, 'showIndicaciones', true)}
                className="text-[11px] text-primary hover:underline"
              >
                + Agregar indicación
              </button>
            ) : (
              <div>
                <Label className="text-[10px] text-muted-foreground">Indicaciones especiales</Label>
                <Textarea
                  value={med.indicaciones}
                  onChange={(e) => updateMed(med.id, 'indicaciones', e.target.value)}
                  placeholder="Tomar con alimentos..."
                  className="min-h-[48px] text-xs resize-y"
                  rows={2}
                />
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addMed}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline py-1"
        >
          <Plus className="w-3 h-3" />
          Agregar otro medicamento
        </button>

        {/* General instructions */}
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1 block">Indicaciones generales</Label>
          <Textarea
            value={indicacionesGenerales}
            onChange={(e) => setIndicacionesGenerales(e.target.value)}
            placeholder="Indicaciones adicionales para la orden..."
            className="min-h-[48px] text-xs resize-y"
            rows={2}
          />
        </div>
      </div>

      {/* Sticky bottom buttons */}
      <div className="shrink-0 border-t bg-card p-3 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 h-7 text-xs" disabled={saving}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} className="flex-1 h-7 text-xs" disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Guardar orden
        </Button>
      </div>
    </div>
  );
};

export default MedicationOrderForm;
