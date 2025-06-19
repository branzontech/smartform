
export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';
export type DataSource = 'patients' | 'appointments' | 'billing' | 'consultations' | 'inventory';
export type ExportFormat = 'pdf' | 'excel';

export interface ReportVariable {
  id: string;
  name: string;
  displayName: string;
  dataSource: DataSource;
  type: 'numeric' | 'categorical' | 'date';
  description?: string;
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  data: any[];
  colors?: string[];
}

export interface ReportConfig {
  id: string;
  title: string;
  description?: string;
  variables: string[]; // IDs of selected variables
  charts: ChartConfig[];
  filters: ReportFilter[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  createdAt: Date;
  lastModified: Date;
}

export interface ReportFilter {
  id: string;
  variableId: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

export interface SavedReport {
  id: string;
  name: string;
  config: ReportConfig;
  createdAt: Date;
  lastGenerated?: Date;
  isTemplate: boolean;
  tags?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Partial<ReportConfig>;
  previewImage?: string;
}

export interface ReportData {
  charts: ChartConfig[];
  summary: {
    totalRecords: number;
    dateGenerated: Date;
    filters: ReportFilter[];
  };
  rawData: any[];
}
