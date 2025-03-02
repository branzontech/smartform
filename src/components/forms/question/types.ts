
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface Diagnosis {
  id: string;
  code: string;
  name: string;
}

export interface MultifieldConfig {
  id: string;
  label: string;
}

export type QuestionType = 
  | "short" 
  | "paragraph" 
  | "multiple" 
  | "checkbox" 
  | "dropdown" 
  | "calculation" 
  | "vitals" 
  | "diagnosis" 
  | "clinical" 
  | "multifield"
  | "signature"
  | "file";

export interface QuestionTypeOption {
  id: QuestionType;
  label: string;
  icon: LucideIcon;
}

export interface OptionProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  isMultiple?: boolean;
}

export interface AddOptionButtonProps {
  onClick: () => void;
}

export interface DiagnosisListProps {
  diagnoses: Diagnosis[];
  selectedDiagnoses: Diagnosis[];
  onSelect: (diagnosis: Diagnosis) => void;
  onRemove: (id: string) => void;
}

export interface MultifieldItemProps {
  id: string;
  label: string;
  onLabelChange: (id: string, label: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export interface SignaturePadProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
}

export interface QuestionData {
  id: string;
  type: string;
  title: string;
  required: boolean;
  options?: string[];
  formula?: string;
  min?: number;
  max?: number;
  units?: string;
  diagnoses?: Diagnosis[];
  vitalType?: string;
  sysMin?: number;
  sysMax?: number;
  diaMin?: number;
  diaMax?: number;
  fileTypes?: string[];
  maxFileSize?: number;
  multifields?: MultifieldConfig[];
  orientation?: "vertical" | "horizontal";
}

export interface QuestionProps {
  question: QuestionData;
  onUpdate: (id: string, data: Partial<QuestionData>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export interface QuestionTypeProps {
  selected: string;
  onChange: (type: string) => void;
}

export interface ContentComponentProps {
  question: QuestionData;
  onUpdate: (data: Partial<QuestionData>) => void;
  readOnly?: boolean;
}

export interface QuestionContentProps {
  question: QuestionData;
  onUpdate: (data: Partial<QuestionData>) => void;
  readOnly?: boolean;
}
