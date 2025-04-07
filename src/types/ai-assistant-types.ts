
export type AssistantMessage = {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
};

export type AssistantQuery = {
  query: string;
  timestamp: Date;
};

export type AssistantSuggestion = {
  id: string;
  text: string;
};

export type AssistantContextData = {
  patientCount?: number;
  activeAppointments?: number;
  totalRevenue?: number;
  doctorCount?: number;
  patientsByDepartment?: Record<string, number>;
  metrics?: Record<string, any>;
};
