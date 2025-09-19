import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin } from 'lucide-react';

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

interface PatientAdmissionHistoryProps {
  patientId: string;
  children: React.ReactNode;
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

export const PatientAdmissionHistory: React.FC<PatientAdmissionHistoryProps> = ({ patientId, children }) => {
  const admissions = mockAdmissions[patientId] || [];

  const getStatusColor = (status: 'A' | 'C') => {
    return status === 'A' ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (status: 'A' | 'C') => {
    return status === 'A' ? 'Abierto' : 'Cerrado';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historial de Ingresos - Paciente #{patientId}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 pr-4">
          {admissions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No se encontraron ingresos para este paciente
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
              
              {admissions.map((admission, index) => (
                <div key={admission.id} className="relative flex items-start space-x-4 pb-6">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${getStatusColor(admission.status)}`}>
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium">{admission.entryNumber}</h4>
                        <Badge variant={admission.status === 'A' ? 'default' : 'secondary'}>
                          {getStatusText(admission.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {admission.date} - {admission.time}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-1">
                      <strong>N° Admisión:</strong> {admission.admissionNumber}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3 mr-1" />
                      {admission.department} - {admission.doctor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};