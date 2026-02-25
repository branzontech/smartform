import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Plus, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormHeaderPreview } from "@/components/forms/FormHeaderPreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ENTITY_TYPES,
  COUNTRIES,
  getHeaderFields,
  type HeaderFieldDef,
} from "@/constants/headerFields";

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface HeaderConfig {
  id?: string;
  nombre_principal: string;
  logo_url: string | null;
  telefono: string;
  email_institucion: string;
  direccion: string;
  tipo_entidad: string;
  pais: string;
  identificacion_fiscal: Record<string, string>;
  datos_regulatorios: Record<string, string>;
  campos_personalizados: CustomField[];
}

const emptyConfig: HeaderConfig = {
  nombre_principal: "",
  logo_url: null,
  telefono: "",
  email_institucion: "",
  direccion: "",
  tipo_entidad: "institucion",
  pais: "CO",
  identificacion_fiscal: {},
  datos_regulatorios: {},
  campos_personalizados: [],
};

export const InstitutionHeaderConfig = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<HeaderConfig>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data, error } = await supabase
      .from("configuracion_encabezado" as any)
      .select("*")
      .limit(1)
      .single();

    if (data && !error) {
      const d = data as any;
      setConfig({
        id: d.id,
        nombre_principal: d.nombre_principal || "",
        logo_url: d.logo_url,
        telefono: d.telefono || "",
        email_institucion: d.email_institucion || "",
        direccion: d.direccion || "",
        tipo_entidad: d.tipo_entidad || "institucion",
        pais: d.pais || "CO",
        identificacion_fiscal: (d.identificacion_fiscal as Record<string, string>) || {},
        datos_regulatorios: (d.datos_regulatorios as Record<string, string>) || {},
        campos_personalizados: (d.campos_personalizados as CustomField[]) || [],
      });
    }
    setLoading(false);
  };

  const dynamicFields = getHeaderFields(config.tipo_entidad, config.pais);

  const getJsonbValue = (field: HeaderFieldDef): string => {
    const source =
      field.jsonbTarget === "identificacion_fiscal"
        ? config.identificacion_fiscal
        : config.datos_regulatorios;
    return source[field.key] || "";
  };

  const setJsonbValue = (field: HeaderFieldDef, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field.jsonbTarget]: {
        ...prev[field.jsonbTarget],
        [field.key]: value,
      },
    }));
  };

  // --- Logo handlers ---
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Solo se permiten imágenes", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `logos/institution-logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("institution-assets")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Error al subir logo", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("institution-assets").getPublicUrl(filePath);
    setConfig((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Logo cargado", description: "El logo se ha subido correctamente" });
  };

  const removeLogo = () => setConfig((prev) => ({ ...prev, logo_url: null }));

  // --- Custom fields ---
  const addCustomField = () => {
    setConfig((prev) => ({
      ...prev,
      campos_personalizados: [
        ...prev.campos_personalizados,
        { id: crypto.randomUUID(), label: "", value: "" },
      ],
    }));
  };

  const updateCustomField = (id: string, field: "label" | "value", val: string) => {
    setConfig((prev) => ({
      ...prev,
      campos_personalizados: prev.campos_personalizados.map((f) =>
        f.id === id ? { ...f, [field]: val } : f
      ),
    }));
  };

  const removeCustomField = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      campos_personalizados: prev.campos_personalizados.filter((f) => f.id !== id),
    }));
  };

  // --- Save ---
  const handleSave = async () => {
    setSaving(true);
    const payload = {
      nombre_principal: config.nombre_principal,
      logo_url: config.logo_url,
      telefono: config.telefono,
      email_institucion: config.email_institucion,
      direccion: config.direccion,
      tipo_entidad: config.tipo_entidad,
      pais: config.pais,
      identificacion_fiscal: config.identificacion_fiscal as any,
      datos_regulatorios: config.datos_regulatorios as any,
      campos_personalizados: config.campos_personalizados as any,
    };

    let error;
    if (config.id) {
      ({ error } = await supabase
        .from("configuracion_encabezado" as any)
        .update(payload)
        .eq("id", config.id));
    } else {
      const { data, error: insertError } = await supabase
        .from("configuracion_encabezado" as any)
        .insert(payload)
        .select()
        .single();
      error = insertError;
      if (data) setConfig((prev) => ({ ...prev, id: (data as any).id }));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: "Encabezado institucional actualizado" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const entityLabel = config.tipo_entidad === "profesional_independiente" ? "profesional" : "institución";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed header */}
      <div className="shrink-0 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Encabezado institucional</h2>
          <p className="text-xs text-muted-foreground">
            Aparecerá en todos los formularios e historias clínicas.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-3.5 w-3.5" />
          {showPreview ? "Ocultar vista previa" : "Vista previa"}
        </Button>
      </div>

      {/* Scrollable form area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1">
        {showPreview && (
          <div className="rounded-xl border border-border bg-white p-4">
            <FormHeaderPreview config={config} formTitle="Historia Clínica General" formCode="HC-001" />
          </div>
        )}

        {/* Entity type & Country selectors */}
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <Label className="text-sm font-medium">Tipo de entidad y país</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de entidad</Label>
              <Select
                value={config.tipo_entidad}
                onValueChange={(v) =>
                  setConfig((prev) => ({
                    ...prev,
                    tipo_entidad: v,
                    identificacion_fiscal: {},
                    datos_regulatorios: {},
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">País</Label>
              <Select
                value={config.pais}
                onValueChange={(v) =>
                  setConfig((prev) => ({
                    ...prev,
                    pais: v,
                    identificacion_fiscal: {},
                    datos_regulatorios: {},
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.flag} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <Label className="text-sm font-medium">Logo de la {entityLabel}</Label>
          <div className="flex items-center gap-4">
            {config.logo_url ? (
              <div className="relative group">
                <img
                  src={config.logo_url}
                  alt="Logo"
                  className="h-16 w-auto object-contain rounded-lg border border-border"
                />
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-16 w-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer",
                  "hover:border-primary/50 hover:bg-muted/50 transition-colors"
                )}
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
            {config.logo_url && (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                Cambiar logo
              </Button>
            )}
          </div>
        </div>

        {/* Universal data */}
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <Label className="text-sm font-medium">Datos generales</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {config.tipo_entidad === "profesional_independiente" ? "Nombre del profesional" : "Nombre de la institución"}
              </Label>
              <Input
                value={config.nombre_principal}
                onChange={(e) => setConfig((p) => ({ ...p, nombre_principal: e.target.value }))}
                placeholder={config.tipo_entidad === "profesional_independiente" ? "Dr. Juan Pérez" : "Clínica / Hospital / IPS"}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dirección</Label>
              <Input
                value={config.direccion}
                onChange={(e) => setConfig((p) => ({ ...p, direccion: e.target.value }))}
                placeholder="Calle 1 # 2-3, Ciudad"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Teléfono</Label>
              <Input
                value={config.telefono}
                onChange={(e) => setConfig((p) => ({ ...p, telefono: e.target.value }))}
                placeholder="+57 300 123 4567"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                value={config.email_institucion}
                onChange={(e) => setConfig((p) => ({ ...p, email_institucion: e.target.value }))}
                placeholder="contacto@clinica.com"
              />
            </div>
          </div>
        </div>

        {/* Dynamic country/entity fields */}
        {dynamicFields.length > 0 && (
          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <Label className="text-sm font-medium">
              {config.tipo_entidad === "profesional_independiente"
                ? "Datos del profesional"
                : `Identificación y regulación (${COUNTRIES.find((c) => c.value === config.pais)?.flag || ""} ${COUNTRIES.find((c) => c.value === config.pais)?.label || config.pais})`}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dynamicFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    value={getJsonbValue(field)}
                    onChange={(e) => setJsonbValue(field, e.target.value)}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom fields */}
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Campos personalizados</Label>
            <Button variant="ghost" size="sm" onClick={addCustomField} className="gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Agregar campo
            </Button>
          </div>
          {config.campos_personalizados.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No hay campos personalizados. Agrega uno para mostrar información adicional en el encabezado.
            </p>
          ) : (
            <div className="space-y-2">
              {config.campos_personalizados.map((field) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, "label", e.target.value)}
                    placeholder="Etiqueta"
                    className="flex-1"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, "value", e.target.value)}
                    placeholder="Valor"
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCustomField(field.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar encabezado
        </Button>
      </div>
    </div>
  );
};
