
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, Download, FileText, Search, User, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Datos de ejemplo
const MOCK_HISTORY = [
  {
    id: "h1",
    patientId: "p1",
    patientName: "María Rodríguez",
    doctorId: "d1",
    doctorName: "Dr. Carlos Jiménez",
    date: "2025-05-01",
    time: "10:00",
    status: "completed",
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
    status: "completed",
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
    status: "cancelled",
    specialty: "Cardiología",
    notes: "El paciente canceló la cita.",
    recordingUrl: null,
    prescription: false,
    followUp: false,
  }
];

const SessionHistory = () => {
  const [sessions, setSessions] = useState(MOCK_HISTORY);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || session.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completada</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return null;
    }
  };
  
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="Sin historial"
        description="No hay registro de sesiones anteriores de telemedicina."
        icon={<Video size={48} className="text-gray-300" />}
        buttonText="Programar nueva sesión"
        onClick={() => navigate("/app/telemedicina?tab=new")}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por paciente, médico o especialidad" 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select 
          value={filterStatus} 
          onValueChange={setFilterStatus}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredSessions.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500">No se encontraron sesiones que coincidan con su búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id}>
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
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-gray-500" />
                      <span>Hora: {session.time}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">
                      <strong>Notas:</strong> {session.notes}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {session.recordingUrl && (
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Download size={14} />
                          Descargar grabación
                        </Button>
                      )}
                      {session.prescription && (
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <FileText size={14} />
                          Ver receta
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
