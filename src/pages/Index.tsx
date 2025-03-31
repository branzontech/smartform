
import React from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, ArrowRight, Calendar, Users, BarChart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bienvenido a Smart Forms
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            La plataforma que simplifica la creación y gestión de formularios para profesionales de la salud.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
            <Link to="/crear">
              <Button size="lg" className="w-full bg-form-primary hover:bg-form-primary/90">
                <FileText className="mr-2 h-5 w-5" />
                Crear nuevo formulario
              </Button>
            </Link>
            <Link to="/pacientes">
              <Button size="lg" variant="outline" className="w-full group">
                <Users className="mr-2 h-5 w-5" />
                Ver pacientes
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/citas">
              <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                <Calendar className="mr-2 h-5 w-5" />
                Gestionar citas
              </Button>
            </Link>
            <Link to="/pacientes/dashboard">
              <Button size="lg" variant="outline" className="w-full group">
                <BarChart className="mr-2 h-5 w-5" />
                Ver estadísticas
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
