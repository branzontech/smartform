
export interface FormResponse {
  timestamp: string;
  data: {
    [key: string]: string | string[] | FormComplexValue;
    _patientId?: string;
    _consultationId?: string;
  };
}

// Interface for complex value types
export interface FormComplexValue {
  // For vitals - TA type
  sys?: string | number;
  dia?: string | number;
  
  // For vitals - IMC type
  weight?: string | number;
  height?: string | number;
  bmi?: string | number;
  
  // For clinical type
  title?: string;
  detail?: string;
  
  // For file type
  name?: string;
  size?: number;
  type?: string;
  
  // For any other complex type with custom fields
  [key: string]: any;
}

export interface FormWithUsage extends FormResponse {
  usageCount: number;
  lastUsed: Date;
}

// New interface for form summary display in patient detail
export interface FormSummary {
  id: string;
  title: string;
  responseCount: number;
  lastUpdated: Date;
}
