import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, FileText, Pill, Activity, TestTube, Heart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Patient, MedicalConsultation } from "@/types/patient-types";

interface PatientHistoryPanelProps {
  patientId: string;
  className?: string;
}

interface HistoricalData {
  plans: HistoricalPlan[];
  prescriptions: HistoricalPrescription[];
  physicalExams: HistoricalPhysicalExam[];
  labResults: HistoricalLabResult[];
  diagnoses: HistoricalDiagnosis[];
}

interface HistoricalPlan {
  id: string;
  date: Date;
  plan: string;
  consultationId: string;
  notes?: string;
}

interface HistoricalPrescription {
  id: string;
  date: Date;
  medication: string;
  dosage: string;
  duration: string;
  consultationId: string;
  instructions?: string;
}

interface HistoricalPhysicalExam {
  id: string;
  date: Date;
  findings: string;
  consultationId: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
  };
}

interface HistoricalLabResult {
  id: string;
  date: Date;
  testName: string;
  result: string;
  referenceRange?: string;
  consultationId: string;
  status: 'Normal' | 'Anormal' | 'Pendiente';
}

interface HistoricalDiagnosis {
  id: string;
  date: Date;
  diagnosis: string;
  consultationId: string;
  type: 'Principal' | 'Secundario';
  status: 'Activo' | 'Resuelto';
}

