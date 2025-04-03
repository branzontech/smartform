
import React, { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/types/patient-types";
import { toast } from "@/hooks/use-toast";

// Datos de ejemplo (en una aplicación real estos vendrían de una API)
const MOCK_PATIENTS: Patient[] = [
  {
    id: "1",
    name: "Ana María Rodríguez",
    documentId: "12345678",
    dateOfBirth: "1985-06-15",
    gender: "Femenino",
    contactNumber: "555-1234",
    email: "ana.rodriguez@email.com",
    address: "Calle Principal 123",
    createdAt: new Date("2022-01-10"),
    lastVisitAt: new Date("2023-10-05"),
  },
  {
    id: "2",
    name: "Carlos Alberto Sánchez",
    documentId: "87654321",
    dateOfBirth: "1990-03-22",
    gender: "Masculino",
    contactNumber: "555-4321",
    email: "carlos.sanchez@email.com",
    address: "Avenida Central 456",
    createdAt: new Date("2022-02-15"),
    lastVisitAt: new Date("2023-11-12"),
  },
  {
    id: "3",
    name: "Luisa Fernanda Ortiz",
    documentId: "56781234",
    dateOfBirth: "1978-11-30",
    gender: "Femenino",
    contactNumber: "555-5678",
    email: "luisa.ortiz@email.com",
    address: "Plaza Mayor 789",
    createdAt: new Date("2022-03-20"),
    lastVisitAt: new Date("2023-09-28"),
  },
];

interface PatientSearchProps {
  onSelectPatient: (patient: Patient) => void;
  onCreateNew: () => void;
}

export const PatientSearch = ({ onSelectPatient, onCreateNew }: PatientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error de búsqueda",
        description: "Por favor ingrese un término de búsqueda",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    // Simulando una búsqueda con un retardo para imitar una llamada API
    setTimeout(() => {
      const results = MOCK_PATIENTS.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.documentId.includes(searchTerm)
      );
      
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "No se encontraron resultados",
          description: "No hay pacientes que coincidan con tu búsqueda",
        });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Buscar paciente</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Busca un paciente por nombre o número de documento para continuar con la admisión
            </p>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Nombre o número de documento"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="flex gap-2">
                <Search size={18} />
                <span>{isSearching ? "Buscando..." : "Buscar"}</span>
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Resultados de la búsqueda</h3>
              <div className="space-y-3">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => onSelectPatient(patient)}
                  >
                    <div>
                      <h4 className="font-medium">{patient.name}</h4>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <p>Documento: {patient.documentId}</p>
                        <p>Tel: {patient.contactNumber}</p>
                        {patient.lastVisitAt && (
                          <p>Última visita: {patient.lastVisitAt.toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline">Seleccionar</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                ¿No encuentras al paciente?
              </p>
              <Button onClick={onCreateNew} variant="outline" className="flex items-center gap-2">
                <UserPlus size={18} />
                Crear nuevo paciente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
