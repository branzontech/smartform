
import React from "react";
import { EspecialidadLayout } from "@/components/especialidades/EspecialidadLayout";
import { EspecialidadCard } from "@/components/especialidades/EspecialidadCard";
import { ProcedimientoCard } from "@/components/especialidades/ProcedimientoCard";
import { Apple, UserRound, CalendarClock, FileCheck, LineChart, ChefHat, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NutricionistaPage = () => {
  return (
    <EspecialidadLayout
      title="Nutrición"
      description="Servicios de nutrición clínica y asesoría alimentaria"
      icon={<Apple className="h-6 w-6 text-purple-700" />}
    >
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-100 dark:border-purple-800 p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-full">
              <Brain className="h-6 w-6 text-purple-700 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-800 dark:text-purple-300">
                Nueva funcionalidad: Planes de alimentación con IA
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Crea planes de alimentación personalizados en segundos con inteligencia artificial
              </p>
            </div>
          </div>
          <Link to="/app/especialidades/nutricion/planes">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <ChefHat className="mr-2 h-5 w-5" />
              Crear plan de alimentación
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <EspecialidadCard
          title="Nutricionistas clínicos"
          description="Especialistas en nutrición y dietética"
          icon={<UserRound className="h-5 w-5 text-purple-700" />}
          linkText="Conocer el equipo"
          linkUrl="/app/equipo/nutricionistas"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Contamos con nutricionistas certificados especializados en diferentes áreas como nutrición clínica, deportiva y trastornos alimentarios.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Consultas nutricionales"
          description="Evaluación y seguimiento personalizado"
          icon={<CalendarClock className="h-5 w-5 text-purple-700" />}
          linkText="Agendar consulta"
          linkUrl="/app/citas/nueva"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Ofrecemos consultas completas con evaluación antropométrica, análisis de hábitos alimentarios y plan nutricional personalizado.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Planes de alimentación"
          description="Diseñados con inteligencia artificial"
          icon={<ChefHat className="h-5 w-5 text-purple-700" />}
          linkText="Crear plan"
          linkUrl="/app/especialidades/nutricion/planes"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Genera planes de alimentación personalizados utilizando IA, adaptados a las necesidades específicas, restricciones y objetivos de cada paciente.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Seguimiento y control"
          description="Monitoreo de avances y ajustes a planes nutricionales"
          icon={<LineChart className="h-5 w-5 text-purple-700" />}
          linkText="Más información"
          linkUrl="/app/servicios/seguimiento-nutricional"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Realizamos sesiones de seguimiento para monitorear el progreso, ajustar planes y superar obstáculos en el camino hacia tus objetivos.
          </p>
        </EspecialidadCard>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Servicios nutricionales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ProcedimientoCard
          title="Evaluación nutricional completa"
          description="Análisis integral del estado nutricional"
          duration="60 min"
          price="$800"
          tags={["Composición corporal", "Hábitos alimentarios"]}
          icon={<Apple className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Incluye mediciones antropométricas, análisis de composición corporal, evaluación de hábitos alimentarios y revisión de antecedentes clínicos.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Plan nutricional personalizado"
          description="Diseño de plan alimentario según objetivos"
          duration="45 min"
          price="$700"
          tags={["Personalizado", "Objetivos específicos"]}
          icon={<FileCheck className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Creación de un plan alimentario adaptado a tus necesidades, preferencias, estilo de vida y objetivos de salud específicos.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Nutrición deportiva"
          description="Optimización del rendimiento deportivo"
          duration="60 min"
          price="$900"
          tags={["Deportistas", "Rendimiento", "Recuperación"]}
          icon={<Apple className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Asesoría nutricional especializada para deportistas enfocada en mejorar el rendimiento, optimizar la recuperación y prevenir lesiones.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Nutrición para condiciones específicas"
          description="Manejo nutricional de patologías"
          duration="60 min"
          price="$850"
          tags={["Diabetes", "Hipertensión", "Digestivo"]}
          icon={<Apple className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Abordaje nutricional especializado para condiciones como diabetes, hipertensión, trastornos digestivos, enfermedades renales y más.
          </p>
        </ProcedimientoCard>
      </div>
    </EspecialidadLayout>
  );
};

export default NutricionistaPage;
