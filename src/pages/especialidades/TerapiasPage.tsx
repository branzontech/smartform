
import React from "react";
import { EspecialidadLayout } from "@/components/especialidades/EspecialidadLayout";
import { EspecialidadCard } from "@/components/especialidades/EspecialidadCard";
import { ProcedimientoCard } from "@/components/especialidades/ProcedimientoCard";
import { Activity, UserRound, CalendarClock, Dumbbell, Heart } from "lucide-react";

const TerapiasPage = () => {
  return (
    <EspecialidadLayout
      title="Terapias"
      description="Servicios terapéuticos para recuperación y bienestar"
      icon={<Activity className="h-6 w-6 text-purple-700" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <EspecialidadCard
          title="Equipo terapéutico"
          description="Especialistas en diferentes modalidades terapéuticas"
          icon={<UserRound className="h-5 w-5 text-purple-700" />}
          linkText="Conocer al equipo"
          linkUrl="/app/equipo/terapeutas"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Contamos con fisioterapeutas, terapeutas ocupacionales y especialistas en rehabilitación con amplia experiencia clínica.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Instalaciones terapéuticas"
          description="Espacios especializados para cada tipo de terapia"
          icon={<Dumbbell className="h-5 w-5 text-purple-700" />}
          linkText="Ver instalaciones"
          linkUrl="/app/instalaciones/terapias"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Disponemos de gimnasios terapéuticos, piscinas de hidroterapia y salas equipadas con tecnología de rehabilitación avanzada.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Evaluación inicial"
          description="Valoración completa para un plan terapéutico personalizado"
          icon={<CalendarClock className="h-5 w-5 text-purple-700" />}
          linkText="Agendar evaluación"
          linkUrl="/app/citas/nueva"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Realizamos una evaluación exhaustiva para determinar el mejor enfoque terapéutico según tus necesidades específicas.
          </p>
        </EspecialidadCard>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Modalidades terapéuticas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ProcedimientoCard
          title="Fisioterapia"
          description="Rehabilitación física y manejo del dolor"
          duration="45-60 min"
          price="$650 / sesión"
          tags={["Lesiones", "Rehabilitación", "Dolor"]}
          icon={<Activity className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tratamiento especializado para recuperación de lesiones, manejo del dolor y mejora de la movilidad mediante técnicas manuales y ejercicios.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Terapia ocupacional"
          description="Recuperación de habilidades para la vida diaria"
          duration="60 min"
          price="$700 / sesión"
          tags={["Autonomía", "Funcionalidad"]}
          icon={<Activity className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enfocada en restaurar la independencia en actividades cotidianas tras lesiones, cirugías o condiciones neurológicas.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Hidroterapia"
          description="Rehabilitación en medio acuático"
          duration="45 min"
          price="$800 / sesión"
          tags={["Acuático", "Bajo impacto"]}
          icon={<Activity className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Terapia en piscina que aprovecha las propiedades del agua para facilitar el movimiento, reducir el dolor y mejorar la condición física.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Rehabilitación cardíaca"
          description="Recuperación tras eventos cardiovasculares"
          duration="60 min"
          price="$900 / sesión"
          tags={["Cardiaco", "Supervisado", "Progresivo"]}
          icon={<Heart className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Programa de ejercicios monitorizados y educación para pacientes que han sufrido eventos cardíacos o cirugías cardiovasculares.
          </p>
        </ProcedimientoCard>
      </div>
    </EspecialidadLayout>
  );
};

export default TerapiasPage;
