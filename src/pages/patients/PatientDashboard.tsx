import React from "react";
import { BackButton } from "@/App";
import { Header } from "@/components/layout/header";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { PatientStatistics } from "@/types/patient-types";
import {
  PatientsOverviewCard,
  ConsultationsStatusChart,
  PatientsByGenderChart,
  ConsultationsTrendChart,
  TopDiagnosesChart,
  RecurringPatientsChart
} from "@/components/patients/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Datos de ejemplo para el dashboard (normalmente vendrían de una API)
const patientStatsData: PatientStatistics = {
  totalPatients: 245,
  newPatientsLastMonth: 28,
  patientsByGender: [
    { name: "Masculino", value: 112 },
    { name: "Femenino", value: 128 },
    { name: "Otro", value: 5 }
  ],
  consultationsScheduled: 45,
  consultationsCompleted: 183,
  consultationsCancelled: 12,
  consultationsInProgress: 8,
  topDiagnoses: [
    { name: "Hipertensión", value: 42 },
    { name: "Diabetes Tipo 2", value: 38 },
    { name: "Infección respiratoria", value: 25 },
    { name: "Alergia estacional", value: 23 },
    { name: "Artritis", value: 19 }
  ],
  consultationsByMonth: [
    { name: "Ene", scheduled: 32, completed: 29 },
    { name: "Feb", scheduled: 35, completed: 31 },
    { name: "Mar", scheduled: 38, completed: 36 },
    { name: "Abr", scheduled: 30, completed: 27 },
    { name: "May", scheduled: 40, completed: 37 },
    { name: "Jun", scheduled: 35, completed: 33 }
  ],
  recurringPatients: [
    { name: "Ana García", visits: 8 },
    { name: "Carlos Méndez", visits: 7 },
    { name: "María López", visits: 6 },
    { name: "Juan Pérez", visits: 5 },
    { name: "Sofía Rodríguez", visits: 5 }
  ]
};

const PatientDashboard = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header showCreate={false} />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <BackButton />
            <h1 className="text-2xl md:text-3xl font-bold mt-2">Dashboard de Pacientes</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">
              Visualización de estadísticas y métricas de pacientes
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4 md:space-y-6">
          <TabsList className="mb-4 w-full overflow-x-auto flex-nowrap">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="consultas">Consultas</TabsTrigger>
            <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <PatientsOverviewCard stats={patientStatsData} />
              <ConsultationsStatusChart stats={patientStatsData} />
              <PatientsByGenderChart data={patientStatsData.patientsByGender} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <ConsultationsTrendChart data={patientStatsData.consultationsByMonth} />
              <RecurringPatientsChart data={patientStatsData.recurringPatients} />
            </div>
          </TabsContent>

          <TabsContent value="consultas" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <ConsultationsStatusChart stats={patientStatsData} />
              <ConsultationsTrendChart data={patientStatsData.consultationsByMonth} />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Estado de Consultas</CardTitle>
                <CardDescription>
                  Detalle completo de consultas programadas, completadas, en curso y canceladas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] md:h-[400px]">
                  <ConsultationsStatusChart stats={patientStatsData} expanded={true} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnosticos" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <TopDiagnosesChart data={patientStatsData.topDiagnoses} />
              <RecurringPatientsChart data={patientStatsData.recurringPatients} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDashboard;
