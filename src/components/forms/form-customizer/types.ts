import { LucideIcon } from "lucide-react";

export type CustomFieldType = 
  | "text" 
  | "textarea" 
  | "select" 
  | "checkbox" 
  | "radio"
  | "date"
  | "time"
  | "number"
  | "email"
  | "phone";

export interface CustomFieldOption {
  id: string;
  label: string;
  value: string;
}

export interface CustomField {
  id: string;
  type: CustomFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: CustomFieldOption[];
  defaultValue?: string | boolean | number;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: CustomField[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FormCustomizerProps {
  templateName?: string;
  onSave: (template: FormTemplate) => void;
  onCancel?: () => void;
  existingTemplate?: FormTemplate;
  maxFields?: number;
}

export interface CustomFieldTypeOption {
  id: CustomFieldType;
  label: string;
  icon: LucideIcon;
  description: string;
}