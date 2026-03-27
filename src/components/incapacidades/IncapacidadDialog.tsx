import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInCalendarDays, parseISO, addDays } from "date-fns";
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
  FileText,
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
  fecha_fin: z.date({ required_error: "Fecha fin requerida" }),
  tipo: z.string().min(1, "Seleccione un tipo"),
  diagnostico_descripcion: z.string().optional(),
  diagnostico_codigo: z.string().optional(),
  observaciones: z.string().optional(),
}).refine(data => data.fecha_fin >= data.fecha_inicio, {
  message: "La fecha fin debe ser posterior o igual a la fecha inicio",
  path: ["fecha_fin"],
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
  { value: "general", label: "General", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "laboral", label: "Laboral", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "maternidad", label: "Maternidad", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: "paternidad", label: "Paternidad", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { value: "accidente", label: "Accidente", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
];

const ESTADO_BADGE: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  activa: { label: "Activa", icon: CheckCircle, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  anulada: { label: "Anulada", icon: XCircle, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
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

  // Reset view when dialog opens
  useEffect(() => {
    if (open) setView("list");
  }, [open]);

  // Fetch profile for medico_nombre
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

  // Fetch incapacidades for patient
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
      fecha_fin: addDays(new Date(), 2),
      tipo: "general",
      diagnostico_descripcion: "",
      diagnostico_codigo: "",
      observaciones: "",
    },
  });

  const watchStart = form.watch("fecha_inicio");
  const watchEnd = form.watch("fecha_fin");

  const calculatedDays = useMemo(() => {
    if (!watchStart || !watchEnd) return 0;
    const diff = differenceInCalendarDays(watchEnd, watchStart) + 1;
    return diff > 0 ? diff : 0;
  }, [watchStart, watchEnd]);

  const handleCreate = async (values: IncapacidadFormValues) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("incapacidades").insert({
        paciente_id: pacienteId,
        admision_id: admisionId || null,
        medico_id: user.id,
        medico_nombre: profile?.full_name || "Médico",
        fecha_inicio: format(values.fecha_inicio, "yyyy-MM-dd"),
        fecha_fin: format(values.fecha_fin, "yyyy-MM-dd"),
        tipo: values.tipo,
        diagnostico_codigo: values.diagnostico_codigo || null,
        diagnostico_descripcion: values.diagnostico_descripcion || null,
        observaciones: values.observaciones || null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["incapacidades", pacienteId] });
      toast.success(`Incapacidad creada: ${calculatedDays} día(s) — ${TIPO_OPTIONS.find(t => t.value === values.tipo)?.label}`);
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setView("list")}
              >
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
                    form.reset({
                      fecha_inicio: new Date(),
                      fecha_fin: addDays(new Date(), 2),
                      tipo: "general",
                      diagnostico_descripcion: "",
                      diagnostico_codigo: "",
                      observaciones: "",
                    });
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
            <p className="text-xs text-muted-foreground mt-1 pl-0">
              Paciente: <span className="font-medium text-foreground">{pacienteNombre}</span>
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* LIST VIEW */}
            {view === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
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
                        const tipoInfo = TIPO_OPTIONS.find(t => t.value === inc.tipo);
                        const estadoInfo = ESTADO_BADGE[inc.estado] || ESTADO_BADGE.activa;
                        const EstadoIcon = estadoInfo.icon;
                        return (
                          <button
                            key={inc.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(inc.id);
                              setView("detail");
                            }}
                            className="w-full text-left p-4 rounded-xl border hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={cn("text-[10px] font-medium", tipoInfo?.color)}>
                                    {tipoInfo?.label || inc.tipo}
                                  </Badge>
                                  <Badge variant="outline" className={cn("text-[10px] font-medium gap-1", estadoInfo.className)}>
                                    <EstadoIcon className="w-3 h-3" />
                                    {estadoInfo.label}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mt-1.5">
                                  {format(parseISO(inc.fecha_inicio), "dd MMM yyyy", { locale: es })} — {format(parseISO(inc.fecha_fin), "dd MMM yyyy", { locale: es })}
                                </p>
                                {inc.diagnostico_descripcion && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{inc.diagnostico_descripcion}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-lg font-bold text-primary">{inc.dias}</span>
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
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <ScrollArea className="h-[60vh] px-6 py-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-5">
                      {/* Days counter */}
                      <div className="flex items-center justify-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="text-center">
                          <span className="text-4xl font-bold text-primary">{calculatedDays}</span>
                          <p className="text-sm text-muted-foreground mt-0.5">día(s) de incapacidad</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Fecha inicio */}
                        <FormField
                          control={form.control}
                          name="fecha_inicio"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha inicio</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value
                                        ? format(field.value, "dd/MM/yyyy", { locale: es })
                                        : "Seleccionar"}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Fecha fin */}
                        <FormField
                          control={form.control}
                          name="fecha_fin"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha fin</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value
                                        ? format(field.value, "dd/MM/yyyy", { locale: es })
                                        : "Seleccionar"}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < (watchStart || new Date())}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Tipo */}
                      <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de incapacidad</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
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

                      <Separator />

                      {/* Diagnóstico */}
                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="diagnostico_codigo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código CIE</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: M54.5" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="diagnostico_descripcion"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Diagnóstico</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Descripción del diagnóstico" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Observaciones */}
                      <FormField
                        control={form.control}
                        name="observaciones"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observaciones</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Recomendaciones o notas adicionales..."
                                rows={3}
                              />
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
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <ScrollArea className="h-[60vh] px-6 py-4">
                  <div className="space-y-5">
                    {/* Days display */}
                    <div className="flex items-center justify-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="text-center">
                        <span className="text-4xl font-bold text-primary">{selectedIncapacidad.dias}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">día(s) de incapacidad</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const tipoInfo = TIPO_OPTIONS.find(t => t.value === selectedIncapacidad.tipo);
                        return (
                          <Badge variant="outline" className={cn("font-medium", tipoInfo?.color)}>
                            {tipoInfo?.label || selectedIncapacidad.tipo}
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
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <DetailField label="Fecha inicio" value={format(parseISO(selectedIncapacidad.fecha_inicio), "dd/MM/yyyy", { locale: es })} />
                      <DetailField label="Fecha fin" value={format(parseISO(selectedIncapacidad.fecha_fin), "dd/MM/yyyy", { locale: es })} />
                      {selectedIncapacidad.diagnostico_codigo && (
                        <DetailField label="Código CIE" value={selectedIncapacidad.diagnostico_codigo} />
                      )}
                      {selectedIncapacidad.diagnostico_descripcion && (
                        <DetailField label="Diagnóstico" value={selectedIncapacidad.diagnostico_descripcion} className="col-span-2" />
                      )}
                      <DetailField label="Médico" value={`Dr(a). ${selectedIncapacidad.medico_nombre}`} />
                      <DetailField label="Creada" value={format(parseISO(selectedIncapacidad.created_at), "dd/MM/yyyy HH:mm")} />
                    </div>

                    {selectedIncapacidad.observaciones && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Observaciones</p>
                        <p className="text-sm bg-muted/30 rounded-lg p-3 border">{selectedIncapacidad.observaciones}</p>
                      </div>
                    )}

                    {/* Anular action */}
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
