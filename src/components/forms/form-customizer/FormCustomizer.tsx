import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Save, X, Settings } from "lucide-react";
import { CustomField, FormTemplate, FormCustomizerProps } from "./types";
import { CustomFieldEditor } from "./CustomFieldEditor";
import { customFieldTypes, getDefaultFieldByType } from "./data";
import { toast } from "sonner";

export const FormCustomizer: React.FC<FormCustomizerProps> = ({
  templateName = "",
  onSave,
  onCancel,
  existingTemplate,
  maxFields = 10
}) => {
  const [template, setTemplate] = useState<Partial<FormTemplate>>({
    name: templateName,
    description: "",
    fields: [],
    isDefault: false
  });

  const [showAddField, setShowAddField] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<string>("");

  useEffect(() => {
    if (existingTemplate) {
      setTemplate(existingTemplate);
    }
  }, [existingTemplate]);

  const handleAddField = () => {
    if (!selectedFieldType) {
      toast.error("Selecciona un tipo de campo");
      return;
    }

    if (template.fields && template.fields.length >= maxFields) {
      toast.error(`Máximo ${maxFields} campos permitidos`);
      return;
    }

    const fieldType = customFieldTypes.find(type => type.id === selectedFieldType);
    const typeDefaults = getDefaultFieldByType(selectedFieldType);

    const newField: CustomField = {
      id: Date.now().toString(),
      type: selectedFieldType as any,
      label: `${fieldType?.label} ${(template.fields?.length || 0) + 1}`,
      required: false,
      ...typeDefaults
    };

    setTemplate(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));

    setSelectedFieldType("");
    setShowAddField(false);
  };

  const handleFieldUpdate = (fieldId: string, updatedField: CustomField) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields?.map(field => 
        field.id === fieldId ? updatedField : field
      )
    }));
  };

  const handleFieldDelete = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields?.filter(field => field.id !== fieldId)
    }));
  };

  const handleSave = () => {
    if (!template.name?.trim()) {
      toast.error("El nombre de la plantilla es obligatorio");
      return;
    }

    if (!template.fields || template.fields.length === 0) {
      toast.error("Agrega al menos un campo personalizado");
      return;
    }

    const completeTemplate: FormTemplate = {
      id: existingTemplate?.id || Date.now().toString(),
      name: template.name,
      description: template.description || "",
      fields: template.fields,
      isDefault: template.isDefault || false,
      createdAt: existingTemplate?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onSave(completeTemplate);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Plantilla
          </CardTitle>
          <CardDescription>
            Personaliza los campos adicionales que aparecerán en el formulario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de la plantilla</Label>
              <Input
                value={template.name || ""}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Cita de Medicina General"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                checked={template.isDefault || false}
                onCheckedChange={(isDefault) => setTemplate(prev => ({ ...prev, isDefault }))}
              />
              <Label>Usar como plantilla predeterminada</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={template.description || ""}
              onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe cuándo usar esta plantilla"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Campos existentes */}
      {template.fields && template.fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campos Personalizados ({template.fields.length}/{maxFields})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.fields.map((field) => (
              <CustomFieldEditor
                key={field.id}
                field={field}
                onUpdate={(updatedField) => handleFieldUpdate(field.id, updatedField)}
                onDelete={() => handleFieldDelete(field.id)}
                canDelete={template.fields!.length > 1}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Agregar nuevo campo */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Campo</CardTitle>
          {template.fields && template.fields.length >= maxFields && (
            <Alert>
              <AlertDescription>
                Has alcanzado el límite máximo de {maxFields} campos personalizados.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        {template.fields && template.fields.length < maxFields && (
          <CardContent>
            {!showAddField ? (
              <Button onClick={() => setShowAddField(true)} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Campo Personalizado
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de campo</Label>
                  <Select value={selectedFieldType} onValueChange={setSelectedFieldType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {customFieldTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleAddField} disabled={!selectedFieldType}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddField(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Plantilla
        </Button>
      </div>
    </div>
  );
};