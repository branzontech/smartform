import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Clock, Pill, User, Calendar, Maximize2, Minimize2, Syringe, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Medication {
  id: string;
  medicationName: string;
  dose: string;
  administrationDate: string;
  administrationTime: string;
  route: string;
  status: 'pending' | 'administered' | 'missed';
  prescribedBy: string;
  notes?: string;
  frequency: string;
}

interface PatientMedicationPanelProps {
  patientId: string;
  className?: string;
}

// Mock data for patient medications
const mockMedications: { [key: string]: Medication[] } = {
  "1": [
    {
      id: "med-1",
      medicationName: "Paracetamol 500mg",
      dose: "1 tableta",
      administrationDate: "2024-01-19",
      administrationTime: "08:00",
      route: "Oral",
      status: "pending",
      prescribedBy: "Dr. García",
      notes: "Administrar con alimentos",
      frequency: "Cada 8 horas"
    },
    {
      id: "med-2",
      medicationName: "Ibuprofeno 400mg",
      dose: "1 tableta",
      administrationDate: "2024-01-19",
      administrationTime: "14:00",
      route: "Oral",
      status: "pending",
      prescribedBy: "Dr. García",
      notes: "Solo si hay dolor",
      frequency: "Cada 12 horas"
    },
    {
      id: "med-3",
      medicationName: "Omeprazol 20mg",
      dose: "1 cápsula",
      administrationDate: "2024-01-19",
      administrationTime: "07:30",
      route: "Oral",
      status: "administered",
      prescribedBy: "Dr. García",
      notes: "Administrado en ayunas",
      frequency: "Una vez al día"
    }
  ],
  "2": [
    {
      id: "med-4",
      medicationName: "Amoxicilina 500mg",
      dose: "1 cápsula",
      administrationDate: "2024-01-19",
      administrationTime: "09:00",
      route: "Oral",
      status: "pending",
      prescribedBy: "Dr. Martínez",
      frequency: "Cada 8 horas"
    },
    {
      id: "med-5",
      medicationName: "Salbutamol 100mcg",
      dose: "2 puffs",
      administrationDate: "2024-01-19",
      administrationTime: "12:00",
      route: "Inhalada",
      status: "administered",
      prescribedBy: "Dr. Martínez",
      frequency: "Según necesidad"
    }
  ],
  "3": [
    {
      id: "med-6",
      medicationName: "Metformina 850mg",
      dose: "1 tableta",
      administrationDate: "2024-01-19",
      administrationTime: "08:00",
      route: "Oral",
      status: "pending",
      prescribedBy: "Dr. Fernández",
      notes: "Con el desayuno",
      frequency: "Dos veces al día"
    },
    {
      id: "med-7",
      medicationName: "Enalapril 10mg",
      dose: "1 tableta",
      administrationDate: "2024-01-19",
      administrationTime: "20:00",
      route: "Oral",
      status: "pending",
      prescribedBy: "Dr. Fernández",
      frequency: "Una vez al día"
    },
    {
      id: "med-8",
      medicationName: "Insulina NPH",
      dose: "10 UI",
      administrationDate: "2024-01-19",
      administrationTime: "07:00",
      route: "Subcutánea",
      status: "administered",
      prescribedBy: "Dr. Fernández",
      notes: "Aplicada en abdomen",
      frequency: "Dos veces al día"
    }
  ]
};

export const PatientMedicationPanel: React.FC<PatientMedicationPanelProps> = ({ 
  patientId, 
  className = "" 
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const loadMedications = () => {
      setLoading(true);
      // Simular carga de datos
      setTimeout(() => {
        const patientMedications = mockMedications[patientId] || [];
        setMedications(patientMedications);
        setLoading(false);
      }, 300);
    };

    if (patientId) {
      loadMedications();
    }
  }, [patientId]);

  const getStatusColor = (status: 'pending' | 'administered' | 'missed') => {
    switch (status) {
      case 'administered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'missed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusText = (status: 'pending' | 'administered' | 'missed') => {
    switch (status) {
      case 'administered':
        return 'Administrado';
      case 'pending':
        return 'Pendiente';
      case 'missed':
        return 'No administrado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: 'pending' | 'administered' | 'missed') => {
    switch (status) {
      case 'administered':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'missed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getRouteIcon = (route: string) => {
    switch (route.toLowerCase()) {
      case 'subcutánea':
      case 'intramuscular':
      case 'intravenosa':
        return <Syringe className="w-3 h-3" />;
      default:
        return <Pill className="w-3 h-3" />;
    }
  };

  const handleAdminister = (medicationId: string) => {
    setMedications(prev => 
      prev.map(med => 
        med.id === medicationId 
          ? { ...med, status: 'administered' as const }
          : med
      )
    );
  };

  const pendingCount = medications.filter(med => med.status === 'pending').length;
  const administeredCount = medications.filter(med => med.status === 'administered').length;

  const PanelContent = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Pill className="w-5 h-5 mr-2 text-primary" />
            Administración de Medicamentos
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2"
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Paciente ID: {patientId}</p>
          <div className="flex gap-4 mt-1">
            <span className="text-yellow-600">Pendientes: {pendingCount}</span>
            <span className="text-green-600">Administrados: {administeredCount}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {medications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron medicamentos para este paciente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {medications.map((medication) => (
                <div key={medication.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">{medication.medicationName}</h4>
                      {getStatusIcon(medication.status)}
                    </div>
                    <Badge className={`text-xs ${getStatusColor(medication.status)}`}>
                      {getStatusText(medication.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center text-muted-foreground">
                        <span className="font-medium w-16">Dosis:</span>
                        <span>{medication.dose}</span>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span className="font-medium mr-2">Fecha:</span>
                        <span>{format(new Date(medication.administrationDate), "d MMM yyyy", { locale: es })}</span>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <span className="font-medium mr-2">Hora:</span>
                        <span>{medication.administrationTime}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-muted-foreground">
                        {getRouteIcon(medication.route)}
                        <span className="font-medium ml-1 mr-2">Vía:</span>
                        <span>{medication.route}</span>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground">
                        <User className="w-3 h-3 mr-1" />
                        <span className="font-medium mr-2">Médico:</span>
                        <span>{medication.prescribedBy}</span>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground">
                        <span className="font-medium mr-2">Frecuencia:</span>
                        <span>{medication.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {medication.notes && (
                    <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                      <span className="font-medium">Notas:</span> {medication.notes}
                    </div>
                  )}

                  {medication.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAdminister(medication.id)}
                        className="text-xs h-7"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Administrar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                      >
                        Posponer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                      >
                        No administrar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className={`h-full ${className}`}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Administración de Medicamentos</CardTitle>
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

  if (isFullScreen) {
    return (
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <div className="h-full p-6">
            <PanelContent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <PanelContent />
    </div>
  );
};

export default PatientMedicationPanel;