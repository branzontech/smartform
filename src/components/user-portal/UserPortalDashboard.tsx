
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Calendar, 
  User, 
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { MedicalHistorySection } from "./MedicalHistorySection";
import { TestResultsSection } from "./TestResultsSection";
import { AppointmentsSection } from "./AppointmentsSection";
import { PersonalDataSection } from "./PersonalDataSection";

export const UserPortalDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Datos de ejemplo para el dashboard
  const summaryStats = {
    upcomingAppointments: 2,
    pendingResults: 1,
    recentRecords: 3,
    totalRecords: 15
  };

  return (
    <div className="space-y-6">
      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Próximas Citas
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {summaryStats.upcomingAppointments}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Resultados Pendientes
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {summaryStats.pendingResults}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Registros Recientes
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {summaryStats.recentRecords}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Total Registros
                </p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {summaryStats.totalRecords}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
          <TabsTrigger 
            value="results" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Resultados</span>
          </TabsTrigger>
          <TabsTrigger 
            value="appointments" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Citas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximas citas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Próximas Citas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Dr. María González</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cardiología</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">15 Enero, 10:00 AM</p>
                    </div>
                    <Badge variant="info">Confirmada</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Dr. Carlos Ramírez</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Medicina General</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">20 Enero, 2:30 PM</p>
                    </div>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-green-600" />
                  Resultados Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Examen de Sangre</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dr. Ana López</p>
                      <p className="text-sm text-green-600 dark:text-green-400">10 Enero, 2024</p>
                    </div>
                    <Badge variant="success">Normal</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Radiografía Tórax</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dr. Pedro Martín</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">12 Enero, 2024</p>
                    </div>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Datos personales rápidos */}
          <PersonalDataSection />
        </TabsContent>

        <TabsContent value="history">
          <MedicalHistorySection />
        </TabsContent>

        <TabsContent value="results">
          <TestResultsSection />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};
