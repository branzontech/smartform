
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Search, 
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Datos de ejemplo
const mockAppointments = [
  {
    id: "1",
    date: new Date("2024-01-15"),
    time: "10:00",
    doctorName: "Dr. María González",
    specialty: "Cardiología",
    reason: "Control de rutina",
    status: "Confirmada" as const,
    location: "Consultorio 201, Clínica Central",
    notes: "Traer resultados de exámenes previos"
  },
  {
    id: "2",
    date: new Date("2024-01-20"),
    time: "14:30",
    doctorName: "Dr. Carlos Ramírez",
    specialty: "Medicina General",
    reason: "Consulta de seguimiento",
    status: "Programada" as const,
    location: "Consultorio 105, Clínica Norte",
    notes: "Control nutricional"
  },
  {
    id: "3",
    date: new Date("2024-01-05"),
    time: "09:00",
    doctorName: "Dr. Ana López",
    specialty: "Endocrinología",
    reason: "Primera consulta",
    status: "Completada" as const,
    location: "Consultorio 301, Clínica Sur",
    notes: "Evaluación inicial realizada"
  },
  {
    id: "4",
    date: new Date("2023-12-28"),
    time: "16:00",
    doctorName: "Dr. Pedro Martín",
    specialty: "Radiología",
    reason: "Radiografía de tórax",
    status: "Cancelada" as const,
    location: "Departamento de Radiología",
    notes: "Cancelada por el paciente"
  }
];

export const AppointmentsSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAppointments, setFilteredAppointments] = useState(mockAppointments);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, filterStatus);
  };

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (term: string, status: string) => {
    let filtered = mockAppointments;

    // Filtrar por término de búsqueda
    if (term !== "") {
      filtered = filtered.filter(
        appointment =>
          appointment.doctorName.toLowerCase().includes(term.toLowerCase()) ||
          appointment.specialty.toLowerCase().includes(term.toLowerCase()) ||
          appointment.reason.toLowerCase().includes(term.toLowerCase())
      );
    }

    // Filtrar por estado
    if (status !== "all") {
      filtered = filtered.filter(appointment => appointment.status === status);
    }

    setFilteredAppointments(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Confirmada":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Programada":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "Completada":
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      case "Cancelada":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmada":
        return <Badge variant="success">Confirmada</Badge>;
      case "Programada":
        return <Badge variant="info">Programada</Badge>;
      case "Completada":
        return <Badge variant="secondary">Completada</Badge>;
      case "Cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingAppointments = filteredAppointments.filter(
    appointment => appointment.date >= new Date() && appointment.status !== "Cancelada"
  );

  const pastAppointments = filteredAppointments.filter(
    appointment => appointment.date < new Date() || appointment.status === "Cancelada"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Citas
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona tus citas médicas programadas
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Solicitar Cita
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por médico, especialidad o motivo..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros por estado */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("all")}
            >
              Todas
            </Button>
            <Button
              variant={filterStatus === "Programada" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("Programada")}
            >
              Programadas
            </Button>
            <Button
              variant={filterStatus === "Confirmada" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("Confirmada")}
            >
              Confirmadas
            </Button>
            <Button
              variant={filterStatus === "Completada" ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter("Completada")}
            >
              Completadas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Próximas citas */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Próximas Citas
          </h3>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {appointment.reason}
                          </h4>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(appointment.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
                            <Clock className="h-4 w-4 ml-4" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{appointment.doctorName} - {appointment.specialty}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.location}</span>
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <strong>Nota:</strong> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contactar
                      </Button>
                      <Button variant="outline" size="sm">
                        Reprogramar
                      </Button>
                      <Button variant="destructive" size="sm">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Historial de citas */}
      {pastAppointments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Citas
          </h3>
          <div className="space-y-4">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow opacity-80">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {getStatusIcon(appointment.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {appointment.reason}
                        </h4>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(appointment.date, "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
                          <Clock className="h-4 w-4 ml-4" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{appointment.doctorName} - {appointment.specialty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.location}</span>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Nota:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredAppointments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? "No se encontraron citas" : "No tienes citas programadas"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm 
                ? `No hay citas que coincidan con tu búsqueda "${searchTerm}"`
                : "Solicita tu primera cita médica"
              }
            </p>
            {!searchTerm && (
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Solicitar Primera Cita
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
