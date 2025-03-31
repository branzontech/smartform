
import React from "react";
import { PatientStatistics } from "@/types/patient-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Calendar } from "lucide-react";

interface PatientsOverviewCardProps {
  stats: PatientStatistics;
}

export const PatientsOverviewCard = ({ stats }: PatientsOverviewCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Resumen de Pacientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pacientes</p>
              <h4 className="text-2xl font-bold">{stats.totalPatients}</h4>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <UserPlus className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nuevos este mes</p>
              <h4 className="text-2xl font-bold">{stats.newPatientsLastMonth}</h4>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consultas Totales</p>
              <h4 className="text-2xl font-bold">
                {stats.consultationsScheduled + stats.consultationsCompleted + 
                 stats.consultationsCancelled + stats.consultationsInProgress}
              </h4>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
