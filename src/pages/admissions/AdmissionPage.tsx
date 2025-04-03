
import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { BackButton } from "@/App";
import { PatientSearch } from "@/components/admissions/PatientSearch";
import { AdmissionForm } from "@/components/admissions/AdmissionForm";
import { Patient } from "@/types/patient-types";

const AdmissionPage = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsCreatingPatient(false);
  };

  const handleCreateNewPatient = () => {
    setIsCreatingPatient(true);
    setSelectedPatient(null);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <BackButton />
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Admisión de pacientes
        </h1>
        
        {!selectedPatient && !isCreatingPatient ? (
          <PatientSearch 
            onSelectPatient={handlePatientSelect}
            onCreateNew={handleCreateNewPatient}
          />
        ) : (
          <AdmissionForm 
            patient={selectedPatient} 
            isNewPatient={isCreatingPatient}
            onBack={() => {
              setSelectedPatient(null);
              setIsCreatingPatient(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default AdmissionPage;
