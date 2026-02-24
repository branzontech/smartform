import React, { useState, useEffect } from "react";
import { Plus, Trash2, Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DynamicField {
  id: string;
  label: string;
  tipo_dato: string;
  es_requerido: boolean;
  orden: number;
  created_at: string;
}

const TIPO_DATO_LABELS: Record<string, string> = {
  text: "Texto",
  number: "Número",
  date: "Fecha",
};

export const PatientFieldsConfig: React.FC = () => {
  const [fields, setFields] = useState<DynamicField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newField, setNewField] = useState({
    label: "",
    tipo_dato: "text",
    es_requerido: false,
  });

  const fetchFields = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("configuracion_campos_paciente")
      .select("*")
      .order("orden", { ascending: true });

    if (data && !error) {
      setFields(data as DynamicField[]);
    } else if (error) {
      toast.error("Error al cargar los campos: " + error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleCreate = async () => {
    if (!newField.label.trim()) {
      toast.error("La etiqueta del campo es obligatoria");
      return;
    }

    setIsSaving(true);
    const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.orden)) + 1 : 0;

    const { error } = await supabase
      .from("configuracion_campos_paciente")
      .insert({
        label: newField.label.trim(),
        tipo_dato: newField.tipo_dato,
        es_requerido: newField.es_requerido,
        orden: nextOrder,
      });

    setIsSaving(false);

    if (error) {
      toast.error("Error al crear el campo: " + error.message);
      return;
    }

    toast.success(`Campo "${newField.label}" creado exitosamente`);
    setNewField({ label: "", tipo_dato: "text", es_requerido: false });
    setIsOpen(false);
    fetchFields();
  };

  const handleDelete = async (field: DynamicField) => {
    const { error } = await supabase
      .from("configuracion_campos_paciente")
      .delete()
      .eq("id", field.id);

    if (error) {
      toast.error("Error al eliminar el campo: " + error.message);
      return;
    }

    toast.success(`Campo "${field.label}" eliminado`);
    fetchFields();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Campos Personalizados (Extensiones FHIR)</CardTitle>
                <CardDescription>
                  Define campos dinámicos adicionales para el formulario de pacientes. 
                  Estos se almacenan en la columna <code className="text-xs bg-muted px-1 py-0.5 rounded">fhir_extensions</code> siguiendo el estándar HL7 FHIR R4.
                </CardDescription>
              </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl">
                  <Plus className="w-4 h-4" />
                  Nuevo Campo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Campo Personalizado</DialogTitle>
                  <DialogDescription>
                    Este campo aparecerá automáticamente en el formulario de creación de pacientes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Etiqueta del campo *</Label>
                    <Input
                      placeholder='Ej: "Grupo Sanguíneo", "EPS"'
                      value={newField.label}
                      onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      className="h-11 rounded-xl mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Tipo de dato</Label>
                    <Select
                      value={newField.tipo_dato}
                      onValueChange={(value) => setNewField({ ...newField, tipo_dato: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="date">Fecha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>¿Es obligatorio?</Label>
                      <p className="text-sm text-muted-foreground">
                        El campo será requerido al crear un paciente
                      </p>
                    </div>
                    <Switch
                      checked={newField.es_requerido}
                      onCheckedChange={(checked) => setNewField({ ...newField, es_requerido: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newField.label.trim() || isSaving}
                    className="rounded-xl gap-2"
                  >
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
                <Settings2 className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No hay campos personalizados configurados aún.
              </p>
              <p className="text-sm text-muted-foreground">
                Crea tu primer campo para extender el formulario de pacientes.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Etiqueta</TableHead>
                    <TableHead className="font-semibold">Tipo de Dato</TableHead>
                    <TableHead className="font-semibold">Requerido</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">{field.label}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-lg">
                          {TIPO_DATO_LABELS[field.tipo_dato] || field.tipo_dato}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {field.es_requerido ? (
                          <Badge className="rounded-lg bg-primary/10 text-primary border-primary/20">
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-lg text-muted-foreground">
                            No
                          </Badge>
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
                                El campo "{field.label}" será eliminado permanentemente. Los datos ya guardados en <code className="text-xs bg-muted px-1 py-0.5 rounded">fhir_extensions</code> de pacientes existentes no se verán afectados.
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

export default PatientFieldsConfig;
