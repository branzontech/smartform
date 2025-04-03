
import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { BackButton } from "@/App";
import { PatientSearch } from "@/components/admissions/PatientSearch";
import { AdmissionForm } from "@/components/admissions/AdmissionForm";
import { Patient } from "@/types/patient-types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AdmissionPage = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsCreatingPatient(false);
    setShowAdmissionForm(true);
  };

  const handleCreateNewPatient = () => {
    setIsCreatingPatient(true);
    setSelectedPatient(null);
    setShowAdmissionForm(true);
  };

  const handleBackToSearch = () => {
    setShowAdmissionForm(false);
    setSelectedPatient(null);
    setIsCreatingPatient(false);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <BackButton />
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Admisión de pacientes
        </h1>
        
        {!showAdmissionForm ? (
          <>
            <PatientSearch 
              onSelectPatient={handlePatientSelect}
              onCreateNew={handleCreateNewPatient}
            />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToSearch}
                className="p-0 h-auto hover:bg-transparent"
              >
                <ArrowLeft size={20} className="text-gray-500" />
                <span className="ml-1">Volver a la búsqueda</span>
              </Button>
            </div>
            
            <AdmissionForm 
              patient={selectedPatient} 
              isNewPatient={isCreatingPatient}
              onBack={handleBackToSearch}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdmissionPage;
