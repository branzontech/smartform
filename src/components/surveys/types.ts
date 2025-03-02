
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  maxSelections?: number;
  minSelections?: number;
  scale?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
  };
  matrix?: {
    rows: string[];
    columns: string[];
  };
}

export type SurveyQuestionType = 
  | "short-text"
  | "long-text"
  | "single-choice"
  | "multiple-choice"
  | "dropdown"
  | "rating"
  | "scale"
  | "matrix"
  | "date"
  | "email"
  | "phone"
  | "ranking";

export interface SurveyQuestionTypeOption {
  id: SurveyQuestionType;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  sections: SurveySection[];
  settings: SurveySettings;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "published" | "closed";
}

export interface SurveySettings {
  showProgressBar: boolean;
  allowAnonymousResponses: boolean;
  confirmationMessage?: string;
  redirectUrl?: string;
  theme?: "light" | "dark" | "custom";
  customColors?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  showQuestionsNumbers: boolean;
  allowSaveAndContinue: boolean;
  requireAuthentication: boolean;
  limitResponses?: number;
  closeDate?: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  completedAt: string;
  answers: Record<string, any>;
}
