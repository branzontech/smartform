
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, User, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Datos de ejemplo - en una implementación real estos vendrían de una API o base de datos
const MOCK_SESSIONS = [
  {
    id: "1",
    patientId: "p1",
    patientName: "María Rodríguez",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-05-15",
    time: "10:00",
    status: "scheduled",
    specialty: "Cardiología",
    notes: "Revisión post operatoria",
  },
  {
    id: "2",
    patientId: "p2",
    patientName: "Juan Pérez",
    doctorId: "d2",
    doctorName: "Dra. Ana Martínez",
    date: "2025-05-13",
    time: "15:30",
    status: "ready",
    specialty: "Dermatología",
    notes: "Revisión de exámenes",
  },
  {
    id: "3",
    patientId: "p3",
    patientName: "Pedro López",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-05-14",
    time: "09:15",
    status: "scheduled",
    specialty: "Cardiología",
    notes: "Primera consulta",
  }
];

const UpcomingSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  
  const handleJoinSession = (sessionId: string) => {
    // Utilizamos useNavigate con un objeto de opciones con replace: true para evitar recargas
    navigate(`/app/telemedicina?sessionId=${sessionId}`, { replace: true });
  };
  
  const handleCancelSession = (sessionId: string) => {
    // En una implementación real, esto sería una llamada a la API
    setSessions(sessions.filter(session => session.id !== sessionId));
    toast({
      title: "Sesión cancelada",
      description: "La sesión de telemedicina ha sido cancelada",
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-500">Listo para conectar</Badge>;
      case "scheduled":
        return <Badge variant="outline">Programada</Badge>;
      default:
        return null;
    }
  };
  
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No hay próximas sesiones"
        description="No tienes sesiones de telemedicina programadas actualmente."
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
          <CardFooter className="flex justify-end gap-2 bg-gray-50 dark:bg-gray-800">
            <Button
              variant="outline"
              onClick={() => handleCancelSession(session.id)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => handleJoinSession(session.id)}
              disabled={session.status !== "ready"}
            >
              {session.status === "ready" ? "Unirse ahora" : "Unirse en horario programado"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default UpcomingSessions;
