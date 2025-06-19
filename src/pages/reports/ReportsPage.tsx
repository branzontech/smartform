
import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  Download,
  Eye,
  Trash2,
  Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { SavedReport } from "@/types/report-types";

// Datos de ejemplo para informes guardados
const mockSavedReports: SavedReport[] = [
  {
    id: "1",
    name: "Reporte Mensual de Pacientes",
    config: {
      id: "1",
      title: "Análisis de Pacientes",
      variables: ["patients_total", "patients_by_gender", "new_patients"],
      charts: [],
      filters: [],
      createdAt: new Date(),
      lastModified: new Date()
    },
    createdAt: new Date(2024, 5, 15),
    lastGenerated: new Date(2024, 5, 18),
    isTemplate: false,
    tags: ["pacientes", "mensual"]
  },
  {
    id: "2",
    name: "Análisis de Citas",
    config: {
      id: "2",
      title: "Estadísticas de Citas",
      variables: ["appointments_status", "appointments_by_month"],
      charts: [],
      filters: [],
      createdAt: new Date(),
      lastModified: new Date()
    },
    createdAt: new Date(2024, 5, 10),
    lastGenerated: new Date(2024, 5, 17),
    isTemplate: false,
    tags: ["citas", "programación"]
  },
  {
    id: "3",
    name: "Informe Financiero",
    config: {
      id: "3",
      title: "Análisis Financiero",
      variables: ["billing_revenue", "pending_payments"],
      charts: [],
      filters: [],
      createdAt: new Date(),
      lastModified: new Date()
    },
    createdAt: new Date(2024, 5, 5),
    isTemplate: true,
    tags: ["facturación", "ingresos"]
  }
];

const ReportsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("saved");

  const filteredReports = mockSavedReports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const savedReports = filteredReports.filter(report => !report.isTemplate);
  const templates = filteredReports.filter(report => report.isTemplate);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Informes</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Genera y gestiona informes personalizados
            </p>
          </div>
          <Button asChild>
            <Link to="/app/informes/crear">
              <Plus className="mr-2 h-4 w-4" />
              Crear Informe
            </Link>
          </Button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar informes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="saved">Informes Guardados</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-4">
            {savedReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay informes guardados</h3>
                  <p className="text-gray-500 mb-4">
                    Crea tu primer informe personalizado para comenzar
                  </p>
                  <Button asChild>
                    <Link to="/app/informes/crear">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Informe
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <div className="flex items-center text-sm text-gray-500 space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Creado: {report.createdAt.toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {report.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/app/informes/${report.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {report.lastGenerated && (
                        <p className="text-xs text-gray-500 mt-2">
                          Última generación: {report.lastGenerated.toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline" className="w-fit">Plantilla</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" asChild className="flex-1">
                        <Link to={`/app/informes/crear?template=${template.id}`}>
                          Usar Plantilla
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/app/informes/plantillas/${template.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportsPage;