export const PatientHistoryPanel: React.FC<PatientHistoryPanelProps> = ({ 
  patientId, 
  className = "" 
}) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<MedicalConsultation[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    plans: [],
    prescriptions: [],
    physicalExams: [],
    labResults: [],
    diagnoses: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("PatientHistoryPanel - patientId received:", patientId);
    
    const loadPatientData = () => {
      try {
        // Cargar paciente
        const savedPatients = localStorage.getItem("patients");
        if (savedPatients) {
          const patients = JSON.parse(savedPatients);
          const foundPatient = patients.find((p: Patient) => p.id === patientId);
          setPatient(foundPatient || null);
        }

        // Cargar consultas del paciente
        const savedConsultations = localStorage.getItem("consultations");
        if (savedConsultations) {
          const allConsultations = JSON.parse(savedConsultations);
          const patientConsultations = allConsultations
            .filter((consultation: MedicalConsultation) => consultation.patientId === patientId)
            .sort((a: MedicalConsultation, b: MedicalConsultation) => 
              new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime()
            );
          setConsultations(patientConsultations);
        }

        // Simular datos históricos (en una implementación real, estos vendrían de la base de datos)
        generateMockHistoricalData(patientId);
        
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const generateMockHistoricalData = (patientId: string) => {
    // Generar datos de ejemplo basados en las consultas existentes
    const mockData: HistoricalData = {
      plans: [
        {
          id: "plan-1",
          date: new Date(2024, 0, 15),
          plan: "Control en 2 semanas para evaluar evolución",
          consultationId: "consultation-1",
          notes: "Paciente responde bien al tratamiento inicial"
        },
        {
          id: "plan-2", 
          date: new Date(2024, 0, 1),
          plan: "Iniciar tratamiento conservador con fisioterapia",
          consultationId: "consultation-2"
        }
      ],
      prescriptions: [
        {
          id: "rx-1",
          date: new Date(2024, 0, 15),
          medication: "Ibuprofeno 400mg",
          dosage: "1 tableta cada 8 horas",
          duration: "7 días",
          consultationId: "consultation-1",
          instructions: "Tomar con alimentos"
        },
        {
          id: "rx-2",
          date: new Date(2024, 0, 1),
          medication: "Paracetamol 500mg",
          dosage: "1 tableta cada 6 horas",
          duration: "5 días",
          consultationId: "consultation-2",
          instructions: "Solo si hay dolor"
        }
      ],
      physicalExams: [
        {
          id: "exam-1",
          date: new Date(2024, 0, 15),
          findings: "Paciente consciente, orientado. Abdomen blando, no doloroso.",
          consultationId: "consultation-1",
          vitalSigns: {
            bloodPressure: "120/80 mmHg",
            heartRate: "72 lpm",
            temperature: "36.5°C",
            weight: "70 kg",
            height: "170 cm"
          }
        }
      ],
      labResults: [
        {
          id: "lab-1",
          date: new Date(2024, 0, 10),
          testName: "Hemograma completo",
          result: "Valores normales",
          referenceRange: "Normal",
          consultationId: "consultation-1",
          status: "Normal"
        },
        {
          id: "lab-2",
          date: new Date(2024, 0, 10),
          testName: "Glucosa en ayunas",
          result: "95 mg/dL",
          referenceRange: "70-100 mg/dL",
          consultationId: "consultation-1",
          status: "Normal"
        }
      ],
      diagnoses: [
        {
          id: "dx-1",
          date: new Date(2024, 0, 15),
          diagnosis: "Gastritis aguda",
          consultationId: "consultation-1",
          type: "Principal",
          status: "Activo"
        },
        {
          id: "dx-2",
          date: new Date(2024, 0, 1),
          diagnosis: "Cefalea tensional",
          consultationId: "consultation-2",
          type: "Principal",
          status: "Resuelto"
        }
      ]
    };

    setHistoricalData(mockData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
      case 'Resuelto':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Anormal':
      case 'Activo':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className={`h-full ${className}`}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Antecedentes del Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={`h-full ${className}`}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Antecedentes del Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No se encontraron datos del paciente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Heart className="w-5 h-5 mr-2 text-primary" />
            Antecedentes - {patient.name}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>ID: {patient.documentId}</p>
            <p>Última visita: {patient.lastVisitAt ? format(new Date(patient.lastVisitAt), "d 'de' MMMM 'de' yyyy", { locale: es }) : "Sin visitas"}</p>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="diagnoses" className="h-full flex flex-col">
            <TabsList className="flex w-full h-auto p-1 mb-4 overflow-x-auto">
              <TabsTrigger value="diagnoses" className="flex-shrink-0 px-2 py-1 text-xs min-w-fit">
                <FileText className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Diagnósticos</span>
                <span className="sm:hidden">Dx</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex-shrink-0 px-2 py-1 text-xs min-w-fit">
                <CalendarIcon className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Planes</span>
                <span className="sm:hidden">Pl</span>
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex-shrink-0 px-2 py-1 text-xs min-w-fit">
                <Pill className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Recetas</span>
                <span className="sm:hidden">Rx</span>
              </TabsTrigger>
              <TabsTrigger value="physicalExams" className="flex-shrink-0 px-2 py-1 text-xs min-w-fit">
                <Activity className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Ex. Físico</span>
                <span className="sm:hidden">Ex</span>
              </TabsTrigger>
              <TabsTrigger value="labResults" className="flex-shrink-0 px-2 py-1 text-xs min-w-fit">
                <TestTube className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Laboratorios</span>
                <span className="sm:hidden">Lab</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="diagnoses" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {historicalData.diagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{diagnosis.diagnosis}</h4>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {diagnosis.type}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(diagnosis.status)}`}>
                              {diagnosis.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(diagnosis.date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="plans" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {historicalData.plans.map((plan) => (
                      <div key={plan.id} className="border rounded-lg p-3 bg-card">
                        <p className="font-medium text-sm mb-2">{plan.plan}</p>
                        {plan.notes && (
                          <p className="text-xs text-muted-foreground mb-2">{plan.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(plan.date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="prescriptions" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {historicalData.prescriptions.map((prescription) => (
                      <div key={prescription.id} className="border rounded-lg p-3 bg-card">
                        <h4 className="font-medium text-sm mb-1">{prescription.medication}</h4>
                        <p className="text-xs mb-1">
                          <span className="font-medium">Dosis:</span> {prescription.dosage}
                        </p>
                        <p className="text-xs mb-1">
                          <span className="font-medium">Duración:</span> {prescription.duration}
                        </p>
                        {prescription.instructions && (
                          <p className="text-xs text-muted-foreground mb-2">
                            <span className="font-medium">Instrucciones:</span> {prescription.instructions}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(prescription.date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="physicalExams" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {historicalData.physicalExams.map((exam) => (
                      <div key={exam.id} className="border rounded-lg p-3 bg-card">
                        <h4 className="font-medium text-sm mb-2">Hallazgos</h4>
                        <p className="text-xs mb-3">{exam.findings}</p>
                        
                        {exam.vitalSigns && (
                          <div className="mb-3">
                            <h5 className="font-medium text-xs mb-2">Signos Vitales</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {exam.vitalSigns.bloodPressure && (
                                <div>
                                  <span className="font-medium">PA:</span> {exam.vitalSigns.bloodPressure}
                                </div>
                              )}
                              {exam.vitalSigns.heartRate && (
                                <div>
                                  <span className="font-medium">FC:</span> {exam.vitalSigns.heartRate}
                                </div>
                              )}
                              {exam.vitalSigns.temperature && (
                                <div>
                                  <span className="font-medium">T°:</span> {exam.vitalSigns.temperature}
                                </div>
                              )}
                              {exam.vitalSigns.weight && (
                                <div>
                                  <span className="font-medium">Peso:</span> {exam.vitalSigns.weight}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          {format(exam.date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="labResults" className="h-full mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {historicalData.labResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{result.testName}</h4>
                          <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                            {result.status}
                          </Badge>
                        </div>
                        <p className="text-xs mb-1">
                          <span className="font-medium">Resultado:</span> {result.result}
                        </p>
                        {result.referenceRange && (
                          <p className="text-xs text-muted-foreground mb-2">
                            <span className="font-medium">Rango:</span> {result.referenceRange}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(result.date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientHistoryPanel;