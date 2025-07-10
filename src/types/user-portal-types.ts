
export interface UserPortalData {
  id: string;
  userId: string;
  personalData: PersonalData;
  medicalHistory: MedicalRecord[];
  results: TestResult[];
  appointments: UserAppointment[];
}

export interface PersonalData {
  fullName: string;
  documentId: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
}

export interface MedicalRecord {
  id: string;
  date: Date;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  prescriptions?: Prescription[];
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface TestResult {
  id: string;
  testName: string;
  date: Date;
  requestedBy: string;
  status: 'Pendiente' | 'Completado' | 'En proceso';
  results?: {
    parameter: string;
    value: string;
    referenceRange: string;
    status: 'Normal' | 'Alto' | 'Bajo' | 'Crítico';
  }[];
  files?: {
    name: string;
    url: string;
    type: string;
  }[];
}

export interface UserAppointment {
  id: string;
  date: Date;
  time: string;
  doctorName: string;
  specialty: string;
  reason: string;
  status: 'Programada' | 'Confirmada' | 'Completada' | 'Cancelada';
  location: string;
  notes?: string;
}
