
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

export interface ScoredOption {
  id: string;
  text: string;
  score: number;
}

export interface ScoringRange {
  min: number;
  max: number;
  label: string;
  color: string;
}

export interface ScoringConfig {
  enabled: boolean;
  ranges: ScoringRange[];
}

export interface PredefinedVital {
  enabled: boolean;
  label: string;
  unit: string;
  loinc: string;
  calculated?: boolean;
  formula?: string;
}

export interface CustomVital {
  id: string;
  label: string;
  unit: string;
  valueType: "number" | "text";
  calculated: boolean;
  formula?: string;
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
  | "file"
  | "medication"
  | "scored_checkbox"
  | "score_total";

export interface QuestionTypeOption {
  id: QuestionType;
  label: string;
  icon: LucideIcon;
}

export interface OptionProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  onAddNext?: () => void;
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
  /** Campo de un formulario base (p. ej. la historia clínica): no se borra, mueve ni cambia. */
  locked?: boolean;
  /** Desactivado: un campo ya usado no se borra; deja de pedirse en registros nuevos y se conserva en los viejos. */
  inactive?: boolean;
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
  optionLayout?: "vertical" | "horizontal";
  optionColumns?: number;
  isCalculated?: boolean;
  calculationType?: "sum" | "subtract" | "multiply" | "divide";
  numberType?: "integer" | "decimal";
  // Legacy scored_checkbox fields (kept for backward compat)
  scoredOptions?: { label: string; score: number }[];
  scoredSelectionMode?: "single" | "multiple";
  // New scored_checkbox fields
  selectionMode?: "single" | "multiple";
  scoredItems?: ScoredOption[];
  // score_total fields
  sourceQuestionIds?: string[];
  scoring?: ScoringConfig;
  // vitals fields
  layout?: { columns: number };
  predefinedVitals?: Record<string, PredefinedVital>;
  customVitals?: CustomVital[];
  showBmiClassification?: boolean;
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
  /** Campo ya usado en registros: su tipo no se puede cambiar. */
  disabled?: boolean;
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
