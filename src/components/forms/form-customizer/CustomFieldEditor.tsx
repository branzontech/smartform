import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { CustomField, CustomFieldOption } from "./types";
import { customFieldTypes, getDefaultFieldByType } from "./data";

interface CustomFieldEditorProps {
  field: CustomField;
  onUpdate: (field: CustomField) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export const CustomFieldEditor: React.FC<CustomFieldEditorProps> = ({
  field,
  onUpdate,
  onDelete,
  canDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const fieldType = customFieldTypes.find(type => type.id === field.type);

  const handleTypeChange = (newType: string) => {
    const typeDefaults = getDefaultFieldByType(newType);
    onUpdate({
      ...field,
      type: newType as any,
      ...typeDefaults
    });
  };

  const handleOptionAdd = () => {
    const newOption: CustomFieldOption = {
      id: Date.now().toString(),
      label: `Opción ${(field.options?.length || 0) + 1}`,
      value: `option${(field.options?.length || 0) + 1}`
    };
    
    onUpdate({
      ...field,
      options: [...(field.options || []), newOption]
    });
  };

  const handleOptionUpdate = (optionId: string, updates: Partial<CustomFieldOption>) => {
    onUpdate({
      ...field,
      options: field.options?.map(option => 
        option.id === optionId ? { ...option, ...updates } : option
      )
    });
  };

  const handleOptionDelete = (optionId: string) => {
    onUpdate({
      ...field,
      options: field.options?.filter(option => option.id !== optionId)
    });
  };

  const needsOptions = ["select", "radio", "checkbox"].includes(field.type);

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <div className="flex items-center gap-2">
              {fieldType && <fieldType.icon className="h-4 w-4" />}
              <CardTitle className="text-sm">
                {field.label || "Campo sin nombre"}
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {fieldType?.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Contraer" : "Expandir"}
            </Button>
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de campo</Label>
              <Select value={field.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customFieldTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Etiqueta del campo</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                placeholder="Nombre del campo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Texto de ayuda (placeholder)</Label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
              placeholder="Texto que aparece cuando el campo está vacío"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={field.required}
              onCheckedChange={(required) => onUpdate({ ...field, required })}
            />
            <Label>Campo obligatorio</Label>
          </div>

          {needsOptions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opciones</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOptionAdd}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar opción
                </Button>
              </div>
              
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => handleOptionUpdate(option.id, { label: e.target.value })}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1"
                    />
                    <Input
                      value={option.value}
                      onChange={(e) => handleOptionUpdate(option.id, { value: e.target.value })}
                      placeholder="valor"
                      className="w-24"
                    />
                    {field.options && field.options.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOptionDelete(option.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {field.type === "number" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor mínimo</Label>
                <Input
                  type="number"
                  value={field.validation?.min || ""}
                  onChange={(e) => onUpdate({
                    ...field,
                    validation: {
                      ...field.validation,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor máximo</Label>
                <Input
                  type="number"
                  value={field.validation?.max || ""}
                  onChange={(e) => onUpdate({
                    ...field,
                    validation: {
                      ...field.validation,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                />
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};