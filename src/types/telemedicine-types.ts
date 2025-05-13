
export interface TelemedicineSession {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: "scheduled" | "ready" | "completed" | "cancelled";
  specialty: string;
  notes: string;
  recordingUrl?: string | null;
  prescription?: boolean;
  followUp?: boolean;
}
