
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Plus, Users, Calendar, Eye, FileText } from "lucide-react";
import { Patient } from "@/types/patient-types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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

// Generar más pacientes de prueba para demostrar la carga infinita
const generateMoreMockPatients = (startId: number, count: number): Patient[] => {
  const result: Patient[] = [];
  const names = ["Ana Martínez", "Luis Rodríguez", "Elena Santos", "Pedro Gómez", "Carmen López", "Miguel Torres", "Isabel Ramírez", "José García", "Laura Fernández", "Pablo Ruiz"];
  
  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const randomIndex = Math.floor(Math.random() * names.length);
    const hasLastVisit = Math.random() > 0.3;
    
    result.push({
      id: id.toString(),
      name: names[randomIndex],
      documentId: Math.floor(10000000 + Math.random() * 90000000).toString(),
      dateOfBirth: `198${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      gender: Math.random() > 0.5 ? "Masculino" : "Femenino",
      contactNumber: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      email: `paciente${id}@example.com`,
      createdAt: new Date(Date.now() - Math.random() * 10000000000),
      lastVisitAt: hasLastVisit ? new Date(Date.now() - Math.random() * 5000000000) : undefined
    });
  }
  
  return result;
};

// Agregar pacientes adicionales al mock
const extendedMockPatients = [...mockPatients, ...generateMoreMockPatients(mockPatients.length + 1, 30)];

const ITEMS_PER_PAGE = 10;

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [displayedPatients, setDisplayedPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);
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
          setPatients(extendedMockPatients);
          localStorage.setItem("patients", JSON.stringify(extendedMockPatients));
        }
      } else {
        setPatients(extendedMockPatients);
        localStorage.setItem("patients", JSON.stringify(extendedMockPatients));
      }
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.documentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cargar pacientes iniciales
  useEffect(() => {
    if (!loading && filteredPatients.length > 0) {
      setDisplayedPatients(filteredPatients.slice(0, ITEMS_PER_PAGE));
      setPage(1);
    }
  }, [loading, filteredPatients, searchTerm]);

  // Configurar el observador de intersección para la carga infinita
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry?.isIntersecting && !loadingMore && displayedPatients.length < filteredPatients.length) {
      setLoadingMore(true);
    }
  }, [loadingMore, displayedPatients.length, filteredPatients.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 0.1
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  // Cargar más pacientes cuando se activa el observador
  useEffect(() => {
    if (loadingMore && displayedPatients.length < filteredPatients.length) {
      setTimeout(() => {
        const nextPage = page + 1;
        const nextBatch = filteredPatients.slice(0, nextPage * ITEMS_PER_PAGE);
        setDisplayedPatients(nextBatch);
        setPage(nextPage);
        setLoadingMore(false);
      }, 500); // Simular tiempo de carga
    }
  }, [loadingMore, page, filteredPatients, displayedPatients.length]);

  const handleCreateConsultation = () => {
    navigate("/pacientes/nueva-consulta");
  };

  const handleViewPatient = (id: string) => {
    navigate(`/pacientes/${id}`);
  };

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
          <ScrollArea className="h-[calc(100vh-260px)]">
            <div className="space-y-4 pr-2">
              {displayedPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="bg-blue-50/70 hover:bg-blue-50 dark:bg-gray-800/80 dark:hover:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-all duration-200 border-l-4 border-purple-200"
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
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewPatient(patient.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Detalle
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/pacientes/${patient.id}?tab=consultations`)}
                        className="flex items-center gap-1"
                      >
                        <FileText size={14} />
                        Historial
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {/* Loader for more items */}
              {loadingMore && (
                <div className="py-2">
                  <div className="flex justify-center">
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              )}
              
              {/* Intersection observer target */}
              {displayedPatients.length < filteredPatients.length && (
                <div ref={observerTarget} className="h-10" />
              )}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
};

export default PatientList;
