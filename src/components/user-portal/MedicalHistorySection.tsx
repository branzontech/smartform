
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  Calendar,
  User,
  Stethoscope,
  Pill,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Datos de ejemplo
const mockMedicalHistory = [
  {
    id: "1",
    date: new Date("2024-01-10"),
    doctorName: "Dr. María González",
    specialty: "Cardiología",
    diagnosis: "Hipertensión arterial leve",
    treatment: "Cambios en el estilo de vida, medicación antihipertensiva",
    notes: "Paciente responde bien al tratamiento. Control en 3 meses.",
    prescriptions: [
      {
        medication: "Enalapril 10mg",
        dosage: "10mg",
        frequency: "1 vez al día",
        duration: "3 meses"
      }
    ]
  },
  {
    id: "2",
    date: new Date("2023-12-15"),
    doctorName: "Dr. Ana López",
    specialty: "Medicina General",
    diagnosis: "Revisión anual",
    treatment: "Mantener hábitos saludables",
    notes: "Exámenes de rutina dentro de parámetros normales.",
    prescriptions: []
  },
  {
    id: "3",
    date: new Date("2023-11-20"),
    doctorName: "Dr. Carlos Ramírez",
    specialty: "Endocrinología",
    diagnosis: "Prediabetes",
    treatment: "Dieta controlada, ejercicio regular",
    notes: "Seguimiento nutricional necesario. Control en 6 meses.",
    prescriptions: [
      {
        medication: "Metformina 500mg",
        dosage: "500mg",
        frequency: "2 veces al día",
        duration: "6 meses"
      }
    ]
  }
];

export const MedicalHistorySection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredHistory, setFilteredHistory] = useState(mockMedicalHistory);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term === "") {
      setFilteredHistory(mockMedicalHistory);
    } else {
      const filtered = mockMedicalHistory.filter(
        record =>
          record.doctorName.toLowerCase().includes(term.toLowerCase()) ||
          record.specialty.toLowerCase().includes(term.toLowerCase()) ||
          record.diagnosis.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mi Historial Médico
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Consulta tus registros médicos y tratamientos
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por médico, especialidad o diagnóstico..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de registros médicos */}
      <div className="space-y-4">
        {filteredHistory.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{record.diagnosis}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(record.date, "dd 'de' MMMM, yyyy", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {record.doctorName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {record.specialty}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Tratamiento */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-green-600" />
                  Tratamiento
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {record.treatment}
                </p>
              </div>

              {/* Prescripciones */}
              {record.prescriptions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-purple-600" />
                    Prescripciones
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {record.prescriptions.map((prescription, index) => (
                      <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                        <p className="font-medium text-purple-900 dark:text-purple-100">
                          {prescription.medication}
                        </p>
                        <div className="text-xs text-purple-700 dark:text-purple-300 mt-1 space-y-1">
                          <p>Dosis: {prescription.dosage}</p>
                          <p>Frecuencia: {prescription.frequency}</p>
                          <p>Duración: {prescription.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {record.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Notas del médico
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    {record.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHistory.length === 0 && searchTerm && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron registros
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No hay registros que coincidan con tu búsqueda "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
