import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Admission {
  id: string;
  admissionNumber: string;
  entryNumber: string;
  date: string;
  time: string;
  status: 'A' | 'C';
  department: string;
  doctor: string;
}

interface PatientAdmissionHistoryPanelProps {
  patientId: string;
  className?: string;
}

// Mock data for patient admissions
const mockAdmissions: { [key: string]: Admission[] } = {
  "1": [
    {
      id: "1",
      admissionNumber: "ADM-2024-001",
      entryNumber: "ING-001",
      date: "2024-01-15",
      time: "14:30",
      status: "A",
      department: "Cardiología",
      doctor: "Dr. García"
    },
    {
      id: "2",
      admissionNumber: "ADM-2023-045",
      entryNumber: "ING-002",
      date: "2023-12-10",
      time: "09:15",
      status: "C",
      department: "Medicina General",
      doctor: "Dr. Rodríguez"
    },
    {
      id: "3",
      admissionNumber: "ADM-2023-032",
      entryNumber: "ING-003",
      date: "2023-11-05",
      time: "16:45",
      status: "C",
      department: "Neurología",
      doctor: "Dr. López"
    }
  ],
  "2": [
    {
      id: "4",
      admissionNumber: "ADM-2024-002",
      entryNumber: "ING-001",
      date: "2024-01-20",
      time: "11:00",
      status: "A",
      department: "Pediatría",
      doctor: "Dr. Martínez"
    },
    {
      id: "5",
      admissionNumber: "ADM-2023-055",
      entryNumber: "ING-002",
      date: "2023-12-15",
      time: "08:30",
      status: "C",
      department: "Pediatría",
      doctor: "Dr. Martínez"
    }
  ],
  "3": [
    {
      id: "6",
      admissionNumber: "ADM-2024-003",
      entryNumber: "ING-001",
      date: "2024-01-18",
      time: "13:20",
      status: "A",
      department: "Ginecología",
      doctor: "Dr. Fernández"
    },
    {
      id: "7",
      admissionNumber: "ADM-2023-078",
      entryNumber: "ING-002",
      date: "2023-12-08",
      time: "10:15",
      status: "C",
      department: "Medicina General",
      doctor: "Dr. Torres"
    },
    {
      id: "8",
      admissionNumber: "ADM-2023-065",
      entryNumber: "ING-003",
      date: "2023-11-22",
      time: "15:30",
      status: "C",
      department: "Ginecología",
      doctor: "Dr. Fernández"
    },
    {
      id: "9",
      admissionNumber: "ADM-2023-012",
      entryNumber: "ING-004",
      date: "2023-10-10",
      time: "09:45",
      status: "C",
      department: "Medicina General",
      doctor: "Dr. Torres"
    }
  ]
};

export const PatientAdmissionHistoryPanel: React.FC<PatientAdmissionHistoryPanelProps> = ({ 
  patientId, 
  className = "" 
}) => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmissions = () => {
      setLoading(true);
      // Simular carga de datos
      setTimeout(() => {
        const patientAdmissions = mockAdmissions[patientId] || [];
        setAdmissions(patientAdmissions);
        setLoading(false);
      }, 300);
    };

    if (patientId) {
      loadAdmissions();
    }
  }, [patientId]);

  const getStatusColor = (status: 'A' | 'C') => {
    return status === 'A' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  const getStatusText = (status: 'A' | 'C') => {
    return status === 'A' ? 'Abierto' : 'Cerrado';
  };

  const getTimelineDotColor = (status: 'A' | 'C') => {
    return status === 'A' ? 'bg-green-500' : 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className={`h-full ${className}`}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Historial de Ingresos</CardTitle>
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

  return (
    <div className={`h-full ${className}`}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Historial de Ingresos
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>Paciente ID: {patientId}</p>
            <p>Total de ingresos: {admissions.length}</p>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {admissions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron ingresos para este paciente</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                
                <div className="space-y-4">
                  {admissions.map((admission, index) => (
                    <div key={admission.id} className="relative flex items-start space-x-4">
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${getTimelineDotColor(admission.status)} flex-shrink-0`}>
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      </div>
                      
                      {/* Content card */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="border rounded-lg p-3 bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-sm">{admission.entryNumber}</h4>
                              <Badge className={`text-xs ${getStatusColor(admission.status)}`}>
                                {getStatusText(admission.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(admission.date + 'T' + admission.time), "d MMM yyyy - HH:mm", { locale: es })}
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center text-muted-foreground">
                              <span className="font-medium w-20">N° Admisión:</span>
                              <span>{admission.admissionNumber}</span>
                            </div>
                            
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="font-medium mr-2">Servicio:</span>
                              <span>{admission.department}</span>
                            </div>
                            
                            <div className="flex items-center text-muted-foreground">
                              <User className="w-3 h-3 mr-1" />
                              <span className="font-medium mr-2">Médico:</span>
                              <span>{admission.doctor}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientAdmissionHistoryPanel;