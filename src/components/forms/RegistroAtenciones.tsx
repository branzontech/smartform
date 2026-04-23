import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Printer, AlertTriangle, Filter, Calendar as CalendarIcon,
  Search, FileText, User, Stethoscope, ClipboardList, X, Inbox, History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ReadOnlyFormView } from './registro/ReadOnlyFormView';
import {
  CorrectionTriggerButton,
  HistorialCorreccionesDialog,
  DiffHighlightForm,
  type DiffEditableField,
} from '@/components/correcciones';
import type { EstadoRegistro } from '@/types/correccion';

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
  estado_registro: EstadoRegistro;
  supersedes: string | null;
  superseded_by: string | null;
  formularios: {
    titulo: string;
    preguntas: any[];
    opciones_diseno?: any;
  } | null;
}

interface ProvenanceLite {
  id: string;
  target_record_id: string;
  replacement_record_id: string | null;
  activity_type: 'entered-in-error' | 'correction' | 'amendment';
  agent_nombre_completo: string;
  recorded_at: string;
  reason_text: string;
}

// ── Props ────────────────────────────────────────────────
interface RegistroAtencionesProps {
  patientId: string;
  headerConfig?: any;
}

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

  // Historial dialog
  const [historialTarget, setHistorialTarget] = useState<RespuestaFormulario | null>(null);

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
        .select('id, formulario_id, admision_id, medico_id, datos_respuesta, created_at, estado_registro, supersedes, superseded_by, formularios(titulo, preguntas, opciones_diseno)')
        .eq('paciente_id', patientId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as RespuestaFormulario[];
    },
  });

  const admisionIds = useMemo(() => admisiones.map(a => a.id), [admisiones]);
  const respuestaIds = useMemo(() => registros.map(r => r.id), [registros]);

  // Provenance (FHIR) — reemplaza la antigua tabla correcciones_registro
  const { data: provenanceList = [] } = useQuery({
    queryKey: ['provenance-respuestas', patientId, respuestaIds],
    queryFn: async () => {
      if (respuestaIds.length === 0) return [];
      const { data, error } = await supabase
        .from('provenance_clinico')
        .select('id, target_record_id, replacement_record_id, activity_type, agent_nombre_completo, recorded_at, reason_text')
        .eq('target_table', 'respuestas_formularios')
        .in('target_record_id', respuestaIds)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ProvenanceLite[];
    },
    enabled: respuestaIds.length > 0,
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

  const provenanceByRespuesta = useMemo(() => {
    const map: Record<string, ProvenanceLite[]> = {};
    provenanceList.forEach(p => {
      if (!map[p.target_record_id]) map[p.target_record_id] = [];
      map[p.target_record_id].push(p);
    });
    return map;
  }, [provenanceList]);

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

  // ── Helpers para construir editableFields del DiffHighlightForm ──
  const buildEditableFields = (respuesta: RespuestaFormulario): DiffEditableField[] => {
    const preguntas = (respuesta.formularios?.preguntas as any[] | undefined) ?? [];
    return preguntas
      .filter((q: any) => q && q.id && q.type !== 'section')
      .map((q: any) => {
        let type: DiffEditableField['type'] = 'text';
        if (q.type === 'paragraph' || q.type === 'textarea') type = 'textarea';
        else if (q.type === 'number') type = 'number';
        else if (q.type === 'date') type = 'date';
        return {
          key: q.id,
          label: q.title || q.id,
          type,
        };
      });
  };

  const handleCorrectionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['registros-paciente', patientId] });
    queryClient.invalidateQueries({ queryKey: ['provenance-respuestas', patientId] });
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

  const printFolio = async (respuesta: RespuestaFormulario, admision: Admision | null) => {
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Permite las ventanas emergentes para imprimir.');
      return;
    }
    // Write a lightweight loading state. We'll replace the body content (not the whole document)
    // once the HTML is ready, to avoid re-firing the load event and triggering print twice.
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Generando…</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#6b7280}</style>
      </head><body>Generando documento…</body></html>`);
    w.document.close();

    const preguntas = (respuesta.formularios?.preguntas as any[]) || [];
    const respData = (respuesta.datos_respuesta as Record<string, any>) || {};

    const { buildFormsFullHtml } = await import('@/utils/forms/form-document');
    const subtitle = admision
      ? `Ingreso #${admision.numero_ingreso || '—'} · ${format(new Date(admision.fecha_inicio), "dd/MM/yyyy HH:mm")}`
      : 'Registro sin ingreso vinculado';

    const html = await buildFormsFullHtml(
      {
        forms: [{
          id: respuesta.id,
          title: respuesta.formularios?.titulo || 'Registro clínico',
          description: `${subtitle} · Registrado el ${format(new Date(respuesta.created_at), "dd/MM/yyyy HH:mm")}`,
          questions: preguntas,
          formData: respData,
        }],
        patientId,
        doctorId: respuesta.medico_id,
        doctorFallbackName: admision?.profesional_nombre || '',
        institution: headerConfig,
      },
      respuesta.formularios?.titulo || 'Registro clínico',
    );

    // Replace document content in-place (single load lifecycle) and trigger print once.
    if (w.closed) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    const triggerPrint = () => setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 400);
    if (w.document.readyState === 'complete') {
      triggerPrint();
    } else {
      w.addEventListener('load', triggerPrint, { once: true });
    }
  };

  const printAll = async () => {
    const rowsToPrint = flatRows;
    if (rowsToPrint.length === 0) {
      toast.info('No hay registros para imprimir.');
      return;
    }
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Permite las ventanas emergentes para imprimir.');
      return;
    }
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Generando…</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#6b7280}</style>
      </head><body>Generando ${rowsToPrint.length} documento(s)…</body></html>`);
    w.document.close();

    const { buildFormsFullHtml } = await import('@/utils/forms/form-document');
    const html = await buildFormsFullHtml(
      {
        forms: rowsToPrint.map(r => {
          const preguntas = (r.folio.formularios?.preguntas as any[]) || [];
          const respData = (r.folio.datos_respuesta as Record<string, any>) || {};
          const subtitle = r.admision
            ? `Ingreso #${r.admision.numero_ingreso || '—'} · ${format(new Date(r.admision.fecha_inicio), "dd/MM/yyyy HH:mm")}`
            : 'Registro sin ingreso vinculado';
          return {
            id: r.folio.id,
            title: r.folio.formularios?.titulo || 'Registro clínico',
            description: `${subtitle} · Registrado el ${format(new Date(r.folio.created_at), "dd/MM/yyyy HH:mm")}`,
            questions: preguntas,
            formData: respData,
          };
        }),
        patientId,
        institution: headerConfig,
      },
      `Histórico clínico — ${rowsToPrint.length} documento(s)`,
    );

    if (w.closed) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    const triggerPrint = () => setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 400);
    if (w.document.readyState === 'complete') {
      triggerPrint();
    } else {
      w.addEventListener('load', triggerPrint, { once: true });
    }
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
                    hasCorrections={(provenanceByRespuesta[row.folio.id] || []).length > 0}
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
                provenance={provenanceByRespuesta[selectedRow.folio.id] || []}
                canCorrect={canCorrect}
                headerConfig={headerConfig}
                onPrint={() => printFolio(selectedRow.folio, selectedRow.admision)}
                onShowHistorial={() => setHistorialTarget(selectedRow.folio)}
                onCorrectionSuccess={handleCorrectionSuccess}
                buildEditableFields={buildEditableFields}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Selecciona un registro
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historial de correcciones FHIR Provenance */}
      {historialTarget && (
        <HistorialCorreccionesDialog
          open={!!historialTarget}
          onOpenChange={(open) => { if (!open) setHistorialTarget(null); }}
          targetTable="respuestas_formularios"
          targetRecordId={historialTarget.id}
          recordLabel={historialTarget.formularios?.titulo || 'Registro clínico'}
        />
      )}
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
  provenance: ProvenanceLite[];
  canCorrect: boolean;
  headerConfig?: any;
  onPrint: () => void;
  onShowHistorial: () => void;
  onCorrectionSuccess: () => void;
  buildEditableFields: (r: RespuestaFormulario) => DiffEditableField[];
}

