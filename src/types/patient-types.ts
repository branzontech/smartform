
export interface Patient {
  id: string;
  name: string;
  documentId: string;
  dateOfBirth: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  contactNumber: string;
  email?: string;
  address?: string;
  createdAt: Date;
  lastVisitAt?: Date;
}

export interface MedicalConsultation {
  id: string;
  patientId: string;
  consultationDate: Date;
  reason: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUpDate?: Date;
  status: 'Programada' | 'En curso' | 'Completada' | 'Cancelada';
}

export type PatientWithConsultations = Patient & {
  consultations: MedicalConsultation[];
};
