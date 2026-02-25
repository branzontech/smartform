import React, { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Field type definitions ──────────────────────────────────────────

export interface DynamicFieldConfig {
  id: string;
  label: string;
  tipo_dato: string;
  es_requerido: boolean;
  orden: number;
  opciones?: string[];
  placeholder?: string;
  maestro?: string;
  created_at?: string;
}

export const FIELD_TYPES = [
  // Básicos
  { value: "text", label: "Texto corto", group: "basic", icon: "Aa" },
  { value: "textarea", label: "Texto largo", group: "basic", icon: "¶" },
  { value: "number", label: "Número", group: "basic", icon: "#" },
  { value: "decimal", label: "Decimal", group: "basic", icon: "#.#" },
  { value: "date", label: "Fecha", group: "basic", icon: "📅" },
  { value: "time", label: "Hora", group: "basic", icon: "🕐" },
  { value: "datetime", label: "Fecha y hora", group: "basic", icon: "📆" },
  { value: "email", label: "Correo electrónico", group: "basic", icon: "@" },
  { value: "phone", label: "Teléfono", group: "basic", icon: "📞" },
  { value: "url", label: "URL / Enlace", group: "basic", icon: "🔗" },
  // Selección
  { value: "select", label: "Selección única", group: "selection", icon: "◉" },
  { value: "boolean", label: "Sí / No", group: "selection", icon: "✓/✗" },
  // Catálogos médicos
  { value: "catalog_cie10", label: "CIE-10 (Diagnósticos)", group: "catalog", icon: "🏥" },
  { value: "catalog_cie11", label: "CIE-11 (Diagnósticos)", group: "catalog", icon: "🏥" },
  { value: "catalog_cups", label: "CUPS (Procedimientos)", group: "catalog", icon: "🔬" },
  { value: "catalog_atc", label: "ATC (Medicamentos)", group: "catalog", icon: "💊" },
  { value: "catalog_loinc", label: "LOINC (Laboratorios)", group: "catalog", icon: "🧪" },
  { value: "catalog_snomed", label: "SNOMED CT (Terminología clínica)", group: "catalog", icon: "📋" },
  { value: "catalog_custom", label: "Catálogo personalizado", group: "catalog", icon: "📖" },
] as const;

const FIELD_TYPE_MAP = Object.fromEntries(FIELD_TYPES.map(t => [t.value, t]));

const getFieldTypeLabel = (tipo: string) => FIELD_TYPE_MAP[tipo]?.label || tipo;
const getFieldTypeIcon = (tipo: string) => FIELD_TYPE_MAP[tipo]?.icon || "?";

// ── Props ───────────────────────────────────────────────────────────

interface DynamicFieldConfiguratorProps {
  tableName: "configuracion_campos_paciente" | "configuracion_campos_admision";
  title: string;
  description: string;
  icon: React.ReactNode;
}

// ── Component ───────────────────────────────────────────────────────

export const DynamicFieldConfigurator: React.FC<DynamicFieldConfiguratorProps> = ({
  tableName,
  title,
  description,
  icon,
}) => {
  const [fields, setFields] = useState<DynamicFieldConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newField, setNewField] = useState({
    label: "",
    tipo_dato: "text",
    es_requerido: false,
    placeholder: "",
    opciones: [] as string[],
    maestro: "",
  });
  const [newOption, setNewOption] = useState("");

  const fetchFields = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("orden", { ascending: true });
    if (data && !error) {
      setFields(data.map((d: any) => ({
        ...d,
        opciones: Array.isArray(d.opciones) ? d.opciones : [],
      })));
    } else if (error) {
      toast.error("Error al cargar campos: " + error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchFields(); }, []);

  const resetForm = () => {
    setNewField({ label: "", tipo_dato: "text", es_requerido: false, placeholder: "", opciones: [], maestro: "" });
    setNewOption("");
  };

  const handleCreate = async () => {
    if (!newField.label.trim()) { toast.error("La etiqueta es obligatoria"); return; }
    if (newField.tipo_dato === "select" && newField.opciones.length < 2) {
      toast.error("Debe agregar al menos 2 opciones para un campo de selección");
      return;
    }

    setIsSaving(true);
    const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.orden)) + 1 : 0;

    const insertData: any = {
      label: newField.label.trim(),
      tipo_dato: newField.tipo_dato,
      es_requerido: newField.es_requerido,
      orden: nextOrder,
      placeholder: newField.placeholder || null,
      opciones: newField.tipo_dato === "select" ? newField.opciones : [],
      maestro: newField.tipo_dato.startsWith("catalog_") ? newField.maestro || null : null,
    };

    const { error } = await supabase.from(tableName).insert(insertData);
    setIsSaving(false);
    if (error) { toast.error("Error: " + error.message); return; }

    toast.success(`Campo "${newField.label}" creado`);
    resetForm();
    setIsOpen(false);
    fetchFields();
  };

  const handleDelete = async (field: DynamicFieldConfig) => {
    const { error } = await supabase.from(tableName).delete().eq("id", field.id);
    if (error) { toast.error("Error: " + error.message); return; }
    toast.success(`Campo "${field.label}" eliminado`);
    fetchFields();
  };

  const addOption = () => {
    const val = newOption.trim();
    if (!val) return;
    if (newField.opciones.includes(val)) { toast.error("Opción duplicada"); return; }
    setNewField({ ...newField, opciones: [...newField.opciones, val] });
    setNewOption("");
  };

  const removeOption = (idx: number) => {
    setNewField({ ...newField, opciones: newField.opciones.filter((_, i) => i !== idx) });
  };

  const needsOptions = newField.tipo_dato === "select";
  const isCatalog = newField.tipo_dato.startsWith("catalog_");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                {icon}
              </div>
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl"><Plus className="w-4 h-4" />Nuevo Campo</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Campo Personalizado</DialogTitle>
                  <DialogDescription>
                    Configure el campo que aparecerá automáticamente en el formulario.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Label */}
                  <div>
                    <Label>Etiqueta del campo *</Label>
                    <Input
                      placeholder='Ej: "Grupo Sanguíneo", "EPS", "Lateralidad"'
                      value={newField.label}
                      onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      className="h-11 rounded-xl mt-1"
                      maxLength={100}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <Label>Tipo de campo</Label>
                    <Select
                      value={newField.tipo_dato}
                      onValueChange={(value) => setNewField({ ...newField, tipo_dato: value, opciones: [], maestro: "" })}
                    >
                      <SelectTrigger className="h-11 rounded-xl mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectGroup>
                          <SelectLabel>Básicos</SelectLabel>
                          {FIELD_TYPES.filter(t => t.group === "basic").map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="flex items-center gap-2">
                                <span className="text-xs w-5 text-center opacity-60">{t.icon}</span>
                                {t.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Selección</SelectLabel>
                          {FIELD_TYPES.filter(t => t.group === "selection").map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="flex items-center gap-2">
                                <span className="text-xs w-5 text-center opacity-60">{t.icon}</span>
                                {t.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Catálogos médicos (estándares)</SelectLabel>
                          {FIELD_TYPES.filter(t => t.group === "catalog").map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="flex items-center gap-2">
                                <span className="text-xs w-5 text-center opacity-60">{t.icon}</span>
                                {t.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Placeholder */}
                  <div>
                    <Label>Texto de ayuda (placeholder)</Label>
                    <Input
                      placeholder="Texto que se muestra dentro del campo vacío"
                      value={newField.placeholder}
                      onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                      className="h-11 rounded-xl mt-1"
                      maxLength={200}
                    />
                  </div>

                  {/* Options for select type */}
                  {needsOptions && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border/30">
                      <Label className="text-sm font-semibold">Opciones de selección</Label>
                      <p className="text-xs text-muted-foreground">
                        Agregue las opciones que el usuario podrá elegir. Mínimo 2.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nueva opción..."
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                          className="h-10 rounded-xl flex-1"
                        />
                        <Button type="button" size="sm" onClick={addOption} className="rounded-xl h-10 px-4">
                          Agregar
                        </Button>
                      </div>
                      {newField.opciones.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newField.opciones.map((opt, idx) => (
                            <Badge key={idx} variant="secondary" className="rounded-lg gap-1.5 py-1.5 px-3 text-sm">
                              {opt}
                              <button type="button" onClick={() => removeOption(idx)} className="ml-1 hover:text-destructive">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Catalog master info */}
                  {isCatalog && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border/30">
                      <Label className="text-sm font-semibold">Configuración del catálogo</Label>
                      <p className="text-xs text-muted-foreground">
                        {newField.tipo_dato === "catalog_custom" 
                          ? "Defina el nombre del catálogo personalizado que se usará como fuente de datos."
                          : `Este campo usará el estándar ${getFieldTypeLabel(newField.tipo_dato)} como fuente de búsqueda. El usuario podrá buscar y seleccionar códigos del catálogo.`
                        }
                      </p>
                      {newField.tipo_dato === "catalog_custom" && (
                        <div>
                          <Label>Nombre del catálogo *</Label>
                          <Input
                            placeholder='Ej: "Aseguradoras", "Sedes", "Especialidades"'
                            value={newField.maestro}
                            onChange={(e) => setNewField({ ...newField, maestro: e.target.value })}
                            className="h-10 rounded-xl mt-1"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Required toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>¿Es obligatorio?</Label>
                      <p className="text-sm text-muted-foreground">
                        El campo será requerido al completar el formulario
                      </p>
                    </div>
                    <Switch
                      checked={newField.es_requerido}
                      onCheckedChange={(checked) => setNewField({ ...newField, es_requerido: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={!newField.label.trim() || isSaving} className="rounded-xl gap-2">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Crear Campo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                {icon}
              </div>
              <p className="text-muted-foreground">
                No hay campos personalizados configurados aún.
              </p>
              <p className="text-sm text-muted-foreground">
                Crea tu primer campo para extender el formulario.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Etiqueta</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Detalles</TableHead>
                    <TableHead className="font-semibold">Requerido</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">{field.label}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-lg gap-1.5">
                          <span className="text-xs opacity-60">{getFieldTypeIcon(field.tipo_dato)}</span>
                          {getFieldTypeLabel(field.tipo_dato)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {field.tipo_dato === "select" && field.opciones && field.opciones.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {field.opciones.slice(0, 3).map((opt, i) => (
                              <Badge key={i} variant="outline" className="rounded text-xs">{String(opt)}</Badge>
                            ))}
                            {field.opciones.length > 3 && (
                              <Badge variant="outline" className="rounded text-xs">+{field.opciones.length - 3}</Badge>
                            )}
                          </div>
                        ) : field.maestro ? (
                          <Badge variant="outline" className="rounded text-xs">{field.maestro}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.es_requerido ? (
                          <Badge className="rounded-lg bg-primary/10 text-primary border-primary/20">Sí</Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-lg text-muted-foreground">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar este campo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                El campo "{field.label}" será eliminado permanentemente. Los datos guardados previamente no se verán afectados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(field)}
                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicFieldConfigurator;
