import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';
import {
  Printer, PenLine, AlertTriangle, Filter, Calendar as CalendarIcon,
  Search, FileText, User, Stethoscope, ClipboardList, X, Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ReadOnlyFormView } from './registro/ReadOnlyFormView';

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
    opciones_diseno?: any;
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
  const [searchText, setSearchText] = useState('');

  // Selected folio for detail panel
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null);

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
        .select('id, formulario_id, admision_id, medico_id, datos_respuesta, created_at, formularios(titulo, preguntas, opciones_diseno)')
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

  const unlinkedRegistros = useMemo(() => registrosByAdmision['__unlinked'] || [], [registrosByAdmision]);

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

  // ── Flattened rows for the grid (one row per folio, grouped by admission) ──
  type FlatRow = {
    folio: RespuestaFormulario;
    admision: Admision | null;
    isFirstOfAdmision: boolean;
    admisionLabel: string;
  };

  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    const search = searchText.trim().toLowerCase();

    const matchesSearch = (folio: RespuestaFormulario, admision: Admision | null) => {
      if (!search) return true;
      const haystack = [
        folio.formularios?.titulo,
        admision?.profesional_nombre,
        admision?.diagnostico_principal,
        admision?.motivo,
        admision?.numero_ingreso,
        JSON.stringify(folio.datos_respuesta),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(search);
    };

    filteredAdmisiones.forEach(adm => {
      const folios = registrosByAdmision[adm.id] || [];
      let firstAdded = true;
      folios.forEach(folio => {
        if (!matchesSearch(folio, adm)) return;
        rows.push({
          folio,
          admision: adm,
          isFirstOfAdmision: firstAdded,
          admisionLabel: `Ingreso #${adm.numero_ingreso || '—'}`,
        });
        firstAdded = false;
      });
    });

    if (filterMedico === 'all') {
      const unlinked = registrosByAdmision['__unlinked'] || [];
      let firstAdded = true;
      unlinked.forEach(folio => {
        if (!matchesSearch(folio, null)) return;
        rows.push({
          folio,
          admision: null,
          isFirstOfAdmision: firstAdded,
          admisionLabel: 'Sin ingreso vinculado',
        });
        firstAdded = false;
      });
    }
    return rows;
  }, [filteredAdmisiones, registrosByAdmision, filterMedico, searchText]);

  // Auto-select first row when list changes
  React.useEffect(() => {
    if (flatRows.length > 0 && !flatRows.find(r => r.folio.id === selectedFolioId)) {
      setSelectedFolioId(flatRows[0].folio.id);
    } else if (flatRows.length === 0) {
      setSelectedFolioId(null);
    }
  }, [flatRows, selectedFolioId]);

  const selectedRow = useMemo(
    () => flatRows.find(r => r.folio.id === selectedFolioId) || null,
    [flatRows, selectedFolioId]
  );

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

  const printFolio = (respuesta: RespuestaFormulario, admision: Admision | null) => {
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

    const headerHtml = admision
      ? `<h2>Ingreso #${admision.numero_ingreso || '—'} — ${format(new Date(admision.fecha_inicio), "dd/MM/yyyy HH:mm")}</h2>
         <p>${admision.profesional_nombre || ''} · ${admision.diagnostico_principal || ''}</p>`
      : `<h2>Registro sin ingreso vinculado</h2>`;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Folio - ${respuesta.formularios?.titulo}</title>
      <style>body{font-family:system-ui,sans-serif;font-size:13px;padding:24px;color:#1a1a1a}table{width:100%;border-collapse:collapse}h2{margin:0 0 4px}h3{margin:16px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}</style>
    </head><body>
      ${headerHtml}
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

  // ── Master-detail grid view ──────────────────────────────
  const totalRecords = flatRows.length;
  const hasActiveFilters = filterMedico !== 'all' || filterDateFrom || filterDateTo || searchText;

  return (
    <div className="registro-atenciones flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3 mb-3 border-b border-border/60 print:hidden">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar en formularios, diagnósticos, contenido…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-8 pl-8 pr-8 text-xs"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
        </div>

        <Select value={filterMedico} onValueChange={setFilterMedico}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Profesional" />
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
            className="h-8 w-[130px] text-xs"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="h-8 w-[130px] text-xs"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterMedico('all');
              setFilterDateFrom('');
              setFilterDateTo('');
              setSearchText('');
            }}
            className="h-8 text-xs gap-1 text-muted-foreground"
          >
            <X className="w-3 h-3" />
            Limpiar
          </Button>
        )}

        <Badge variant="outline" className="ml-auto text-xs h-7 font-normal">
          {totalRecords} {totalRecords === 1 ? 'registro' : 'registros'}
        </Badge>

        <Button variant="outline" size="sm" onClick={printAll} className="gap-1.5 h-8 text-xs">
          <Printer className="w-3.5 h-3.5" />
          Imprimir todo
        </Button>
      </div>

      {/* Master-Detail Grid */}
      {totalRecords === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Sin registros clínicos</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters
              ? 'No se encontraron registros con los filtros aplicados.'
              : 'Este paciente aún no tiene atenciones registradas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,42%)_1fr] gap-3 flex-1 min-h-0">
          {/* LEFT: Grid */}
          <div className="border border-border/60 rounded-lg overflow-hidden bg-card flex flex-col min-h-0">
            {/* Grid header */}
            <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-muted/40 border-b border-border/60 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
              <div>Formulario / Profesional</div>
              <div className="text-right">Fecha</div>
            </div>

            {/* Grid rows */}
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/40">
                {flatRows.map((row) => (
                  <GridRow
                    key={row.folio.id}
                    row={row}
                    isSelected={row.folio.id === selectedFolioId}
                    hasCorrections={(correccionesByRespuesta[row.folio.id] || []).length > 0}
                    onSelect={() => setSelectedFolioId(row.folio.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT: Detail panel */}
          <div className="border border-border/60 rounded-lg overflow-hidden bg-card flex flex-col min-h-0">
            {selectedRow ? (
              <DetailPanel
                row={selectedRow}
                correcciones={correccionesByRespuesta[selectedRow.folio.id] || []}
                canCorrect={canCorrect}
                headerConfig={headerConfig}
                onPrint={() => printFolio(selectedRow.folio, selectedRow.admision)}
                onCorrect={() => {
                  setCorrectionTarget({
                    respuesta: selectedRow.folio,
                    admisionId: selectedRow.admision?.id || '',
                  });
                  setCorrForm({ campo_corregido: '', valor_nuevo: '', motivo: '', tipo_correccion: 'amendment' });
                  setCorrErrors({});
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Selecciona un registro
              </div>
            )}
          </div>
        </div>
      )}

      {/* Correction Dialog */}
      <CorrectionDialog
        correctionTarget={correctionTarget}
        setCorrectionTarget={setCorrectionTarget}
        corrForm={corrForm}
        setCorrForm={setCorrForm}
        corrErrors={corrErrors}
        handleSubmitCorrection={handleSubmitCorrection}
        createCorrection={createCorrection}
        getQuestionsForRespuesta={getQuestionsForRespuesta}
        formatValue={formatValue}
      />
    </div>
  );
};

// ── Grid Row ─────────────────────────────────────────────
interface GridRowProps {
  row: {
    folio: RespuestaFormulario;
    admision: Admision | null;
    isFirstOfAdmision: boolean;
    admisionLabel: string;
  };
  isSelected: boolean;
  hasCorrections: boolean;
  onSelect: () => void;
}

const GridRow: React.FC<GridRowProps> = ({ row, isSelected, hasCorrections, onSelect }) => {
  const { folio, admision, isFirstOfAdmision, admisionLabel } = row;
  const formularioTitulo = folio.formularios?.titulo || 'Registro';
  const profesional = admision?.profesional_nombre || '—';
  const diagnostico = admision?.diagnostico_principal;
  const estado = admision?.estado;
  const fechaAtencion = admision ? new Date(admision.fecha_inicio) : new Date(folio.created_at);

  return (
    <>
      {/* Admission group divider */}
      {isFirstOfAdmision && (
        <div className="px-3 pt-2.5 pb-1 bg-muted/20 border-y border-border/40 first:border-t-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ClipboardList className="w-3 h-3" />
            <span>{admisionLabel}</span>
            {admision && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="font-normal normal-case tracking-normal">
                  {format(new Date(admision.fecha_inicio), "dd 'de' MMM yyyy", { locale: es })}
                </span>
                {estado && (
                  <Badge
                    variant={estado === 'en_curso' ? 'default' : 'secondary'}
                    className="h-4 text-[9px] px-1.5 font-normal ml-auto"
                  >
                    {estado === 'en_curso' ? 'En curso' : estado}
                  </Badge>
                )}
              </>
            )}
          </div>
          {diagnostico && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate font-normal normal-case">
              Dx: {diagnostico}
            </p>
          )}
        </div>
      )}

      {/* Folio row */}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full text-left grid grid-cols-[1fr_auto] gap-2 items-start px-3 py-2.5 transition-colors group",
          isSelected
            ? "bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary"
            : "hover:bg-muted/40 border-l-2 border-l-transparent"
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <FileText className={cn(
              "w-3.5 h-3.5 shrink-0",
              isSelected ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs font-medium truncate",
              isSelected ? "text-foreground" : "text-foreground/90"
            )}>
              {formularioTitulo}
            </span>
            {hasCorrections && (
              <span title="Tiene correcciones">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground pl-5">
            <User className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{profesional}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] text-foreground/80 font-medium tabular-nums">
            {format(fechaAtencion, "dd/MM/yy")}
          </div>
          <div className="text-[10px] text-muted-foreground tabular-nums">
            {format(fechaAtencion, "HH:mm")}
          </div>
        </div>
      </button>
    </>
  );
};

// ── Detail Panel ─────────────────────────────────────────
interface DetailPanelProps {
  row: {
    folio: RespuestaFormulario;
    admision: Admision | null;
    admisionLabel: string;
  };
  correcciones: Correccion[];
  canCorrect: boolean;
  headerConfig?: any;
  onPrint: () => void;
  onCorrect: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  row, correcciones, canCorrect, headerConfig, onPrint, onCorrect,
}) => {
  const { folio, admision, admisionLabel } = row;
  const hasCorrections = correcciones.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Detail header */}
      <div className="px-4 py-3 border-b border-border/60 bg-muted/20 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <h3 className="text-sm font-semibold text-foreground truncate">
                {folio.formularios?.titulo || 'Registro'}
              </h3>
              {hasCorrections && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 border-amber-400/50 text-amber-700 dark:text-amber-400 font-normal">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {correcciones.length} {correcciones.length === 1 ? 'corrección' : 'correcciones'}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ClipboardList className="w-3 h-3" />
                {admisionLabel}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {admision?.profesional_nombre || '—'}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {format(new Date(folio.created_at), "dd/MM/yyyy HH:mm")}
              </span>
              {admision?.diagnostico_principal && (
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" />
                  {admision.diagnostico_principal}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 print:hidden">
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onPrint}>
              <Printer className="w-3 h-3" />
              Imprimir
            </Button>
            {canCorrect && (
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onCorrect}>
                <PenLine className="w-3 h-3" />
                Corregir
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detail body */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <ReadOnlyFormView
            questions={folio.formularios?.preguntas || []}
            data={folio.datos_respuesta}
            headerConfig={headerConfig}
            formTitle={folio.formularios?.titulo || 'Registro'}
          />

          {hasCorrections && (
            <div className="mt-4 space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Correcciones registradas
              </h4>
              {correcciones.map(c => (
                <div
                  key={c.id}
                  className="bg-amber-50/50 dark:bg-amber-950/20 border-l-2 border-amber-400 p-3 rounded-r text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium mb-1">
                    <span>{TIPO_LABELS[c.tipo_correccion] || 'Corrección'}</span>
                    <span className="text-muted-foreground font-normal">
                      — {format(new Date(c.created_at), "dd/MM/yyyy HH:mm")} por {c.medico_nombre}
                    </span>
                  </div>
                  <p><span className="font-medium">Campo:</span> {c.campo_corregido}</p>
                  <p><span className="font-medium">Motivo:</span> "{c.motivo}"</p>
                  {c.valor_anterior != null && (
                    <p>
                      <span className="font-medium">Antes:</span>{' '}
                      {typeof c.valor_anterior === 'object' ? JSON.stringify(c.valor_anterior) : String(c.valor_anterior)}
                      {c.valor_nuevo != null && (
                        <>
                          {' '}→ <span className="font-medium">Después:</span>{' '}
                          {typeof c.valor_nuevo === 'object' ? JSON.stringify(c.valor_nuevo) : String(c.valor_nuevo)}
                        </>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// ── Correction Dialog ────────────────────────────────────
interface CorrectionDialogProps {
  correctionTarget: { respuesta: RespuestaFormulario; admisionId: string } | null;
  setCorrectionTarget: (v: any) => void;
  corrForm: any;
  setCorrForm: (v: any) => void;
  corrErrors: Record<string, string>;
  handleSubmitCorrection: () => void;
  createCorrection: any;
  getQuestionsForRespuesta: (r: RespuestaFormulario) => any[];
  formatValue: (v: any) => string;
}

const CorrectionDialog: React.FC<CorrectionDialogProps> = ({
  correctionTarget, setCorrectionTarget, corrForm, setCorrForm,
  corrErrors, handleSubmitCorrection, createCorrection,
  getQuestionsForRespuesta, formatValue,
}) => (
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
        <div className="space-y-1.5">
          <Label className="text-xs">Campo a corregir *</Label>
          <Select value={corrForm.campo_corregido} onValueChange={(v: string) => setCorrForm((p: any) => ({ ...p, campo_corregido: v }))}>
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

        {corrForm.campo_corregido && correctionTarget && (
          <div className="space-y-1.5">
            <Label className="text-xs">Valor anterior</Label>
            <div className="p-2 rounded-md bg-muted text-sm min-h-[36px]">
              {formatValue((correctionTarget.respuesta.datos_respuesta as Record<string, any>)[corrForm.campo_corregido])}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Valor nuevo (opcional)</Label>
          <Textarea
            value={corrForm.valor_nuevo}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCorrForm((p: any) => ({ ...p, valor_nuevo: e.target.value }))}
            placeholder="Dejar vacío para notas aclaratorias"
            className="text-sm min-h-[60px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de corrección *</Label>
          <Select value={corrForm.tipo_correccion} onValueChange={(v: string) => setCorrForm((p: any) => ({ ...p, tipo_correccion: v }))}>
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

        <div className="space-y-1.5">
          <Label className="text-xs">Motivo * (mínimo 10 caracteres)</Label>
          <Textarea
            value={corrForm.motivo}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCorrForm((p: any) => ({ ...p, motivo: e.target.value }))}
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
);

export default RegistroAtenciones;
