
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Download, FileText, User, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TelemedicineSession } from "@/types/telemedicine-types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Datos de ejemplo - en una implementación real estos vendrían de una API
const MOCK_HISTORY: TelemedicineSession[] = [
  {
    id: "h1",
    patientId: "p1",
    patientName: "María Rodríguez",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-05-01",
    time: "10:00",
    status: "completed", // Explicitly using the correct literal type
    specialty: "Cardiología",
    notes: "Paciente presenta mejora significativa en la presión arterial.",
    recordingUrl: "/recordings/session-h1.mp4",
    prescription: true,
    followUp: true,
  },
  {
    id: "h2",
    patientId: "p2",
    patientName: "Juan Pérez",
    doctorId: "d2",
    doctorName: "Dra. Ana Martínez",
    date: "2025-04-25",
    time: "15:30",
    status: "completed", // Explicitly using the correct literal type
    specialty: "Dermatología",
    notes: "Se recomienda continuar tratamiento por 2 semanas más.",
    recordingUrl: "/recordings/session-h2.mp4",
    prescription: true,
    followUp: false,
  },
  {
    id: "h3",
    patientId: "p3",
    patientName: "Pedro López",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-04-20",
    time: "09:15",
    status: "cancelled", // Explicitly using the correct literal type
    specialty: "Cardiología",
    notes: "El paciente canceló la cita.",
    recordingUrl: null,
    prescription: false,
    followUp: false,
  }
];

const SessionHistory = () => {
  const navigate = useNavigate();
  const [sessions] = useState<TelemedicineSession[]>(MOCK_HISTORY);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completada</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return null;
    }
  };
  
  const handleViewRecording = (session: TelemedicineSession) => {
    if (session.recordingUrl) {
      toast({
        title: "Grabación disponible",
        description: "Iniciando reproducción de la grabación",
      });
      // En una implementación real, esto lanzaría un reproductor de video
      console.log("Ver grabación de sesión:", session.id);
    }
  };
  
  const handleViewPrescription = (sessionId: string) => {
    // En una implementación real, esto cargaría un documento
    toast({
      title: "Receta disponible",
      description: "Abriendo documento de receta médica",
    });
    console.log("Ver receta de sesión:", sessionId);
  };
  
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No hay sesiones previas"
        description="Aún no ha realizado ninguna sesión de telemedicina."
        icon={<Video size={48} className="text-gray-300" />}
        buttonText="Programar nueva sesión"
        onClick={() => navigate("/app/telemedicina?tab=new", { replace: true })}
      />
    );
  }
  
  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">{session.doctorName}</CardTitle>
              <p className="text-sm text-purple-600">{session.specialty}</p>
            </div>
            {getStatusBadge(session.status)}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-500" />
                  <span>Paciente: {session.patientName}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span>Fecha: {new Date(session.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" />
                  <span>Hora: {session.time}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-600">
                  <strong>Notas:</strong> {session.notes}
                </p>
              </div>
            </div>
          </CardContent>
          {session.status === "completed" && (
            <CardFooter className="flex justify-end gap-2 bg-gray-50 dark:bg-gray-800">
              {session.recordingUrl && (
                <Button
                  variant="outline"
                  onClick={() => handleViewRecording(session)}
                >
                  <Video className="mr-2" size={16} />
                  Ver grabación
                </Button>
              )}
              {session.prescription && (
                <Button
                  variant="outline"
                  onClick={() => handleViewPrescription(session.id)}
                >
                  <FileText className="mr-2" size={16} />
                  Ver receta
                </Button>
              )}
              <Button variant="outline">
                <Download className="mr-2" size={16} />
                Descargar informe
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};

export default SessionHistory;
