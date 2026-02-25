import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Plus, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormHeaderPreview } from "@/components/forms/FormHeaderPreview";

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface HeaderConfig {
  id?: string;
  nombre_institucion: string;
  logo_url: string | null;
  nit: string;
  direccion: string;
  telefono: string;
  email_institucion: string;
  resolucion_habilitacion: string;
  campos_personalizados: CustomField[];
}

const emptyConfig: HeaderConfig = {
  nombre_institucion: "",
  logo_url: null,
  nit: "",
  direccion: "",
  telefono: "",
  email_institucion: "",
  resolucion_habilitacion: "",
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
      setConfig({
        id: (data as any).id,
        nombre_institucion: (data as any).nombre_institucion || "",
        logo_url: (data as any).logo_url,
        nit: (data as any).nit || "",
        direccion: (data as any).direccion || "",
        telefono: (data as any).telefono || "",
        email_institucion: (data as any).email_institucion || "",
        resolucion_habilitacion: (data as any).resolucion_habilitacion || "",
        campos_personalizados: ((data as any).campos_personalizados as CustomField[]) || [],
      });
    }
    setLoading(false);
  };

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

    const { data: urlData } = supabase.storage
      .from("institution-assets")
      .getPublicUrl(filePath);

    setConfig((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Logo cargado", description: "El logo se ha subido correctamente" });
  };

  const removeLogo = () => {
    setConfig((prev) => ({ ...prev, logo_url: null }));
  };

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

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      nombre_institucion: config.nombre_institucion,
      logo_url: config.logo_url,
      nit: config.nit,
      direccion: config.direccion,
      telefono: config.telefono,
      email_institucion: config.email_institucion,
      resolucion_habilitacion: config.resolucion_habilitacion,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Encabezado institucional</h2>
          <p className="text-xs text-muted-foreground">
            Este encabezado aparecerá en todos los formularios e historias clínicas.
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

      {showPreview && (
        <div className="rounded-xl border border-border bg-white p-4">
          <FormHeaderPreview config={config} formTitle="Historia Clínica General" formCode="HC-001" />
        </div>
      )}

      {/* Logo */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <Label className="text-sm font-medium">Logo de la institución</Label>
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

      {/* Institution data */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <Label className="text-sm font-medium">Datos de la institución</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nombre de la institución</Label>
            <Input
              value={config.nombre_institucion}
              onChange={(e) => setConfig((p) => ({ ...p, nombre_institucion: e.target.value }))}
              placeholder="Clínica / Hospital / IPS"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">NIT</Label>
            <Input
              value={config.nit}
              onChange={(e) => setConfig((p) => ({ ...p, nit: e.target.value }))}
              placeholder="900.123.456-7"
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
            <Label className="text-xs text-muted-foreground">Email institucional</Label>
            <Input
              value={config.email_institucion}
              onChange={(e) => setConfig((p) => ({ ...p, email_institucion: e.target.value }))}
              placeholder="contacto@clinica.com"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Resolución de habilitación</Label>
            <Input
              value={config.resolucion_habilitacion}
              onChange={(e) => setConfig((p) => ({ ...p, resolucion_habilitacion: e.target.value }))}
              placeholder="Res. 1234 de 2024"
            />
          </div>
        </div>
      </div>

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
          <p className="text-xs text-muted-foreground italic">No hay campos personalizados. Agrega uno para mostrar información adicional en el encabezado.</p>
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

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Guardar encabezado
      </Button>
    </div>
  );
};
