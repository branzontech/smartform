import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, CreditCard, Calendar, Phone, Mail, FileText, Shield, Heart,
  MapPin, Building, Briefcase, IdCard, Save, GripVertical, Loader2,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { PatientHeaderBanner } from "@/components/forms/PatientHeaderBanner";

const ICON_MAP: Record<string, React.ElementType> = {
  User, CreditCard, Calendar, Phone, Mail, FileText, Shield, Heart,
  MapPin, Building, Briefcase, IdCard,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const COUNTRY_OPTIONS = [
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "México" },
  { value: "EC", label: "Ecuador" },
  { value: "PE", label: "Perú" },
  { value: "AR", label: "Argentina" },
];

const GRUPO_OPTIONS = [
  { value: "principal", label: "Principal" },
  { value: "secundario", label: "Secundario" },
  { value: "regulatorio", label: "Regulatorio" },
];

const FORMATO_OPTIONS = [
  { value: "text", label: "Texto" },
  { value: "date", label: "Fecha" },
  { value: "age_from_date", label: "Edad" },
  { value: "document_with_type", label: "Documento con tipo" },
  { value: "phone", label: "Teléfono" },
  { value: "badge", label: "Badge" },
];

const fieldSchema = z.object({
  etiqueta: z.string().min(2, "Mínimo 2 caracteres"),
  orden: z.number().int().positive(),
});

interface FieldConfig {
  id: string;
  campo: string;
  etiqueta: string;
  fhir_path: string | null;
  fhir_element_type: string | null;
  orden: number;
  visible: boolean;
  grupo: string;
  formato: string;
  icono: string | null;
  pais: string[];
  fhir_extensions: any;
}

// Mock patient for preview
const MOCK_PATIENT = {
  id: "preview",
  nombres: "Juan Carlos",
  apellidos: "Pérez García",
  tipo_documento: "CC",
  numero_documento: "1083557464",
  fecha_nacimiento: "1990-03-15",
  telefono_principal: "555-123-4567",
  email: "juan.perez@example.com",
  numero_historia: "CC1083557464",
  tipo_afiliacion: "Contributivo",
  regimen: "Contributivo",
  direccion: "Calle 45 #12-34",
  ciudad: "Bogotá",
  ocupacion: "Ingeniero",
  carnet: "CAR-001",
  estado_paciente: "activo",
  fhir_extensions: {},
};

