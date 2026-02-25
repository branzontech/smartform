import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { DynamicFieldConfig } from "./DynamicFieldConfigurator";

interface DynamicFieldRendererProps {
  fields: DynamicFieldConfig[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  columns?: 1 | 2;
}

/**
 * Renders dynamic fields based on their tipo_dato.
 * Supports: text, textarea, number, decimal, date, time, datetime, email, phone, url,
 *           select, boolean, and catalog_* types.
 */
export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  fields,
  values,
  onChange,
  columns = 2,
}) => {
  if (fields.length === 0) return null;

  const gridClass = columns === 1 ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <div className={gridClass}>
      {fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          value={values[field.id] || ""}
          onChange={(val) => onChange(field.id, val)}
        />
      ))}
    </div>
  );
};

interface DynamicFieldProps {
  field: DynamicFieldConfig;
  value: string;
  onChange: (value: string) => void;
}

const DynamicField: React.FC<DynamicFieldProps> = ({ field, value, onChange }) => {
  const label = (
    <Label className="mb-1 block">
      {field.label}{field.es_requerido ? " *" : ""}
    </Label>
  );

  const placeholder = field.placeholder || field.label;

  switch (field.tipo_dato) {
    case "textarea":
      return (
        <div className="md:col-span-2">
          {label}
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="rounded-xl resize-none mt-1"
            required={field.es_requerido}
          />
        </div>
      );

    case "number":
    case "decimal":
      return (
        <div>
          {label}
          <Input
            type="number"
            step={field.tipo_dato === "decimal" ? "0.01" : "1"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl mt-1"
            required={field.es_requerido}
          />
        </div>
      );

    case "date":
      return (
        <div>
          {label}
          <Input
            type="date"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl mt-1"
            required={field.es_requerido}
          />
        </div>
      );

    case "time":
      return (
        <div>
          {label}
          <Input
            type="time"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl mt-1"
            required={field.es_requerido}
          />
        </div>
      );

    case "datetime":
      return (
        <div>
          {label}
          <Input
            type="datetime-local"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl mt-1"
            required={field.es_requerido}
          />
        </div>
      );

    case "email":
      return (
        <div>
          {label}
          <Input
            type="email"
            placeholder={placeholder || "correo@ejemplo.com"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl mt-1"
            required={field.es_requerido}
          />
        </div>
      );

    case "phone":
      return (
        <div>
          {label}
          <Input
            type="tel"
            placeholder={placeholder || "+57 300 000 0000"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl mt-1"
            required={field.es_requerido}
          />
        </div>
      );

    case "url":
      return (
        <div>
          {label}
          <Input
            type="url"
            placeholder={placeholder || "https://..."}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl mt-1"
            required={field.es_requerido}
          />
        </div>
      );

    case "select":
      return (
        <div>
          {label}
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-11 rounded-xl mt-1">
              <SelectValue placeholder={placeholder || "Seleccionar..."} />
            </SelectTrigger>
            <SelectContent>
              {(field.opciones || []).map((opt) => (
                <SelectItem key={String(opt)} value={String(opt)}>
                  {String(opt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between py-2">
          <Label>{field.label}{field.es_requerido ? " *" : ""}</Label>
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
          />
        </div>
      );

    // Catalog types - render as searchable text input with hint
    case "catalog_cie10":
    case "catalog_cie11":
    case "catalog_cups":
    case "catalog_atc":
    case "catalog_loinc":
    case "catalog_snomed":
    case "catalog_custom": {
      const catalogName = getCatalogName(field.tipo_dato, field.maestro);
      return (
        <div>
          {label}
          <div className="relative">
            <Input
              placeholder={placeholder || `Buscar en ${catalogName}...`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-11 rounded-xl mt-1"
              required={field.es_requerido}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5">
              {catalogName}
            </span>
          </div>
        </div>
      );
    }

    // Default: text
    default:
      return (
        <div>
          {label}
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl mt-1"
            required={field.es_requerido}
          />
        </div>
      );
  }
};

function getCatalogName(tipo: string, maestro?: string): string {
  const map: Record<string, string> = {
    catalog_cie10: "CIE-10",
    catalog_cie11: "CIE-11",
    catalog_cups: "CUPS",
    catalog_atc: "ATC",
    catalog_loinc: "LOINC",
    catalog_snomed: "SNOMED CT",
    catalog_custom: maestro || "Catálogo",
  };
  return map[tipo] || "Catálogo";
}

export default DynamicFieldRenderer;
