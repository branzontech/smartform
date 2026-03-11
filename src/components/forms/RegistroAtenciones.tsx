import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';
import {
  Printer, PenLine, ChevronDown, ChevronRight, AlertTriangle,
  Filter, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────
interface Admision {
  id: string;
  numero_ingreso: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  profesional_nombre: string | null;
  diagnostico_principal: string | null;
  motivo: string | null;
}

interface RespuestaFormulario {
  id: string;
  formulario_id: string;
  admision_id: string | null;
  medico_id: string;
  datos_respuesta: Record<string, any>;
  created_at: string;
  formularios: {
    titulo: string;
    preguntas: any[];
  } | null;
}

interface Correccion {
  id: string;
  respuesta_formulario_id: string;
  admision_id: string;
  medico_nombre: string;
  campo_corregido: string;
  valor_anterior: any;
  valor_nuevo: any;
  motivo: string;
  tipo_correccion: string;
  created_at: string;
}

// ── Validation ───────────────────────────────────────────
const correccionSchema = z.object({
  campo_corregido: z.string().min(1, 'Selecciona un campo'),
  valor_nuevo: z.string().optional(),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
  tipo_correccion: z.enum(['amendment', 'addendum', 'clarification']),
});

const TIPO_LABELS: Record<string, string> = {
  amendment: 'Corrección',
  addendum: 'Adición',
  clarification: 'Aclaración',
};

// ── Props ────────────────────────────────────────────────
interface RegistroAtencionesProps {
  patientId: string;
  headerConfig?: any;
}

// ── Component ────────────────────────────────────────────
export const RegistroAtenciones: React.FC<RegistroAtencionesProps> = ({
  patientId,
  headerConfig,
}) => {
  const { user, profile, hasRole } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [filterMedico, setFilterMedico] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Correction dialog
  const [correctionTarget, setCorrectionTarget] = useState<{
    respuesta: RespuestaFormulario;
    admisionId: string;
  } | null>(null);
  const [corrForm, setCorrForm] = useState({
    campo_corregido: '',
    valor_nuevo: '',
    motivo: '',
    tipo_correccion: 'amendment' as string,
  });
  const [corrErrors, setCorrErrors] = useState<Record<string, string>>({});

  // ── Queries ──────────────────────────────────────────
  const { data: admisiones = [], isLoading: loadingAdm } = useQuery({
    queryKey: ['admisiones-paciente', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admisiones')
        .select('id, numero_ingreso, fecha_inicio, fecha_fin, estado, profesional_nombre, diagnostico_principal, motivo')
        .eq('paciente_id', patientId)
        .order('fecha_inicio', { ascending: false });
      if (error) throw error;
      return (data || []) as Admision[];
    },
  });

  const { data: registros = [], isLoading: loadingReg } = useQuery({
    queryKey: ['registros-paciente', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('respuestas_formularios')
        .select('id, formulario_id, admision_id, medico_id, datos_respuesta, created_at, formularios(titulo, preguntas)')
        .eq('paciente_id', patientId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as RespuestaFormulario[];
    },
  });

  const admisionIds = useMemo(() => admisiones.map(a => a.id), [admisiones]);

  const { data: correcciones = [] } = useQuery({
    queryKey: ['correcciones-paciente', patientId, admisionIds],
    queryFn: async () => {
      if (admisionIds.length === 0) return [];
      const { data, error } = await supabase
        .from('correcciones_registro')
        .select('*')
        .in('admision_id', admisionIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Correccion[];
    },
    enabled: admisionIds.length > 0,
  });

  // ── Derived data ───────────────────────────────────────
  const medicosList = useMemo(() => {
    const names = new Set<string>();
    admisiones.forEach(a => { if (a.profesional_nombre) names.add(a.profesional_nombre); });
    return Array.from(names);
  }, [admisiones]);

  const registrosByAdmision = useMemo(() => {
    const map: Record<string, RespuestaFormulario[]> = {};
    registros.forEach(r => {
      const key = r.admision_id || '__unlinked';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [registros]);

  const correccionesByRespuesta = useMemo(() => {
    const map: Record<string, Correccion[]> = {};
    correcciones.forEach(c => {
      if (!map[c.respuesta_formulario_id]) map[c.respuesta_formulario_id] = [];
      map[c.respuesta_formulario_id].push(c);
    });
    return map;
  }, [correcciones]);

  // ── Filtered admissions ────────────────────────────────
  const filteredAdmisiones = useMemo(() => {
    return admisiones.filter(a => {
      if (filterMedico !== 'all' && a.profesional_nombre !== filterMedico) return false;
      if (filterDateFrom && a.fecha_inicio < filterDateFrom) return false;
      if (filterDateTo && a.fecha_inicio > filterDateTo + 'T23:59:59') return false;
      return true;
    });
  }, [admisiones, filterMedico, filterDateFrom, filterDateTo]);

  // ── Mutation ───────────────────────────────────────────
  const createCorrection = useMutation({
    mutationFn: async (data: z.infer<typeof correccionSchema> & { respuestaId: string; admisionId: string; valorAnterior: any }) => {
      const { error } = await supabase.from('correcciones_registro').insert({
        respuesta_formulario_id: data.respuestaId,
        admision_id: data.admisionId,
        medico_id: user!.id,
        medico_nombre: profile?.full_name || user!.email || 'Desconocido',
        campo_corregido: data.campo_corregido,
        valor_anterior: data.valorAnterior,
        valor_nuevo: data.valor_nuevo ? JSON.parse(`"${data.valor_nuevo}"`) : null,
        motivo: data.motivo,
        tipo_correccion: data.tipo_correccion,
        fhir_provenance_target: `QuestionnaireResponse/${data.respuestaId}`,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correcciones-paciente', patientId] });
      toast.success('Corrección registrada exitosamente');
      setCorrectionTarget(null);
      setCorrForm({ campo_corregido: '', valor_nuevo: '', motivo: '', tipo_correccion: 'amendment' });
      setCorrErrors({});
    },
    onError: (err: any) => {
      toast.error('Error al guardar corrección', { description: err.message });
    },
  });

  const handleSubmitCorrection = () => {
    const result = correccionSchema.safeParse(corrForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(e => { errors[e.path[0] as string] = e.message; });
      setCorrErrors(errors);
      return;
    }
    if (!correctionTarget) return;

    const respData = correctionTarget.respuesta.datos_respuesta as Record<string, any>;
    const valorAnterior = respData[corrForm.campo_corregido] ?? null;

    createCorrection.mutate({
      ...result.data,
      valor_nuevo: corrForm.valor_nuevo || undefined,
      respuestaId: correctionTarget.respuesta.id,
      admisionId: correctionTarget.admisionId,
      valorAnterior,
    });
  };

  // ── Helpers ────────────────────────────────────────────
  const getQuestionLabel = (respuesta: RespuestaFormulario, fieldKey: string): string => {
    const preguntas = respuesta.formularios?.preguntas as any[] | undefined;
    if (!preguntas) return fieldKey;
    const q = preguntas.find((p: any) => p.id === fieldKey);
    return q?.title || fieldKey;
  };

  const getQuestionsForRespuesta = (respuesta: RespuestaFormulario) => {
    const preguntas = respuesta.formularios?.preguntas as any[] | undefined;
    if (!preguntas) return [];
    return preguntas.filter((q: any) => q.type !== 'section');
  };

  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'object' && !Array.isArray(val)) {
      return Object.entries(val)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') || '—';
    }
    if (Array.isArray(val)) return val.join(', ') || '—';
    return String(val);
  };

  const printFolio = (respuesta: RespuestaFormulario, admision: Admision) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const preguntas = getQuestionsForRespuesta(respuesta);
    const respData = respuesta.datos_respuesta as Record<string, any>;
    const folioCorrecciones = correccionesByRespuesta[respuesta.id] || [];

    const rows = preguntas.map((q: any) => 
      `<tr><td style="font-weight:600;padding:4px 8px;vertical-align:top;border-bottom:1px solid #eee;width:30%">${q.title}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${formatValue(respData[q.id])}</td></tr>`
    ).join('');

    const corrHtml = folioCorrecciones.map(c =>
      `<div style="margin-top:8px;padding:8px;border-left:3px solid #f59e0b;background:#fffbeb;">
        <strong>${TIPO_LABELS[c.tipo_correccion]}</strong> — ${format(new Date(c.created_at), "dd/MM/yyyy HH:mm")} por ${c.medico_nombre}<br/>
        Campo: ${c.campo_corregido} · Motivo: ${c.motivo}
        ${c.valor_anterior != null ? `<br/>Antes: ${formatValue(c.valor_anterior)}` : ''}
        ${c.valor_nuevo != null ? ` → Después: ${formatValue(c.valor_nuevo)}` : ''}
      </div>`
    ).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Folio - ${respuesta.formularios?.titulo}</title>
      <style>body{font-family:system-ui,sans-serif;font-size:13px;padding:24px;color:#1a1a1a}table{width:100%;border-collapse:collapse}h2{margin:0 0 4px}h3{margin:16px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}</style>
    </head><body>
      <h2>Ingreso #${admision.numero_ingreso || '—'} — ${format(new Date(admision.fecha_inicio), "dd/MM/yyyy HH:mm")}</h2>
      <p>${admision.profesional_nombre || ''} · ${admision.diagnostico_principal || ''}</p>
      <h3>${respuesta.formularios?.titulo || 'Registro'} — ${format(new Date(respuesta.created_at), "dd/MM/yyyy HH:mm")}</h3>
      <table>${rows}</table>
      ${corrHtml}
    </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const printAll = () => {
    window.print();
  };

  const canCorrect = hasRole('doctor') || hasRole('admin');
  const isLoading = loadingAdm || loadingReg;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="registro-atenciones">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-dashed print:hidden">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrar:</span>
        </div>
        <Select value={filterMedico} onValueChange={setFilterMedico}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Todos los profesionales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los profesionales</SelectItem>
            {medicosList.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="h-8 w-[140px] text-xs"
            placeholder="Desde"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="h-8 w-[140px] text-xs"
            placeholder="Hasta"
          />
        </div>
        <Button variant="outline" size="sm" onClick={printAll} className="ml-auto gap-1.5 h-8 text-xs">
          <Printer className="w-3.5 h-3.5" />
          Imprimir todo
        </Button>
      </div>

      {/* Empty state */}
      {filteredAdmisiones.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No se encontraron ingresos para este paciente.
        </p>
      )}

      {/* Admissions list */}
      <div className="space-y-0 print:space-y-0">
        {filteredAdmisiones.map((admision, admIdx) => {
          const folios = registrosByAdmision[admision.id] || [];
          return (
            <AdmisionSection
              key={admision.id}
              admision={admision}
              folios={folios}
              defaultOpen={admIdx === 0}
              correccionesByRespuesta={correccionesByRespuesta}
              canCorrect={canCorrect}
              onCorrect={(resp) => {
                setCorrectionTarget({ respuesta: resp, admisionId: admision.id });
                setCorrForm({ campo_corregido: '', valor_nuevo: '', motivo: '', tipo_correccion: 'amendment' });
                setCorrErrors({});
              }}
              onPrintFolio={(resp) => printFolio(resp, admision)}
              getQuestionLabel={getQuestionLabel}
              getQuestionsForRespuesta={getQuestionsForRespuesta}
              formatValue={formatValue}
            />
          );
        })}
      </div>

      {/* ── Correction Dialog ─────────────────────────── */}
      <Dialog open={!!correctionTarget} onOpenChange={(open) => { if (!open) setCorrectionTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Registrar corrección
            </DialogTitle>
            <DialogDescription>
              Las correcciones son inmutables y quedan registradas como parte del expediente clínico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Field to correct */}
            <div className="space-y-1.5">
              <Label className="text-xs">Campo a corregir *</Label>
              <Select value={corrForm.campo_corregido} onValueChange={v => setCorrForm(p => ({ ...p, campo_corregido: v }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Seleccionar campo" />
                </SelectTrigger>
                <SelectContent>
                  {correctionTarget && getQuestionsForRespuesta(correctionTarget.respuesta).map((q: any) => (
                    <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {corrErrors.campo_corregido && <p className="text-xs text-destructive">{corrErrors.campo_corregido}</p>}
            </div>

            {/* Previous value (readonly) */}
            {corrForm.campo_corregido && correctionTarget && (
              <div className="space-y-1.5">
                <Label className="text-xs">Valor anterior</Label>
                <div className="p-2 rounded-md bg-muted text-sm min-h-[36px]">
                  {formatValue((correctionTarget.respuesta.datos_respuesta as Record<string, any>)[corrForm.campo_corregido])}
                </div>
              </div>
            )}

            {/* New value */}
            <div className="space-y-1.5">
              <Label className="text-xs">Valor nuevo (opcional)</Label>
              <Textarea
                value={corrForm.valor_nuevo}
                onChange={e => setCorrForm(p => ({ ...p, valor_nuevo: e.target.value }))}
                placeholder="Dejar vacío para notas aclaratorias"
                className="text-sm min-h-[60px]"
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de corrección *</Label>
              <Select value={corrForm.tipo_correccion} onValueChange={v => setCorrForm(p => ({ ...p, tipo_correccion: v }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amendment">Corrección — Se corrige un error</SelectItem>
                  <SelectItem value="addendum">Adición — Se agrega información</SelectItem>
                  <SelectItem value="clarification">Aclaración — Se aclara sin cambiar valor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label className="text-xs">Motivo * (mínimo 10 caracteres)</Label>
              <Textarea
                value={corrForm.motivo}
                onChange={e => setCorrForm(p => ({ ...p, motivo: e.target.value }))}
                placeholder="Explique el motivo de la corrección..."
                className="text-sm min-h-[80px]"
              />
              {corrErrors.motivo && <p className="text-xs text-destructive">{corrErrors.motivo}</p>}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancelar</Button>
            </DialogClose>
            <Button size="sm" onClick={handleSubmitCorrection} disabled={createCorrection.isPending}>
              {createCorrection.isPending ? 'Guardando...' : 'Guardar corrección'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Admision Section (Collapsible) ───────────────────────
interface AdmisionSectionProps {
  admision: Admision;
  folios: RespuestaFormulario[];
  defaultOpen: boolean;
  correccionesByRespuesta: Record<string, Correccion[]>;
  canCorrect: boolean;
  onCorrect: (resp: RespuestaFormulario) => void;
  onPrintFolio: (resp: RespuestaFormulario) => void;
  getQuestionLabel: (resp: RespuestaFormulario, key: string) => string;
  getQuestionsForRespuesta: (resp: RespuestaFormulario) => any[];
  formatValue: (val: any) => string;
}

const AdmisionSection: React.FC<AdmisionSectionProps> = ({
  admision, folios, defaultOpen, correccionesByRespuesta, canCorrect,
  onCorrect, onPrintFolio, getQuestionLabel, getQuestionsForRespuesta, formatValue,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="print:break-before-page">
      {/* Admission header */}
      <CollapsibleTrigger className="w-full text-left group">
        <div className="flex items-start gap-2 py-3 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors">
          {open
            ? <ChevronDown className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-sm uppercase tracking-wide">
                Ingreso #{admision.numero_ingreso || '—'}
              </span>
              <span className="text-xs text-muted-foreground">
                — {format(new Date(admision.fecha_inicio), "dd/MM/yyyy HH:mm")}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                admision.estado === 'en_curso'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {admision.estado === 'en_curso' ? 'En curso' : admision.estado}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {admision.profesional_nombre || 'Sin profesional'}
              {admision.diagnostico_principal && ` · Dx: ${admision.diagnostico_principal}`}
            </p>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {folios.length === 0 ? (
          <p className="text-xs text-muted-foreground pl-6 pb-4">Sin registros clínicos en este ingreso.</p>
        ) : (
          <div className="pl-2 mb-6">
            {folios.map((folio, folioIdx) => {
              const preguntas = getQuestionsForRespuesta(folio);
              const respData = folio.datos_respuesta as Record<string, any>;
              const folioCorrecciones = correccionesByRespuesta[folio.id] || [];

              return (
                <div key={folio.id} className="border-l-2 border-muted pl-4 ml-2 relative">
                  {/* Folio header */}
                  <div className="flex items-center justify-between pt-3 pb-1">
                    <p className="text-sm">
                      <span className="font-medium">Folio {folioIdx + 1}</span>
                      <span className="text-muted-foreground"> · </span>
                      <span>{folio.formularios?.titulo || 'Registro'}</span>
                      <span className="text-muted-foreground"> · </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(folio.created_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </p>
                    <div className="flex items-center gap-1 print:hidden">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onPrintFolio(folio)} title="Imprimir folio">
                        <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      {canCorrect && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onCorrect(folio)}>
                          <PenLine className="w-3.5 h-3.5" />
                          Corregir
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Folio content — question/answer pairs */}
                  <div className="space-y-1 pb-3">
                    {preguntas.map((q: any) => {
                      const val = respData[q.id];
                      if (val === undefined || val === null || val === '') return null;
                      return (
                        <div key={q.id} className="text-sm">
                          <span className="font-medium text-muted-foreground">{q.title}:</span>{' '}
                          <span className="text-foreground">{formatValue(val)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Corrections */}
                  {folioCorrecciones.map(c => (
                    <div key={c.id} className="bg-amber-50/50 dark:bg-amber-950/20 border-l-2 border-amber-400 p-3 mb-2 rounded-r text-xs">
                      <div className="flex items-center gap-1.5 font-medium mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>{TIPO_LABELS[c.tipo_correccion] || 'Corrección'}</span>
                        <span className="text-muted-foreground font-normal">
                          — {format(new Date(c.created_at), "dd/MM/yyyy HH:mm")} por {c.medico_nombre}
                        </span>
                      </div>
                      <p>
                        <span className="font-medium">Campo:</span> {getQuestionLabel(folio, c.campo_corregido)}
                      </p>
                      <p>
                        <span className="font-medium">Motivo:</span> "{c.motivo}"
                      </p>
                      {c.valor_anterior != null && (
                        <p>
                          <span className="font-medium">Antes:</span> {formatValue(c.valor_anterior)}
                          {c.valor_nuevo != null && (
                            <> → <span className="font-medium">Después:</span> {formatValue(c.valor_nuevo)}</>
                          )}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Separator between folios */}
                  {folioIdx < folios.length - 1 && (
                    <div className="border-b border-dashed my-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default RegistroAtenciones;
