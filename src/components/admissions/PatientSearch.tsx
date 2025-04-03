
import React, { useState } from "react";
import { Search, UserPlus, Clock, Calendar, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/types/patient-types";
import { toast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";

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
  {
    id: "4",
    name: "Miguel Ángel Pérez",
    documentId: "23456789",
    dateOfBirth: "1992-08-14",
    gender: "Masculino",
    contactNumber: "555-9012",
    email: "miguel.perez@email.com",
    address: "Barrio Nuevo 234",
    createdAt: new Date("2022-04-05"),
    lastVisitAt: new Date("2023-12-15"),
  },
  {
    id: "5",
    name: "Elena González Ruiz",
    documentId: "45678901",
    dateOfBirth: "1983-03-07",
    gender: "Femenino",
    contactNumber: "555-2345",
    email: "elena.gonzalez@email.com",
    address: "Urbanización Los Pinos 567",
    createdAt: new Date("2022-05-12"),
    lastVisitAt: new Date("2023-11-20"),
  },
  {
    id: "6",
    name: "Javier Martínez López",
    documentId: "67890123",
    dateOfBirth: "1995-11-25",
    gender: "Masculino",
    contactNumber: "555-6789",
    email: "javier.martinez@email.com",
    address: "Colonia San José 890",
    createdAt: new Date("2022-06-18"),
    lastVisitAt: new Date("2023-10-30"),
  },
  {
    id: "7",
    name: "Sofía Ramírez Mendoza",
    documentId: "89012345",
    dateOfBirth: "1980-05-03",
    gender: "Femenino",
    contactNumber: "555-3456",
    email: "sofia.ramirez@email.com",
    address: "Residencial El Roble 123",
    createdAt: new Date("2022-07-22"),
    lastVisitAt: new Date("2023-09-15"),
  },
  {
    id: "8",
    name: "Diego Hernández García",
    documentId: "01234567",
    dateOfBirth: "1988-09-19",
    gender: "Masculino",
    contactNumber: "555-7890",
    email: "diego.hernandez@email.com",
    address: "Conjunto Las Flores 456",
    createdAt: new Date("2022-08-30"),
    lastVisitAt: new Date("2023-12-05"),
  },
  {
    id: "9",
    name: "Laura Castillo Morales",
    documentId: "34567890",
    dateOfBirth: "1991-06-12",
    gender: "Femenino",
    contactNumber: "555-4567",
    email: "laura.castillo@email.com",
    address: "Avenida del Parque 789",
    createdAt: new Date("2022-09-14"),
    lastVisitAt: new Date("2023-11-08"),
  },
  {
    id: "10",
    name: "Roberto Núñez Torres",
    documentId: "90123456",
    dateOfBirth: "1987-02-28",
    gender: "Masculino",
    contactNumber: "555-8901",
    email: "roberto.nunez@email.com",
    address: "Torre Residencial 567",
    createdAt: new Date("2022-10-05"),
    lastVisitAt: new Date("2023-10-22"),
  }
];

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
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <UserCheck size={20} className="text-purple-500" />
                Resultados de la búsqueda
              </h3>
              <div className="space-y-3">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => onSelectPatient(patient)}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-lg">{patient.name}</h4>
                        <Badge variant="success" className="text-xs">
                          <Clock size={12} className="mr-1" />
                          {formatDistance(patient.lastVisitAt || patient.createdAt, new Date(), { locale: es })}
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <p><strong>Documento:</strong> {patient.documentId}</p>
                        <p><strong>Tel:</strong> {patient.contactNumber}</p>
                        <p>
                          <Calendar size={14} className="inline-block mr-1" />
                          {patient.lastVisitAt 
                            ? `Última visita: ${patient.lastVisitAt.toLocaleDateString()}`
                            : "Sin visitas previas"}
                        </p>
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

export default PatientSearch;
