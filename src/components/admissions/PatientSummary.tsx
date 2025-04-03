
import React from "react";
import { Button } from "@/components/ui/button";
import { Patient } from "@/types/patient-types";

interface PatientSummaryProps {
  patient: Patient | null;
  isNewPatient: boolean;
  onEdit?: () => void;
}

export const PatientSummary = ({ 
  patient, 
  isNewPatient, 
  onEdit 
}: PatientSummaryProps) => {
  if (!patient) return null;
  
  return (
    <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Datos del paciente</h3>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <p className="font-medium text-base">
            {patient.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {patient.documentId} • {patient.contactNumber}
          </p>
        </div>
        {isNewPatient && onEdit && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm"

            onClick={onEdit}
            className="text-xs"
          >
            Editar información
          </Button>
        )}
      </div>
    </div>
  );
};

export default PatientSummary;