export const PatientHeaderConfig: React.FC = () => {
  const queryClient = useQueryClient();
  const [localFields, setLocalFields] = useState<FieldConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data: fields, isLoading } = useQuery({
    queryKey: ["configuracion-encabezado-paciente-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion_encabezado_paciente")
        .select("*")
        .order("orden", { ascending: true });
      if (error) throw error;
      return (data || []) as FieldConfig[];
    },
  });

  useEffect(() => {
    if (fields) setLocalFields(fields);
  }, [fields]);

  const saveMutation = useMutation({
    mutationFn: async (fieldsToSave: FieldConfig[]) => {
      // Validate all fields
      for (const f of fieldsToSave) {
        fieldSchema.parse({ etiqueta: f.etiqueta, orden: f.orden });
      }

      // Upsert batch
      for (const field of fieldsToSave) {
        const { error } = await supabase
          .from("configuracion_encabezado_paciente")
          .update({
            etiqueta: field.etiqueta,
            orden: field.orden,
            visible: field.visible,
            grupo: field.grupo,
            formato: field.formato,
            icono: field.icono,
            pais: field.pais,
          })
          .eq("id", field.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["configuracion-encabezado-paciente"] });
      queryClient.invalidateQueries({ queryKey: ["configuracion-encabezado-paciente-admin"] });
    },
    onError: (err: any) => {
      toast.error("Error al guardar: " + (err?.message || "Error desconocido"));
    },
  });

  const updateField = (index: number, updates: Partial<FieldConfig>) => {
    setLocalFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
    setHasChanges(true);
  };

  const toggleCountry = (index: number, country: string) => {
    const field = localFields[index];
    const currentPais = field.pais || [];
    const newPais = currentPais.includes(country)
      ? currentPais.filter((c) => c !== country)
      : [...currentPais, country];
    updateField(index, { pais: newPais });
  };

  // Drag and drop
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setLocalFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next.map((f, i) => ({ ...f, orden: i + 1 }));
    });
    setDragIndex(index);
    setHasChanges(true);
  };
  const handleDragEnd = () => setDragIndex(null);

  // Build preview config from local state
  const previewConfig = localFields.filter((f) => f.visible);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Vista previa en tiempo real</CardTitle>
        </CardHeader>
        <CardContent>
          <BannerPreview fields={previewConfig} patient={MOCK_PATIENT} />
        </CardContent>
      </Card>

      {/* Field List */}
      <Card className="border-border/40">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Campos del encabezado</CardTitle>
          <Button
            onClick={() => saveMutation.mutate(localFields)}
            disabled={!hasChanges || saveMutation.isPending}
            size="sm"
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar cambios
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {localFields.map((field, index) => {
            const IconComp = (field.icono && ICON_MAP[field.icono]) || User;
            return (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/50 transition-all",
                  dragIndex === index && "opacity-50 border-primary/50",
                  !field.visible && "opacity-60"
                )}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />

                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <IconComp className="w-4 h-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-[1fr_100px_120px] gap-2 items-center">
                  <Input
                    value={field.etiqueta}
                    onChange={(e) => updateField(index, { etiqueta: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Etiqueta"
                  />
                  <Select
                    value={field.grupo}
                    onValueChange={(v) => updateField(index, { grupo: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRUPO_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={field.formato}
                    onValueChange={(v) => updateField(index, { formato: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATO_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country chips */}
                <div className="flex flex-wrap gap-1 shrink-0">
                  {COUNTRY_OPTIONS.map((c) => (
                    <Badge
                      key={c.value}
                      variant={field.pais?.includes(c.value) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-[10px] px-1.5 py-0",
                        field.pais?.includes(c.value) && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => toggleCountry(index, c.value)}
                    >
                      {c.value}
                    </Badge>
                  ))}
                </div>

                <Switch
                  checked={field.visible}
                  onCheckedChange={(v) => updateField(index, { visible: v })}
                  className="shrink-0"
                />

                <span className="text-xs text-muted-foreground w-6 text-center shrink-0">
                  {field.orden}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

// Inline preview component using same logic as PatientHeaderBanner
const BannerPreview: React.FC<{ fields: FieldConfig[]; patient: any }> = ({ fields, patient }) => {
  const [expanded, setExpanded] = useState(false);

  const principalFields = fields.filter((f) => f.grupo === "principal");
  const secondaryFields = fields.filter((f) => f.grupo === "secundario" || f.grupo === "regulatorio");
  const nameField = principalFields.find((f) => f.campo === "nombre_completo");
  const otherPrincipal = principalFields.filter((f) => f.campo !== "nombre_completo");

  const resolveValue = (campo: string): string | null => {
    if (campo === "nombre_completo") return `${patient.nombres} ${patient.apellidos}`;
    return patient[campo] ?? null;
  };

  const formatValue = (raw: string | null, formato: string): React.ReactNode => {
    if (!raw) return <span className="text-muted-foreground/60 italic text-xs">—</span>;
    switch (formato) {
      case "age_from_date":
        try {
          const age = Math.floor((Date.now() - new Date(raw).getTime()) / 31557600000);
          return <Badge variant="secondary" className="text-xs">{age} años</Badge>;
        } catch { return raw; }
      case "document_with_type":
        return `${patient.tipo_documento || "CC"} ${raw}`;
      case "badge":
        return <Badge variant="outline" className="text-xs">{raw}</Badge>;
      default:
        return raw;
    }
  };

  const initials = `${patient.nombres[0]}${patient.apellidos[0]}`.toUpperCase();

  return (
    <Card className="border border-border/40 bg-gradient-to-r from-muted/30 to-card rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {nameField && (
              <p className="font-semibold text-base text-foreground truncate leading-tight">
                {resolveValue("nombre_completo")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              {otherPrincipal.map((field) => {
                const IconComp = field.icono ? ICON_MAP[field.icono] : null;
                return (
                  <div key={field.id} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {IconComp && <IconComp className="w-3.5 h-3.5 shrink-0" />}
                    <span className="text-foreground">{formatValue(resolveValue(field.campo), field.formato)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {secondaryFields.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="shrink-0 h-8 px-2">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-xs ml-1">{expanded ? "Menos" : "Más"}</span>
            </Button>
          )}
        </div>
        {expanded && secondaryFields.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-x-5 gap-y-2">
            {secondaryFields.map((field) => {
              const IconComp = field.icono ? ICON_MAP[field.icono] : null;
              return (
                <div key={field.id} className="flex items-center gap-1.5 text-sm">
                  {IconComp && <IconComp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className="text-muted-foreground text-xs">{field.etiqueta}:</span>
                  <span className="text-foreground">{formatValue(resolveValue(field.campo), field.formato)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PatientHeaderConfig;
