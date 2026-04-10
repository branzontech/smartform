import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  Plus,
  ArrowLeft,
  Save,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const incapacidadSchema = z.object({
  fecha_inicio: z.date({ required_error: "Fecha inicio requerida" }),
  duracion_dias: z.number().min(1, "Mínimo 1 día"),
  tipo_incapacidad: z.string().min(1, "Seleccione un tipo"),
  grupo_servicios: z.string().min(1, "Seleccione grupo de servicios"),
  modalidad_prestacion: z.string().min(1, "Seleccione modalidad"),
  presunto_origen: z.string().min(1, "Seleccione origen"),
  diagnostico_principal: z.string().min(1, "Diagnóstico requerido"),
  observaciones: z.string().optional(),
});

type IncapacidadFormValues = z.infer<typeof incapacidadSchema>;

interface IncapacidadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  admisionId?: string | null;
  pacienteNombre?: string;
}

const TIPO_OPTIONS = [
  { value: "enfermedad_general", label: "Enfermedad General", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "accidente_trabajo", label: "Accidente de Trabajo", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  { value: "enfermedad_laboral", label: "Enfermedad Laboral", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "licencia_maternidad", label: "Licencia Maternidad", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: "licencia_paternidad", label: "Licencia Paternidad", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
];

const GRUPO_SERVICIOS_OPTIONS = [
  { value: "consulta_externa", label: "Consulta Externa" },
  { value: "urgencias", label: "Urgencias" },
  { value: "hospitalizacion", label: "Hospitalización" },
  { value: "cirugia", label: "Cirugía" },
];

const MODALIDAD_OPTIONS = [
  { value: "presencial", label: "Presencial" },
  { value: "extramural_domiciliaria", label: "Extramural Domiciliaria" },
  { value: "telemedicina_interactiva", label: "Telemedicina Interactiva" },
  { value: "telemedicina_no_interactiva", label: "Telemedicina No Interactiva" },
  { value: "telemedicina_telexperticia", label: "Telexperticia" },
  { value: "telemedicina_telemonitoreo", label: "Telemonitoreo" },
];

const ORIGEN_OPTIONS = [
  { value: "comun", label: "Común" },
  { value: "laboral", label: "Laboral" },
];

const ESTADO_BADGE: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  activa: { label: "Activa", icon: CheckCircle, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  anulada: { label: "Anulada", icon: XCircle, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  cerrada: { label: "Cerrada", icon: AlertCircle, className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" },
};

type View = "list" | "create" | "detail";

export const IncapacidadDialog: React.FC<IncapacidadDialogProps> = ({
  open,
  onOpenChange,
  pacienteId,
  admisionId,
  pacienteNombre,
}) => {
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (open) setView("list");
  }, [open]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: incapacidades = [], isLoading } = useQuery({
    queryKey: ["incapacidades", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incapacidades")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!pacienteId,
  });

  const selectedIncapacidad = useMemo(
    () => incapacidades.find((i: any) => i.id === selectedId),
    [incapacidades, selectedId]
  );

  const form = useForm<IncapacidadFormValues>({
    resolver: zodResolver(incapacidadSchema),
    defaultValues: {
      fecha_inicio: new Date(),
      duracion_dias: 3,
      tipo_incapacidad: "enfermedad_general",
      grupo_servicios: "consulta_externa",
      modalidad_prestacion: "presencial",
      presunto_origen: "comun",
      diagnostico_principal: "",
      observaciones: "",
    },
  });

  const watchStart = form.watch("fecha_inicio");
  const watchDays = form.watch("duracion_dias");

  const calculatedEnd = useMemo(() => {
    if (!watchStart || !watchDays || watchDays < 1) return null;
    return addDays(watchStart, watchDays);
  }, [watchStart, watchDays]);

  const handleCreate = async (values: IncapacidadFormValues) => {
    if (!user?.id || !admisionId) {
      toast.error("Se requiere una admisión activa para crear incapacidades");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("incapacidades").insert({
        paciente_id: pacienteId,
        admision_id: admisionId,
        medico_id: user.id,
        medico_nombre: profile?.full_name || "Médico",
        fecha_inicio: format(values.fecha_inicio, "yyyy-MM-dd"),
        duracion_dias: values.duracion_dias,
        tipo_incapacidad: values.tipo_incapacidad,
        grupo_servicios: values.grupo_servicios,
        modalidad_prestacion: values.modalidad_prestacion,
        presunto_origen: values.presunto_origen,
        diagnostico_principal: values.diagnostico_principal,
        observaciones: values.observaciones || null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["incapacidades", pacienteId] });
      const tipoLabel = TIPO_OPTIONS.find(t => t.value === values.tipo_incapacidad)?.label;
      toast.success(`Incapacidad creada: ${values.duracion_dias} día(s) — ${tipoLabel}`);
      form.reset();
      setView("list");
    } catch (err: any) {
      toast.error(err.message || "Error al crear incapacidad");
    } finally {
      setSaving(false);
    }
  };

  const handleAnular = async (id: string) => {
    try {
      const { error } = await supabase
        .from("incapacidades")
        .update({ estado: "anulada" })
        .eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["incapacidades", pacienteId] });
      toast.success("Incapacidad anulada");
      setView("list");
    } catch (err: any) {
      toast.error(err.message || "Error al anular");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <div className="flex items-center gap-3">
            {view !== "list" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setView("list")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              {view === "list" && "Incapacidades"}
              {view === "create" && "Nueva incapacidad"}
              {view === "detail" && "Detalle de incapacidad"}
            </DialogTitle>
            {view === "list" && (
              <div className="ml-auto">
                <Button
                  size="sm"
                  className="rounded-xl gap-1.5 h-8"
                  onClick={() => {
                    form.reset();
                    setView("create");
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva
                </Button>
              </div>
            )}
          </div>
          {pacienteNombre && (
            <p className="text-xs text-muted-foreground mt-1">
              Paciente: <span className="font-medium text-foreground">{pacienteNombre}</span>
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* LIST VIEW */}
            {view === "list" && (
              <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="h-full">
                <ScrollArea className="h-[60vh] px-6 py-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : incapacidades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No hay incapacidades registradas</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Crea una nueva incapacidad para este paciente</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {incapacidades.map((inc: any) => {
                        const tipoInfo = TIPO_OPTIONS.find(t => t.value === inc.tipo_incapacidad);
                        const estadoInfo = ESTADO_BADGE[inc.estado] || ESTADO_BADGE.activa;
                        const EstadoIcon = estadoInfo.icon;
                        return (
                          <button
                            key={inc.id}
                            type="button"
                            onClick={() => { setSelectedId(inc.id); setView("detail"); }}
                            className="w-full text-left p-4 rounded-xl border hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={cn("text-[10px] font-medium", tipoInfo?.color)}>
                                    {tipoInfo?.label || inc.tipo_incapacidad}
                                  </Badge>
                                  <Badge variant="outline" className={cn("text-[10px] font-medium gap-1", estadoInfo.className)}>
                                    <EstadoIcon className="w-3 h-3" />
                                    {estadoInfo.label}
                                  </Badge>
                                  {inc.numero_incapacidad && (
                                    <span className="text-[10px] text-muted-foreground font-mono">#{inc.numero_incapacidad}</span>
                                  )}
                                </div>
                                <p className="text-sm font-medium mt-1.5">
                                  {format(parseISO(inc.fecha_inicio), "dd MMM yyyy", { locale: es })} — {inc.fecha_fin ? format(parseISO(inc.fecha_fin), "dd MMM yyyy", { locale: es }) : ""}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{inc.diagnostico_principal}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-lg font-bold text-primary">{inc.duracion_dias}</span>
                                <p className="text-[10px] text-muted-foreground">día(s)</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Dr(a). {inc.medico_nombre}</span>
                              <span>·</span>
                              <span>{format(parseISO(inc.created_at), "dd/MM/yyyy HH:mm")}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}

            {/* CREATE VIEW */}
            {view === "create" && (
              <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
                <ScrollArea className="h-[60vh] px-6 py-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-5">
                      {/* Days counter */}
                      <div className="flex items-center justify-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="text-center">
                          <span className="text-4xl font-bold text-primary">{watchDays || 0}</span>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            día(s) de incapacidad
                            {calculatedEnd && (
                              <span className="block text-xs">Hasta {format(calculatedEnd, "dd MMM yyyy", { locale: es })}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fecha_inicio"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha inicio</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                      {field.value ? format(field.value, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="duracion_dias"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duración (días)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tipo_incapacidad"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de incapacidad</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIPO_OPTIONS.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presunto_origen"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Presunto origen</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ORIGEN_OPTIONS.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="grupo_servicios"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grupo de servicios</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {GRUPO_SERVICIOS_OPTIONS.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="modalidad_prestacion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modalidad de prestación</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {MODALIDAD_OPTIONS.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <FormField
                        control={form.control}
                        name="diagnostico_principal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diagnóstico principal</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Código CIE o descripción del diagnóstico" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="observaciones"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observaciones</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Recomendaciones o notas adicionales..." rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={saving} className="gap-1.5 rounded-xl">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Crear incapacidad
                        </Button>
                      </div>
                    </form>
                  </Form>
                </ScrollArea>
              </motion.div>
            )}

            {/* DETAIL VIEW */}
            {view === "detail" && selectedIncapacidad && (
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
                <ScrollArea className="h-[60vh] px-6 py-4">
                  <div className="space-y-5">
                    <div className="flex items-center justify-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="text-center">
                        <span className="text-4xl font-bold text-primary">{selectedIncapacidad.duracion_dias}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">día(s) de incapacidad</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const tipoInfo = TIPO_OPTIONS.find(t => t.value === selectedIncapacidad.tipo_incapacidad);
                        return (
                          <Badge variant="outline" className={cn("font-medium", tipoInfo?.color)}>
                            {tipoInfo?.label || selectedIncapacidad.tipo_incapacidad}
                          </Badge>
                        );
                      })()}
                      {(() => {
                        const estadoInfo = ESTADO_BADGE[selectedIncapacidad.estado] || ESTADO_BADGE.activa;
                        const EstadoIcon = estadoInfo.icon;
                        return (
                          <Badge variant="outline" className={cn("font-medium gap-1", estadoInfo.className)}>
                            <EstadoIcon className="w-3 h-3" />
                            {estadoInfo.label}
                          </Badge>
                        );
                      })()}
                      {selectedIncapacidad.numero_incapacidad && (
                        <span className="text-xs text-muted-foreground font-mono">#{selectedIncapacidad.numero_incapacidad}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <DetailField label="Fecha inicio" value={format(parseISO(selectedIncapacidad.fecha_inicio), "dd/MM/yyyy", { locale: es })} />
                      <DetailField label="Fecha fin" value={selectedIncapacidad.fecha_fin ? format(parseISO(selectedIncapacidad.fecha_fin), "dd/MM/yyyy", { locale: es }) : "—"} />
                      <DetailField label="Diagnóstico principal" value={selectedIncapacidad.diagnostico_principal} className="col-span-2" />
                      <DetailField label="Presunto origen" value={ORIGEN_OPTIONS.find(o => o.value === selectedIncapacidad.presunto_origen)?.label || selectedIncapacidad.presunto_origen} />
                      <DetailField label="Grupo de servicios" value={GRUPO_SERVICIOS_OPTIONS.find(g => g.value === selectedIncapacidad.grupo_servicios)?.label || selectedIncapacidad.grupo_servicios} />
                      <DetailField label="Modalidad" value={MODALIDAD_OPTIONS.find(m => m.value === selectedIncapacidad.modalidad_prestacion)?.label || selectedIncapacidad.modalidad_prestacion} />
                      <DetailField label="Médico" value={`Dr(a). ${selectedIncapacidad.medico_nombre}`} />
                      <DetailField label="Creada" value={format(parseISO(selectedIncapacidad.created_at), "dd/MM/yyyy HH:mm")} />
                    </div>

                    {selectedIncapacidad.observaciones && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Observaciones</p>
                        <p className="text-sm bg-muted/30 rounded-lg p-3 border">{selectedIncapacidad.observaciones}</p>
                      </div>
                    )}

                    {selectedIncapacidad.estado === "activa" && (
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-xl gap-1.5"
                          onClick={() => handleAnular(selectedIncapacidad.id)}
                        >
                          <XCircle className="w-4 h-4" />
                          Anular incapacidad
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DetailField: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
  <div className={className}>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="text-sm font-medium mt-0.5">{value}</p>
  </div>
);

export default IncapacidadDialog;
