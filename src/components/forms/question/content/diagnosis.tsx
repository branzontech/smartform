
import React, { useState } from "react";
import { ContentComponentProps } from "../types";
import { DiagnosisList } from "../controls/diagnosis-list";
import { Diagnosis } from "../types";

// Datos de ejemplo para diagnósticos
const predefinedDiagnoses: Diagnosis[] = [
  { id: "1", code: "E11", name: "Diabetes tipo 2" },
  { id: "2", code: "I10", name: "Hipertensión esencial (primaria)" },
  { id: "3", code: "J45", name: "Asma" },
  { id: "4", code: "K29.7", name: "Gastritis, no especificada" },
  { id: "5", code: "M54.5", name: "Dolor lumbar" },
  { id: "6", code: "G43", name: "Migraña" },
  { id: "7", code: "F41.1", name: "Trastorno de ansiedad generalizada" },
  { id: "8", code: "F32", name: "Episodio depresivo" },
  { id: "9", code: "J03", name: "Amigdalitis aguda" },
  { id: "10", code: "B01", name: "Varicela" },
  { id: "11", code: "A09", name: "Diarrea y gastroenteritis de presunto origen infeccioso" },
  { id: "12", code: "N39.0", name: "Infección de vías urinarias, sitio no especificado" },
  { id: "13", code: "H10", name: "Conjuntivitis" },
  { id: "14", code: "J01", name: "Sinusitis aguda" },
  { id: "15", code: "L20", name: "Dermatitis atópica" }
];

export const DiagnosisComponent: React.FC<ContentComponentProps> = ({ 
  question, 
  onUpdate, 
  readOnly 
}) => {
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Diagnosis[]>(question.diagnoses || []);

  const handleDiagnosisSelect = (diagnosis: Diagnosis) => {
    const newSelectedDiagnoses = [...selectedDiagnoses, diagnosis];
    setSelectedDiagnoses(newSelectedDiagnoses);
    onUpdate({ diagnoses: newSelectedDiagnoses });
  };

  const handleDiagnosisRemove = (id: string) => {
    const newSelectedDiagnoses = selectedDiagnoses.filter(d => d.id !== id);
    setSelectedDiagnoses(newSelectedDiagnoses);
    onUpdate({ diagnoses: newSelectedDiagnoses });
  };

  if (readOnly) {
    return (
      <div className="border border-gray-300 rounded-md p-2">
        {selectedDiagnoses.length > 0 ? (
          <div className="space-y-2">
            {selectedDiagnoses.map(diagnosis => (
              <div key={diagnosis.id} className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md">
                <span className="font-medium text-blue-700">{diagnosis.code}</span>
                <span>-</span>
                <span>{diagnosis.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center p-2">
            No se han seleccionado diagnósticos
          </div>
        )}
      </div>
    );
  }

  return (
    <DiagnosisList 
      diagnoses={predefinedDiagnoses}
      selectedDiagnoses={selectedDiagnoses}
      onSelect={handleDiagnosisSelect}
      onRemove={handleDiagnosisRemove}
    />
  );
};
