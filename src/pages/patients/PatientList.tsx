
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Plus, Users, Calendar, Eye } from "lucide-react";
import { Patient } from "@/types/patient-types";

// Datos de ejemplo
const mockPatients: Patient[] = [
  {
    id: "1",
    name: "Juan Pérez",
    documentId: "1234567890",
    dateOfBirth: "1985-05-15",
    gender: "Masculino",
    contactNumber: "555-123-4567",
    email: "juan.perez@example.com",
    createdAt: new Date("2023-01-10"),
    lastVisitAt: new Date("2023-06-20"),
  },
  {
    id: "2",
    name: "María García",
    documentId: "0987654321",
    dateOfBirth: "1990-08-20",
    gender: "Femenino",
    contactNumber: "555-987-6543",
    email: "maria.garcia@example.com",
    createdAt: new Date("2023-02-15"),
    lastVisitAt: new Date("2023-05-10"),
  },
  {
    id: "3",
    name: "Carlos Rodríguez",
    documentId: "5678901234",
    dateOfBirth: "1978-12-03",
    gender: "Masculino",
    contactNumber: "555-456-7890",
    address: "Calle Principal 123",
    createdAt: new Date("2023-03-05"),
  }
];

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedPatients = localStorage.getItem("patients");
      if (savedPatients) {
        try {
          const parsedPatients = JSON.parse(savedPatients).map((patient: any) => ({
            ...patient,
            createdAt: new Date(patient.createdAt),
            lastVisitAt: patient.lastVisitAt ? new Date(patient.lastVisitAt) : undefined,
          }));
          setPatients(parsedPatients);
        } catch (error) {
          console.error("Error parsing patients:", error);
          setPatients(mockPatients);
        }
      } else {
        setPatients(mockPatients);
        localStorage.setItem("patients", JSON.stringify(mockPatients));
      }
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleCreateConsultation = () => {
    navigate("/pacientes/nueva-consulta");
  };

  const handleViewPatient = (id: string) => {
    navigate(`/pacientes/${id}`);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.documentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6 mx-auto"></div>
            <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto px-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <BackButton />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="mr-2 text-purple-500" />
            Pacientes
          </h1>
          <Button 
            onClick={handleCreateConsultation} 
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2" size={16} />
            Nueva consulta
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o documento"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {filteredPatients.length === 0 ? (
          <EmptyState
            title="No hay pacientes registrados"
            description="Registra una nueva consulta para agregar pacientes."
            buttonText="Nueva consulta"
            onClick={handleCreateConsultation}
            icon={<Users size={48} className="text-gray-300" />}
          />
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div 
                key={patient.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{patient.name}</h3>
                    <p className="text-sm text-gray-500">Documento: {patient.documentId}</p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar size={14} className="mr-1" />
                      {patient.lastVisitAt 
                        ? `Última visita: ${format(patient.lastVisitAt, "d 'de' MMMM 'de' yyyy", { locale: es })}`
                        : "Sin consultas previas"}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewPatient(patient.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye size={14} />
                    Detalle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientList;