const ESTADO_BADGE: Record<EstadoRegistro, { label: string; cls: string }> = {
  active: { label: '', cls: '' },
  'entered-in-error': {
    label: 'Anulado',
    cls: 'border-amber-400/50 text-amber-700 dark:text-amber-400',
  },
  superseded: {
    label: 'Reemplazado',
    cls: 'border-blue-400/50 text-blue-700 dark:text-blue-400',
  },
};

const DetailPanel: React.FC<DetailPanelProps> = ({
  row, provenance, canCorrect, headerConfig, onPrint, onShowHistorial,
  onCorrectionSuccess, buildEditableFields,
}) => {
  const { folio, admision, admisionLabel } = row;
  const estado = (folio.estado_registro ?? 'active') as EstadoRegistro;
  const isActive = estado === 'active';
  const hasProvenance = provenance.length > 0;
  const estadoBadge = ESTADO_BADGE[estado];

  // Construir previewData para el CorrectionDialog
  const previewData = useMemo(() => {
    const items: { label: string; value: string }[] = [
      { label: 'Formulario', value: folio.formularios?.titulo || 'Registro' },
      { label: 'Profesional', value: admision?.profesional_nombre || '—' },
      { label: 'Fecha', value: format(new Date(folio.created_at), "dd/MM/yyyy HH:mm") },
      { label: 'Ingreso', value: admisionLabel },
    ];
    if (admision?.diagnostico_principal) {
      items.push({ label: 'Dx', value: admision.diagnostico_principal });
    }
    return items;
  }, [folio, admision, admisionLabel]);

  const editableFields = useMemo(() => buildEditableFields(folio), [folio, buildEditableFields]);
  const originalData = (folio.datos_respuesta as Record<string, unknown>) ?? {};

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Detail header */}
      <div className="px-4 py-3 border-b border-border/60 bg-muted/20 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <h3 className={cn(
                "text-sm font-semibold text-foreground truncate",
                !isActive && "line-through opacity-60"
              )}>
                {folio.formularios?.titulo || 'Registro'}
              </h3>
              {estadoBadge.label && (
                <Badge
                  variant="outline"
                  className={cn("h-5 text-[10px] px-1.5 font-normal", estadoBadge.cls)}
                >
                  {estadoBadge.label}
                </Badge>
              )}
              {hasProvenance && isActive && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 border-amber-400/50 text-amber-700 dark:text-amber-400 font-normal">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {provenance.length} {provenance.length === 1 ? 'corrección' : 'correcciones'}
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
            {hasProvenance && (
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onShowHistorial}>
                <History className="w-3 h-3" />
                Historial
              </Button>
            )}
            {canCorrect && isActive && (
              <CorrectionTriggerButton
                targetTable="respuestas_formularios"
                targetRecordId={folio.id}
                recordCreatedAt={folio.created_at}
                recordEstadoRegistro={estado}
                previewData={previewData}
                renderReplacementForm={
                  editableFields.length > 0
                    ? (onChange) => (
                        <DiffHighlightForm
                          originalData={originalData}
                          editableFields={editableFields}
                          onChange={onChange}
                        />
                      )
                    : undefined
                }
                onSuccess={onCorrectionSuccess}
                variant="full"
                className="h-7 text-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail body */}
      <ScrollArea className="flex-1">
        <div className={cn("p-4", !isActive && "opacity-60")}>
          <ReadOnlyFormView
            questions={folio.formularios?.preguntas || []}
            data={folio.datos_respuesta}
            headerConfig={headerConfig}
            formTitle={folio.formularios?.titulo || 'Registro'}
          />

          {hasProvenance && (
            <div className="mt-4 space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Audit trail (FHIR Provenance)
              </h4>
              {provenance.map(p => {
                const tipoLabel = p.activity_type === 'entered-in-error'
                  ? 'Anulación'
                  : p.activity_type === 'correction'
                  ? 'Corrección'
                  : 'Enmienda';
                return (
                  <div
                    key={p.id}
                    className="bg-amber-50/50 dark:bg-amber-950/20 border-l-2 border-amber-400 p-3 rounded-r text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      <span>{tipoLabel}</span>
                      <span className="text-muted-foreground font-normal">
                        — {format(new Date(p.recorded_at), "dd/MM/yyyy HH:mm")} por {p.agent_nombre_completo}
                      </span>
                    </div>
                    <p className="italic text-foreground/80">"{p.reason_text}"</p>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={onShowHistorial}
                className="text-[11px] text-primary hover:underline"
              >
                Ver historial completo →
              </button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RegistroAtenciones;
