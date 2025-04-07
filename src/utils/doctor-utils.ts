
import { nanoid } from "nanoid";
import { Doctor, Patient, Appointment, DoctorStatistics } from "@/types/patient-types";

// Mock data for doctors
const mockDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Carlos Jiménez",
    specialty: "Cardiología",
    documentId: "12345678",
    licenseNumber: "MED-5432",
    contactNumber: "555-123-4567",
    email: "carlos.jimenez@ejemplo.com",
    createdAt: new Date(2021, 5, 15),
    status: "Activo",
    bio: "Especialista en cardiología con más de 10 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares.",
    specialties: ["Cardiología", "Medicina Interna"],
    schedule: {
      monday: { isWorking: true, startTime: "08:00", endTime: "16:00" },
      tuesday: { isWorking: true, startTime: "08:00", endTime: "16:00" },
      wednesday: { isWorking: true, startTime: "08:00", endTime: "16:00" },
      thursday: { isWorking: true, startTime: "08:00", endTime: "16:00" },
      friday: { isWorking: true, startTime: "08:00", endTime: "14:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false },
    }
  },
  {
    id: "doc-2",
    name: "Dra. Laura Sánchez",
    specialty: "Pediatría",
    documentId: "87654321",
    licenseNumber: "MED-9876",
    contactNumber: "555-987-6543",
    email: "laura.sanchez@ejemplo.com",
    createdAt: new Date(2019, 2, 10),
    status: "Activo",
    specialties: ["Pediatría", "Neonatología"],
    schedule: {
      monday: { isWorking: true, startTime: "09:00", endTime: "17:00" },
      tuesday: { isWorking: true, startTime: "09:00", endTime: "17:00" },
      wednesday: { isWorking: true, startTime: "09:00", endTime: "17:00" },
      thursday: { isWorking: true, startTime: "09:00", endTime: "17:00" },
      friday: { isWorking: true, startTime: "09:00", endTime: "15:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false },
    }
  },
  {
    id: "doc-3",
    name: "Dr. Alejandro Martínez",
    specialty: "Traumatología",
    documentId: "23456789",
    licenseNumber: "MED-7890",
    contactNumber: "555-234-5678",
    email: "alejandro.martinez@ejemplo.com",
    createdAt: new Date(2020, 7, 22),
    status: "Vacaciones",
    bio: "Especialista en traumatología y ortopedia, con enfoque en lesiones deportivas y rehabilitación.",
    specialties: ["Traumatología", "Ortopedia", "Medicina Deportiva"],
  }
];

// Mock data for patients assigned to doctors
const mockPatientsByDoctor: Record<string, string[]> = {
  "doc-1": ["1", "3", "5"],
  "doc-2": ["2", "4"],
  "doc-3": ["1", "6"]
};

// Mock data for appointments by doctor
const mockAppointmentsByDoctor: Record<string, string[]> = {
  "doc-1": ["1", "4"],
  "doc-2": ["2", "5"],
  "doc-3": ["3", "6"]
};

// Get all doctors
export const getAllDoctors = async (): Promise<Doctor[]> => {
  const storedDoctors = localStorage.getItem("doctors");
  
  if (storedDoctors) {
    try {
      const parsedDoctors = JSON.parse(storedDoctors).map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
      }));
      return parsedDoctors;
    } catch (error) {
      console.error("Error parsing doctors:", error);
    }
  }
  
  // If no stored doctors, save mock data
  localStorage.setItem("doctors", JSON.stringify(mockDoctors));
  return mockDoctors;
};

// Get a specific doctor by ID
export const getDoctorById = async (id: string): Promise<Doctor | null> => {
  const doctors = await getAllDoctors();
  return doctors.find(doctor => doctor.id === id) || null;
};

// Add a new doctor
export const addDoctor = async (doctorData: Omit<Doctor, "id" | "createdAt">): Promise<Doctor> => {
  const doctors = await getAllDoctors();
  
  const newDoctor: Doctor = {
    id: `doc-${nanoid(8)}`,
    ...doctorData,
    createdAt: new Date()
  };
  
  const updatedDoctors = [...doctors, newDoctor];
  localStorage.setItem("doctors", JSON.stringify(updatedDoctors));
  
  return newDoctor;
};

// Update an existing doctor
export const updateDoctor = async (id: string, doctorData: Partial<Doctor>): Promise<Doctor | null> => {
  const doctors = await getAllDoctors();
  const doctorIndex = doctors.findIndex(doctor => doctor.id === id);
  
  if (doctorIndex === -1) {
    return null;
  }
  
  const updatedDoctor = {
    ...doctors[doctorIndex],
    ...doctorData,
  };
  
  doctors[doctorIndex] = updatedDoctor;
  localStorage.setItem("doctors", JSON.stringify(doctors));
  
  return updatedDoctor;
};

// Delete a doctor
export const deleteDoctor = async (id: string): Promise<boolean> => {
  const doctors = await getAllDoctors();
  const filteredDoctors = doctors.filter(doctor => doctor.id !== id);
  
  if (filteredDoctors.length === doctors.length) {
    return false;
  }
  
  localStorage.setItem("doctors", JSON.stringify(filteredDoctors));
  return true;
};

