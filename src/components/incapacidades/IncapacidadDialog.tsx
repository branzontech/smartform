import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon, Save, Loader2, CalendarDays, Search, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateIncapacidad, useIncapacidadesByAdmision } from "@/hooks/useIncapacidades";
import type { IncapacidadFormData } from "@/types/incapacidades";

/* ─── Schema ─── */
const schema = z.object({
  fecha_inicio: z.date({ required_error: "Requerido" }),
  duracion_dias: z.number().min(1, "Mínimo 1 día"),
  prorroga_tipo: z.enum(["no_prorrogable", "prorrogable"]),
  incapacidad_origen_id: z.string().nullable().optional(),
  tipo_incapacidad: z.enum([
    "enfermedad_general", "accidente_trabajo", "enfermedad_laboral",
    "licencia_maternidad", "licencia_paternidad",
  ]),
  grupo_servicios: z.enum(["consulta_externa", "urgencias", "hospitalizacion", "cirugia"]),
  modalidad_prestacion: z.enum([
    "presencial", "extramural_domiciliaria", "telemedicina_interactiva",
    "telemedicina_no_interactiva", "telemedicina_telexperticia", "telemedicina_telemonitoreo",
  ]),
  presunto_origen: z.enum(["comun", "laboral"]),
  diagnostico_principal: z.string().min(1, "Requerido"),
  diagnostico_rel_1: z.string().nullable().optional(),
  diagnostico_rel_2: z.string().nullable().optional(),
  diagnostico_rel_3: z.string().nullable().optional(),
  es_retroactiva: z.boolean(),
  causa_retroactividad: z.enum([
    "no_aplica", "urgencia_internacion",
    "trastorno_psiquico_funcional", "evento_catastrofico_terrorista",
  ]).nullable().optional(),
  causa_atencion: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

/* ─── Options ─── */
const TIPO_INC = [
  { v: "enfermedad_general", l: "Enfermedad General" },
  { v: "accidente_trabajo", l: "Accidente de Trabajo" },
  { v: "enfermedad_laboral", l: "Enfermedad Laboral" },
  { v: "licencia_maternidad", l: "Licencia Maternidad" },
  { v: "licencia_paternidad", l: "Licencia Paternidad" },
];
const GRUPO_SVC = [
  { v: "consulta_externa", l: "Consulta Externa" },
  { v: "urgencias", l: "Urgencias" },
  { v: "hospitalizacion", l: "Hospitalización" },
  { v: "cirugia", l: "Cirugía" },
];
const MODALIDAD = [
  { v: "presencial", l: "Presencial" },
  { v: "extramural_domiciliaria", l: "Extramural Domiciliaria" },
  { v: "telemedicina_interactiva", l: "Telemedicina Interactiva" },
  { v: "telemedicina_no_interactiva", l: "Telemedicina No Interactiva" },
  { v: "telemedicina_telexperticia", l: "Telexperticia" },
  { v: "telemedicina_telemonitoreo", l: "Telemonitoreo" },
];
const ORIGEN = [
  { v: "comun", l: "Común" },
  { v: "laboral", l: "Laboral" },
];
const CAUSA_RETRO = [
  { v: "no_aplica", l: "No Aplica" },
  { v: "urgencia_internacion", l: "Urgencia por internación del paciente" },
  { v: "trastorno_psiquico_funcional", l: "Trastorno de memoria, confusión mental, desorientación…" },
  { v: "evento_catastrofico_terrorista", l: "Evento catastrófico y terrorista" },
];
const PRORROGA = [
  { v: "no_prorrogable", l: "No Prorrogable" },
  { v: "prorrogable", l: "Prorrogable" },
];

/* ─── Props ─── */
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admisionId: string;
  pacienteId: string;
  medicoNombre: string;
  medicoId: string;
  onSuccess?: () => void;
}

/* ─── Minimal select ─── */
const MSelect: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  options: { v: string; l: string }[]; error?: string;
}> = ({ label, value, onChange, options, error }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent border-0 border-b border-border/60 focus:border-primary text-sm py-1.5 px-0 outline-none transition-colors appearance-none cursor-pointer"
    >
      <option value="">Seleccionar…</option>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
    {error && <p className="text-[10px] text-destructive">{error}</p>}
  </div>
);

