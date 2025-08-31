export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'task' | 'reminder' | 'monitoring' | 'condition';
  title: string;
  description: string;
  config?: WorkflowStepConfig;
  position: { x: number; y: number };
}

export interface WorkflowStepConfig {
  // Para triggers
  triggerType?: 'consultation_completed' | 'appointment_created' | 'manual';
  
  // Para tareas
  taskType?: 'send_reminder' | 'schedule_appointment' | 'send_survey' | 'send_educational_material';
  delay?: number; // en horas
  
  // Para recordatorios
  reminderType?: 'sms' | 'email' | 'both';
  reminderMessage?: string;
  
  // Para monitoreo
  monitoringType?: 'no_response' | 'missed_appointment' | 'medication_adherence';
  timeframe?: number; // en horas
  
  // Para condiciones
  condition?: string;
  truePath?: string;
  falsePath?: string;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  createdAt: Date;
  updatedAt: Date;
  triggerCount?: number;
  successRate?: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'post_consultation' | 'appointment_management' | 'patient_engagement' | 'treatment_adherence';
  steps: Omit<WorkflowStep, 'position'>[];
  connections: WorkflowConnection[];
}