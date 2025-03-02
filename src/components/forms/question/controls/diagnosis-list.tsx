
import { useState } from "react";
import { Search, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Diagnosis } from "../types";

interface DiagnosisListProps {
  diagnoses: Diagnosis[];
  selectedDiagnoses: Diagnosis[];
  onSelect: (diagnosis: Diagnosis) => void;
  onRemove: (id: string) => void;
}

export const DiagnosisList = ({ diagnoses, selectedDiagnoses, onSelect, onRemove }: DiagnosisListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredDiagnoses = diagnoses.filter(
    (diagnosis) => 
      diagnosis.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      diagnosis.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-4">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-form-primary focus:border-form-primary"
          placeholder="Buscar diagnóstico por código o nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {selectedDiagnoses.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Diagnósticos seleccionados:</h4>
          <div className="space-y-2">
            {selectedDiagnoses.map(diagnosis => (
              <div 
                key={diagnosis.id} 
                className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md"
              >
                <div>
                  <span className="font-medium text-blue-700">{diagnosis.code}</span>
                  <span className="mx-2">-</span>
                  <span>{diagnosis.name}</span>
                </div>
                <button
                  onClick={() => onRemove(diagnosis.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Minus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
        {filteredDiagnoses.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredDiagnoses.map(diagnosis => {
              const isSelected = selectedDiagnoses.some(d => d.id === diagnosis.id);
              return (
                <li 
                  key={diagnosis.id}
                  className={cn(
                    "px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50",
                    isSelected && "bg-blue-50"
                  )}
                  onClick={() => !isSelected && onSelect(diagnosis)}
                >
                  <div>
                    <span className="font-medium">{diagnosis.code}</span>
                    <span className="mx-2">-</span>
                    <span>{diagnosis.name}</span>
                  </div>
                  {isSelected && <Check size={16} className="text-blue-600" />}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No se encontraron diagnósticos" : "Lista de diagnósticos disponibles"}
          </div>
        )}
      </div>
    </div>
  );
};
