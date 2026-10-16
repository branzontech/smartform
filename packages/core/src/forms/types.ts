/**
 * Formatos clínicos de Ker Hub: la forma de un formato y de sus respuestas.
 * Lo comparten Ker Hub web y la app del profesional.
 */

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

/**
 * Respuestas de un formato mientras se diligencia. Cada tipo guarda distinto:
 * texto, arreglos, objetos o claves compuestas (`<id>_<campo>`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cada tipo de pregunta guarda una forma distinta
export type FormAnswers = Record<string, any>;

/** Diagnóstico elegido al atender (CIE-10 / CIE-11). */
export interface SelectedDiagnosis {
  codigo: string;
  descripcion: string;
  sistema: string;
  fhir_system_uri: string;
}

export const ICD10_URI = "http://hl7.org/fhir/sid/icd-10";
