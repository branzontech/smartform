
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { BackButton } from "@/App";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  User, Calendar, Phone, Mail, MapPin, 
  FileText, Plus, ClipboardList 
} from "lucide-react";
import { Patient, MedicalConsultation, PatientWithConsultations } from "@/types/patient-types";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientWithConsultations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedPatients = localStorage.getItem("patients");
      const savedConsultations = localStorage.getItem("consultations");
      
      if (savedPatients) {
        try {
          const parsedPatients = JSON.parse(savedPatients);
          const foundPatient = parsedPatients.find((p: any) => p.id === id);
          
          if (foundPatient) {
            // Convertir fechas
            foundPatient.createdAt = new Date(foundPatient.createdAt);
            if (foundPatient.lastVisitAt) {
              foundPatient.lastVisitAt = new Date(foundPatient.lastVisitAt);
            }
            
            // Obtener consultas del paciente
            let consultations: MedicalConsultation[] = [];
            if (savedConsultations) {
              const parsedConsultations = JSON.parse(savedConsultations);
              consultations = parsedConsultations
                .filter((c: any) => c.patientId === id)
                .map((c: any) => ({
                  ...c,
                  consultationDate: new Date(c.consultationDate),
                  followUpDate: c.followUpDate ? new Date(c.followUpDate) : undefined
                }));
            }
            
            setPatient({ ...foundPatient, consultations });
          }
        } catch (error) {
          console.error("Error parsing patient data:", error);
        }
      }
      
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [id]);

  const handleCreateConsultation = () => {
    navigate(`/pacientes/nueva-consulta?patientId=${id}`);
  };

  // Calcular edad
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center w-full max-w-3xl">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6 mx-auto"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl mx-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <BackButton />
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Paciente no encontrado</h2>
            <p className="text-gray-500 mb-6">El paciente que estás buscando no existe o ha sido eliminado.</p>
            <Button 
              onClick={() => navigate("/pacientes")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Volver a la lista de pacientes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <BackButton />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold flex items-center">
              <User className="mr-2 text-purple-500" />
              {patient.name}
            </h1>
            <Button 
              onClick={handleCreateConsultation}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2" size={16} />
              Nueva consulta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Calendar size={18} className="mr-2 text-purple-500" />
              <span>
                Fecha de nacimiento: {format(new Date(patient.dateOfBirth), "d 'de' MMMM 'de' yyyy", { locale: es })} 
                ({calculateAge(patient.dateOfBirth)} años)
              </span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <ClipboardList size={18} className="mr-2 text-purple-500" />
              <span>Documento: {patient.documentId}</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Phone size={18} className="mr-2 text-purple-500" />
              <span>Teléfono: {patient.contactNumber}</span>
            </div>
            {patient.email && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Mail size={18} className="mr-2 text-purple-500" />
                <span>Email: {patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MapPin size={18} className="mr-2 text-purple-500" />
                <span>Dirección: {patient.address}</span>
              </div>
            )}
          </div>
        </div>

        <Tabs 
          defaultValue="info" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="consultations">
              Historial de consultas
              {patient.consultations.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs rounded-full">
                  {patient.consultations.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <FileText className="mr-2 text-purple-500" size={18} />
                  Información adicional
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Género: {patient.gender}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Registrado el: {format(patient.createdAt, "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                {patient.lastVisitAt && (
                  <p className="text-gray-600 dark:text-gray-300">
                    Última visita: {format(patient.lastVisitAt, "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="consultations" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {patient.consultations.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Sin consultas previas</h3>
                <p className="text-gray-500 mb-4">Este paciente no tiene consultas registradas.</p>
                <Button 
                  onClick={handleCreateConsultation}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2" size={16} />
                  Crear primera consulta
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {patient.consultations
                  .sort((a, b) => b.consultationDate.getTime() - a.consultationDate.getTime())
                  .map((consultation) => (
                    <div key={consultation.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">
                          Consulta del {format(consultation.consultationDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          consultation.status === 'Completada' ? 'bg-green-100 text-green-800' :
                          consultation.status === 'Programada' ? 'bg-blue-100 text-blue-800' :
                          consultation.status === 'En curso' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {consultation.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <strong>Motivo:</strong> {consultation.reason}
                      </p>
                      {consultation.diagnosis && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <strong>Diagnóstico:</strong> {consultation.diagnosis}
                        </p>
                      )}
                      {consultation.treatment && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <strong>Tratamiento:</strong> {consultation.treatment}
                        </p>
                      )}
                      {consultation.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <strong>Notas:</strong> {consultation.notes}
                        </p>
                      )}
                      {consultation.followUpDate && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Próximo seguimiento:</strong> {format(consultation.followUpDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientDetail;
