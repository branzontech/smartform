import { LucideIcon } from "lucide-react";

import type { Diagnosis, QuestionData, QuestionType } from "@kerhub/core/forms/types";

/** La forma del formato y de sus respuestas se comparte con la app del profesional. */
export type {
  Diagnosis,
  MultifieldConfig,
  ScoredOption,
  ScoringRange,
  ScoringConfig,
  PredefinedVital,
  CustomVital,
  QuestionType,
  QuestionData,
  FormAnswers,
  SelectedDiagnosis,
} from "@kerhub/core/forms/types";

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
