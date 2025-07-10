
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
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Datos de ejemplo
const mockTestResults = [
  {
    id: "1",
    testName: "Hemograma Completo",
    date: new Date("2024-01-10"),
    requestedBy: "Dr. María González",
    status: "Completado" as const,
    results: [
      {
        parameter: "Hemoglobina",
        value: "14.2",
        referenceRange: "12.0-15.5 g/dL",
        status: "Normal" as const
      },
      {
        parameter: "Leucocitos",
        value: "7.2",
        referenceRange: "4.0-10.0 x10³/µL",
        status: "Normal" as const
      },
      {
        parameter: "Plaquetas",
        value: "320",
        referenceRange: "150-450 x10³/µL",
        status: "Normal" as const
      }
    ],
    files: [
      {
        name: "hemograma_completo.pdf",
        url: "#",
        type: "application/pdf"
      }
    ]
  },
  {
    id: "2",
    testName: "Perfil Lipídico",
    date: new Date("2024-01-08"),
    requestedBy: "Dr. Carlos Ramírez",
    status: "Completado" as const,
    results: [
      {
        parameter: "Colesterol Total",
        value: "220",
        referenceRange: "<200 mg/dL",
        status: "Alto" as const
      },
      {
        parameter: "HDL",
        value: "45",
        referenceRange: ">40 mg/dL",
        status: "Normal" as const
      },
      {
        parameter: "LDL",
        value: "145",
        referenceRange: "<100 mg/dL",
        status: "Alto" as const
      },
      {
        parameter: "Triglicéridos",
        value: "150",
        referenceRange: "<150 mg/dL",
        status: "Normal" as const
      }
    ],
    files: []
  },
  {
    id: "3",
    testName: "Radiografía de Tórax",
    date: new Date("2024-01-12"),
    requestedBy: "Dr. Ana López",
    status: "Pendiente" as const,
    results: [],
    files: []
  }
];

export const TestResultsSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState(mockTestResults);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term === "") {
      setFilteredResults(mockTestResults);
    } else {
      const filtered = mockTestResults.filter(
        result =>
          result.testName.toLowerCase().includes(term.toLowerCase()) ||
          result.requestedBy.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completado":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Pendiente":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "En proceso":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completado":
        return <Badge variant="success">Completado</Badge>;
      case "Pendiente":
        return <Badge variant="warning">Pendiente</Badge>;
      case "En proceso":
        return <Badge variant="info">En proceso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getParameterStatusIcon = (status: string) => {
    switch (status) {
      case "Normal":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Alto":
      case "Bajo":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "Crítico":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getParameterStatusBadge = (status: string) => {
    switch (status) {
      case "Normal":
        return <Badge variant="success" className="text-xs">Normal</Badge>;
      case "Alto":
        return <Badge variant="warning" className="text-xs">Alto</Badge>;
      case "Bajo":
        return <Badge variant="warning" className="text-xs">Bajo</Badge>;
      case "Crítico":
        return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Resultados
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Consulta los resultados de tus exámenes médicos
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por tipo de examen o médico..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de resultados */}
      <div className="space-y-4">
        {filteredResults.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {getStatusIcon(result.status)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{result.testName}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(result.date, "dd 'de' MMMM, yyyy", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {result.requestedBy}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Resultados */}
              {result.results && result.results.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Parámetros Analizados
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {result.results.map((param, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {getParameterStatusIcon(param.status)}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {param.parameter}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Rango de referencia: {param.referenceRange}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {param.value}
                          </span>
                          {getParameterStatusBadge(param.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archivos */}
              {result.files && result.files.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Archivos Adjuntos
                  </h4>
                  <div className="space-y-2">
                    {result.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-900 dark:text-blue-100">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje para resultados pendientes */}
              {result.status === "Pendiente" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">
                        Resultado Pendiente
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Los resultados estarán disponibles pronto. Te notificaremos cuando estén listos.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResults.length === 0 && searchTerm && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No hay resultados que coincidan con tu búsqueda "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