// Get patients assigned to a specific doctor
export const getDoctorPatients = async (doctorId: string): Promise<Patient[]> => {
  // Get all patients
  const storedPatients = localStorage.getItem("patients");
  let patients: Patient[] = [];
  
  if (storedPatients) {
    try {
      patients = JSON.parse(storedPatients).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        lastVisitAt: p.lastVisitAt ? new Date(p.lastVisitAt) : undefined,
      }));
    } catch (error) {
      console.error("Error parsing patients:", error);
    }
  }
  
  // Get patient IDs assigned to the doctor
  const storedPatientsByDoctor = localStorage.getItem("patientsByDoctor");
  let patientsByDoctor = mockPatientsByDoctor;
  
  if (storedPatientsByDoctor) {
    try {
      patientsByDoctor = JSON.parse(storedPatientsByDoctor);
    } catch (error) {
      console.error("Error parsing patientsByDoctor:", error);
    }
  } else {
    localStorage.setItem("patientsByDoctor", JSON.stringify(mockPatientsByDoctor));
  }
  
  const patientIds = patientsByDoctor[doctorId] || [];
  
  // Filter patients by IDs
  return patients.filter(patient => patientIds.includes(patient.id));
};

// Get appointments for a specific doctor
export const getDoctorAppointments = async (doctorId: string): Promise<Appointment[]> => {
  // Get all appointments
  const storedAppointments = localStorage.getItem("appointments");
  let appointments: Appointment[] = [];
  
  if (storedAppointments) {
    try {
      appointments = JSON.parse(storedAppointments).map((a: any) => ({
        ...a,
        date: new Date(a.date),
        createdAt: new Date(a.createdAt),
        updatedAt: a.updatedAt ? new Date(a.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error("Error parsing appointments:", error);
    }
  }
  
  // Get appointment IDs for the doctor
  const storedAppointmentsByDoctor = localStorage.getItem("appointmentsByDoctor");
  let appointmentsByDoctor = mockAppointmentsByDoctor;
  
  if (storedAppointmentsByDoctor) {
    try {
      appointmentsByDoctor = JSON.parse(storedAppointmentsByDoctor);
    } catch (error) {
      console.error("Error parsing appointmentsByDoctor:", error);
    }
  } else {
    localStorage.setItem("appointmentsByDoctor", JSON.stringify(mockAppointmentsByDoctor));
  }
  
  const appointmentIds = appointmentsByDoctor[doctorId] || [];
  
  // Filter appointments by IDs
  return appointments.filter(appointment => appointmentIds.includes(appointment.id));
};

// Get statistics for a specific doctor
export const getDoctorStatistics = async (doctorId: string): Promise<DoctorStatistics> => {
  const patients = await getDoctorPatients(doctorId);
  const appointments = await getDoctorAppointments(doctorId);
  
  // Calculate statistics
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.lastVisitAt && new Date(p.lastVisitAt).getTime() > Date.now() - 180 * 24 * 60 * 60 * 1000).length;
  
  const appointmentsCompleted = appointments.filter(a => a.status === "Completada").length;
  const appointmentsScheduled = appointments.filter(a => a.status === "Programada" || a.status === "Pendiente").length;
  const appointmentsCancelled = appointments.filter(a => a.status === "Cancelada").length;
  
  // Generate monthly data for the past 6 months
  const consultationsByMonth = Array(6).fill(0).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    const year = date.getFullYear();
    const monthStr = `${month} ${year}`;
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const count = appointments.filter(a => {
      const appDate = new Date(a.date);
      return appDate >= monthStart && appDate <= monthEnd && a.status === "Completada";
    }).length;
    
    return { month: monthStr, count };
  });
  
  return {
    totalPatients,
    activePatients,
    appointmentsCompleted,
    appointmentsScheduled,
    appointmentsCancelled,
    consultationsByMonth,
    satisfactionRate: 92 // Mock data
  };
};

// Assign a patient to a doctor
export const assignPatientToDoctor = async (patientId: string, doctorId: string): Promise<boolean> => {
  const storedPatientsByDoctor = localStorage.getItem("patientsByDoctor");
  let patientsByDoctor = mockPatientsByDoctor;
  
  if (storedPatientsByDoctor) {
    try {
      patientsByDoctor = JSON.parse(storedPatientsByDoctor);
    } catch (error) {
      console.error("Error parsing patientsByDoctor:", error);
      return false;
    }
  }
  
  // Add patient to doctor's list
  if (!patientsByDoctor[doctorId]) {
    patientsByDoctor[doctorId] = [];
  }
  
  if (!patientsByDoctor[doctorId].includes(patientId)) {
    patientsByDoctor[doctorId].push(patientId);
  }
  
  localStorage.setItem("patientsByDoctor", JSON.stringify(patientsByDoctor));
  return true;
};

// Remove a patient from a doctor
export const removePatientFromDoctor = async (patientId: string, doctorId: string): Promise<boolean> => {
  const storedPatientsByDoctor = localStorage.getItem("patientsByDoctor");
  let patientsByDoctor: Record<string, string[]> = {};
  
  if (storedPatientsByDoctor) {
    try {
      patientsByDoctor = JSON.parse(storedPatientsByDoctor);
    } catch (error) {
      console.error("Error parsing patientsByDoctor:", error);
      return false;
    }
  } else {
    return false;
  }
  
  // Remove patient from doctor's list
  if (patientsByDoctor[doctorId]) {
    patientsByDoctor[doctorId] = patientsByDoctor[doctorId].filter(id => id !== patientId);
    localStorage.setItem("patientsByDoctor", JSON.stringify(patientsByDoctor));
    return true;
  }
  
  return false;
};