/* ─── CIE-10 Search ─── */
const DiagnosticoSearch: React.FC<{
  label: string; value: string | null | undefined;
  onChange: (v: string | null) => void; required?: boolean; error?: string;
}> = ({ label, value, onChange, required, error }) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [] } = useQuery({
    queryKey: ["catalogo_diagnosticos", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const { data } = await supabase
        .from("catalogo_diagnosticos")
        .select("codigo, descripcion")
        .eq("activo", true)
        .or(`codigo.ilike.%${debouncedQuery}%,descripcion.ilike.%${debouncedQuery}%`)
        .limit(8);
      return data || [];
    },
    enabled: debouncedQuery.length >= 2,
  });

  if (value) {
    return (
      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-1.5">
          <Badge variant="outline" className="text-[10px] font-mono shrink-0">{value.split(" — ")[0]}</Badge>
          <span className="text-xs truncate flex-1">{value.split(" — ").slice(1).join(" — ")}</span>
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 relative">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex items-center gap-1.5 border-b border-border/60 focus-within:border-primary transition-colors">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Buscar código o descripción…"
          className="w-full bg-transparent text-sm py-1.5 outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
      {focused && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((r: any) => (
            <button
              key={r.codigo}
              type="button"
              onMouseDown={() => {
                onChange(`${r.codigo} — ${r.descripcion}`);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2 text-xs border-b last:border-0"
            >
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">{r.codigo}</Badge>
              <span className="truncate">{r.descripcion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
export const IncapacidadDialog: React.FC<Props> = ({
  open, onOpenChange, admisionId, pacienteId, medicoNombre, medicoId, onSuccess,
}) => {
  const createMutation = useCreateIncapacidad();

  // Previous incapacidades for prorroga linking
  const { data: prevIncapacidades = [] } = useIncapacidadesByAdmision(admisionId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha_inicio: new Date(),
      duracion_dias: 3,
      prorroga_tipo: "no_prorrogable",
      incapacidad_origen_id: null,
      tipo_incapacidad: "enfermedad_general",
      grupo_servicios: "consulta_externa",
      modalidad_prestacion: "presencial",
      presunto_origen: "comun",
      diagnostico_principal: "",
      diagnostico_rel_1: null,
      diagnostico_rel_2: null,
      diagnostico_rel_3: null,
      es_retroactiva: false,
      causa_retroactividad: null,
      causa_atencion: null,
    },
  });

  const watchStart = form.watch("fecha_inicio");
  const watchDays = form.watch("duracion_dias");
  const watchProrroga = form.watch("prorroga_tipo");
  const watchRetro = form.watch("es_retroactiva");

  const fechaFin = useMemo(() => {
    if (!watchStart || !watchDays || watchDays < 1) return null;
    return addDays(watchStart, watchDays);
  }, [watchStart, watchDays]);

  const handleSubmit = useCallback(async (values: FormValues) => {
    const payload: IncapacidadFormData = {
      admision_id: admisionId,
      paciente_id: pacienteId,
      medico_id: medicoId,
      medico_nombre: medicoNombre,
      fecha_inicio: format(values.fecha_inicio, "yyyy-MM-dd"),
      duracion_dias: values.duracion_dias,
      es_prorroga: values.prorroga_tipo === "prorrogable",
      prorroga_tipo: values.prorroga_tipo,
      incapacidad_origen_id: values.incapacidad_origen_id || null,
      tipo_incapacidad: values.tipo_incapacidad,
      grupo_servicios: values.grupo_servicios,
      modalidad_prestacion: values.modalidad_prestacion,
      presunto_origen: values.presunto_origen,
      diagnostico_principal: values.diagnostico_principal,
      diagnostico_rel_1: values.diagnostico_rel_1 || null,
      diagnostico_rel_2: values.diagnostico_rel_2 || null,
      diagnostico_rel_3: values.diagnostico_rel_3 || null,
      es_retroactiva: values.es_retroactiva,
      causa_retroactividad: values.es_retroactiva ? (values.causa_retroactividad || null) : null,
      causa_atencion: values.causa_atencion || null,
      observaciones: null,
      estado: "activa",
      fhir_extensions: {},
      datos_regulatorios: {},
    };

    try {
      await createMutation.mutateAsync(payload);
      const tipoLabel = TIPO_INC.find(t => t.v === values.tipo_incapacidad)?.l;
      toast.success(`Incapacidad creada: ${values.duracion_dias} día(s) — ${tipoLabel}`);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Error al crear incapacidad");
    }
  }, [admisionId, pacienteId, medicoId, medicoNombre, createMutation, form, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden" aria-describedby={undefined}>
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-dashed">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="w-5 h-5 text-primary" />
            Registrar Incapacidad Médica
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Profesional: <span className="font-medium text-foreground">{medicoNombre}</span>
          </p>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: "calc(90vh - 130px)" }}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="px-6 py-5 space-y-6">
            {/* Days counter */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="text-center flex-1">
                <span className="text-3xl font-bold text-primary">{watchDays || 0}</span>
                <p className="text-[11px] text-muted-foreground">día(s)</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center flex-1">
                <p className="text-sm font-medium">
                  {watchStart ? format(watchStart, "dd MMM", { locale: es }) : "—"}
                  {" → "}
                  {fechaFin ? format(fechaFin, "dd MMM yyyy", { locale: es }) : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">Periodo de incapacidad</p>
              </div>
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* ─── LEFT COLUMN ─── */}
              <div className="space-y-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-dashed pb-1">Datos de la incapacidad</p>

                {/* Fecha inicio */}
                <Controller
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Fecha inicio <span className="text-destructive">*</span>
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "w-full flex items-center justify-between border-0 border-b border-border/60 focus:border-primary text-sm py-1.5 px-0 outline-none transition-colors bg-transparent",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                            <CalendarIcon className="w-4 h-4 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      {fieldState.error && <p className="text-[10px] text-destructive">{fieldState.error.message}</p>}
                    </div>
                  )}
                />

                {/* Duración */}
                <Controller
                  control={form.control}
                  name="duracion_dias"
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Duración (días) <span className="text-destructive">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          className="w-24 bg-transparent border-0 border-b border-border/60 focus:border-primary text-sm py-1.5 px-0 outline-none transition-colors"
                        />
                        {fechaFin && (
                          <span className="text-xs text-muted-foreground">
                            Fin: <span className="font-medium text-foreground">{format(fechaFin, "dd/MM/yyyy")}</span>
                          </span>
                        )}
                      </div>
                      {fieldState.error && <p className="text-[10px] text-destructive">{fieldState.error.message}</p>}
                    </div>
                  )}
                />

                {/* Prórroga */}
                <Controller
                  control={form.control}
                  name="prorroga_tipo"
                  render={({ field }) => (
                    <MSelect label="Prórroga" value={field.value} onChange={field.onChange} options={PRORROGA} />
                  )}
                />

                {/* Incapacidad origen (if prorrogable) */}
                {watchProrroga === "prorrogable" && (
                  <Controller
                    control={form.control}
                    name="incapacidad_origen_id"
                    render={({ field }) => (
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Incapacidad de origen</label>
                        <select
                          value={field.value || ""}
                          onChange={e => field.onChange(e.target.value || null)}
                          className="w-full bg-transparent border-0 border-b border-border/60 focus:border-primary text-sm py-1.5 px-0 outline-none transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Seleccionar incapacidad previa…</option>
                          {prevIncapacidades
                            .filter((inc: any) => inc.estado === "activa" || inc.estado === "cerrada")
                            .map((inc: any) => (
                              <option key={inc.id} value={inc.id}>
                                #{inc.numero_incapacidad} — {inc.duracion_dias}d — {format(new Date(inc.fecha_inicio), "dd/MM/yy")}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  />
                )}

                {/* Tipo incapacidad */}
                <Controller
                  control={form.control}
                  name="tipo_incapacidad"
                  render={({ field, fieldState }) => (
                    <MSelect label="Tipo de incapacidad *" value={field.value} onChange={field.onChange} options={TIPO_INC} error={fieldState.error?.message} />
                  )}
                />

                {/* Grupo servicios */}
                <Controller
                  control={form.control}
                  name="grupo_servicios"
                  render={({ field, fieldState }) => (
                    <MSelect label="Grupo de servicios *" value={field.value} onChange={field.onChange} options={GRUPO_SVC} error={fieldState.error?.message} />
                  )}
                />
              </div>

              {/* ─── RIGHT COLUMN ─── */}
              <div className="space-y-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-dashed pb-1">Diagnóstico y modalidad</p>

                {/* Modalidad */}
                <Controller
                  control={form.control}
                  name="modalidad_prestacion"
                  render={({ field, fieldState }) => (
                    <MSelect label="Modalidad de prestación *" value={field.value} onChange={field.onChange} options={MODALIDAD} error={fieldState.error?.message} />
                  )}
                />

                {/* Presunto origen */}
                <Controller
                  control={form.control}
                  name="presunto_origen"
                  render={({ field, fieldState }) => (
                    <MSelect label="Presunto origen *" value={field.value} onChange={field.onChange} options={ORIGEN} error={fieldState.error?.message} />
                  )}
                />

                {/* Diagnósticos */}
                <Controller
                  control={form.control}
                  name="diagnostico_principal"
                  render={({ field, fieldState }) => (
                    <DiagnosticoSearch
                      label="Diagnóstico principal"
                      value={field.value}
                      onChange={v => field.onChange(v || "")}
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="diagnostico_rel_1"
                  render={({ field }) => (
                    <DiagnosticoSearch label="Diagnóstico relacionado 1" value={field.value} onChange={field.onChange} />
                  )}
                />
                <Controller
                  control={form.control}
                  name="diagnostico_rel_2"
                  render={({ field }) => (
                    <DiagnosticoSearch label="Diagnóstico relacionado 2" value={field.value} onChange={field.onChange} />
                  )}
                />
                <Controller
                  control={form.control}
                  name="diagnostico_rel_3"
                  render={({ field }) => (
                    <DiagnosticoSearch label="Diagnóstico relacionado 3" value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            {/* ─── FULL ROW ─── */}
            <Separator className="border-dashed" />

            <div className="space-y-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-dashed pb-1">Información adicional</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                {/* Médico readonly */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Médico</label>
                  <p className="text-sm py-1.5 border-b border-border/30 text-muted-foreground">{medicoNombre}</p>
                </div>

                {/* Retroactiva toggle */}
                <Controller
                  control={form.control}
                  name="es_retroactiva"
                  render={({ field }) => (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Incapacidad retroactiva</label>
                      <div className="flex items-center gap-3 py-1.5">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <span className="text-sm">{field.value ? "Sí" : "No"}</span>
                      </div>
                    </div>
                  )}
                />

                {/* Causa retroactividad */}
                {watchRetro && (
                  <Controller
                    control={form.control}
                    name="causa_retroactividad"
                    render={({ field }) => (
                      <MSelect
                        label="Causa de retroactividad"
                        value={field.value || ""}
                        onChange={v => field.onChange(v || null)}
                        options={CAUSA_RETRO}
                      />
                    )}
                  />
                )}
              </div>

              {/* Causa atención */}
              <Controller
                control={form.control}
                name="causa_atencion"
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Causa que motiva la atención</label>
                    <textarea
                      value={field.value || ""}
                      onChange={e => field.onChange(e.target.value || null)}
                      rows={3}
                      placeholder="Describa la causa…"
                      className="w-full bg-transparent border-0 border-b border-border/60 focus:border-primary text-sm py-1.5 px-0 outline-none transition-colors resize-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dashed">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending} className="gap-1.5 rounded-xl">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Registrar incapacidad
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default IncapacidadDialog;
