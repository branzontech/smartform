
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Brain, Scissors, Activity } from "lucide-react";

export function EspecialidadesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Especialidades</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/app/especialidades/nutricionista">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
                <Apple className="h-5 w-5 text-purple-700" />
              </div>
              <CardTitle>Nutricionista</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Servicios de nutrición y dietética
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/app/especialidades/psicologo">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                <Brain className="h-5 w-5 text-blue-700" />
              </div>
              <CardTitle>Psicólogo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Atención psicológica y salud mental
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/app/especialidades/cirujano">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
                <Scissors className="h-5 w-5 text-red-700" />
              </div>
              <CardTitle>Cirujano</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Servicios quirúrgicos y procedimientos
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/app/especialidades/terapias">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full">
                <Activity className="h-5 w-5 text-green-700" />
              </div>
              <CardTitle>Terapias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Terapias de rehabilitación
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
