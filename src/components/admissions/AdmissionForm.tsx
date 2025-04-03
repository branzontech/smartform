
import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Patient } from "@/types/patient-types";
import { nanoid } from "nanoid";
import { toast } from "@/hooks/use-toast";
import { PatientForm, PatientFormValues } from "./PatientForm";
import { AdmissionDetailsForm, AdmissionFormValues } from "./AdmissionDetailsForm";
import { PatientSummary } from "./PatientSummary";

interface AdmissionFormProps {
  patient: Patient | null;
  isNewPatient: boolean;
  onBack: () => void;
}

export const AdmissionForm = ({ patient, isNewPatient, onBack }: AdmissionFormProps) => {
  const [step, setStep] = useState<"patient" | "admission">(isNewPatient ? "patient" : "admission");
  const [newPatientData, setNewPatientData] = useState<Patient | null>(null);
  
  const handlePatientSubmit = (data: PatientFormValues) => {
    // Create a new patient object with the form data
    const newPatient: Patient = {
      id: nanoid(),
      name: data.name,
      documentId: data.documentId,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      contactNumber: data.contactNumber,
      email: data.email || undefined,
      address: data.address || undefined,
      createdAt: new Date(),
    };
    
    setNewPatientData(newPatient);
    toast({
      title: "Paciente creado",
      description: "Los datos del paciente han sido guardados. Ahora puede continuar con la admisión.",
    });
    
    // Move to admission step
    setStep("admission");
  };

  const handleAdmissionSubmit = (data: AdmissionFormValues) => {
    // Combine patient data with admission data
    const finalPatient = newPatientData || patient;
    
    console.log("Patient data:", finalPatient);
    console.log("Admission data:", data);
    
    toast({
      title: "Admisión completada",
      description: isNewPatient 
        ? "Paciente creado y admisión registrada correctamente." 
        : "Admisión registrada correctamente.",
    });
  };

  // If creating a new patient, show patient form first
  if (isNewPatient && step === "patient") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Crear nuevo paciente</h2>
          <div className="flex items-center text-sm text-gray-500">
            <span className="bg-primary text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">1</span>
            <span>Datos del paciente</span>
            <ArrowRight size={16} className="mx-2" />
            <span className="bg-gray-200 text-gray-500 w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">2</span>
            <span>Datos de admisión</span>
          </div>
        </div>

        <PatientForm 
          patient={patient}
          onSubmit={handlePatientSubmit}
          onCancel={onBack}
        />
      </div>
    );
  }

  // Show admission form (for both new and existing patients)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {isNewPatient ? "Admisión para nuevo paciente" : "Admisión de paciente"}
        </h2>
        
        {isNewPatient && (
          <div className="flex items-center text-sm text-gray-500">
            <span className="bg-green-500 text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">✓</span>
            <span>Datos del paciente</span>
            <ArrowRight size={16} className="mx-2" />
            <span className="bg-primary text-white w-5 h-5 rounded-full inline-flex items-center justify-center mr-2">2</span>
            <span>Datos de admisión</span>
          </div>
        )}
      </div>

      <PatientSummary 
        patient={newPatientData || patient} 
        isNewPatient={isNewPatient} 
        onEdit={isNewPatient ? () => setStep("patient") : undefined}
      />

      <AdmissionDetailsForm 
        isNewPatient={isNewPatient}
        onBack={isNewPatient ? () => setStep("patient") : onBack}
        onSubmit={handleAdmissionSubmit}
      />
    </div>
  );
};

export default AdmissionForm;
