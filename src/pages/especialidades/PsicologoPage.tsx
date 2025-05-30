
import React from "react";
import { EspecialidadLayout } from "@/components/especialidades/EspecialidadLayout";
import { EspecialidadCard } from "@/components/especialidades/EspecialidadCard";
import { ProcedimientoCard } from "@/components/especialidades/ProcedimientoCard";
import { Brain, UserRound, CalendarClock, FileCheck } from "lucide-react";

const PsicologoPage = () => {
  return (
    <EspecialidadLayout
      title="Psicología"
      description="Servicios de salud mental y bienestar psicológico"
      icon={<Brain className="h-6 w-6 text-purple-700" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <EspecialidadCard
          title="Equipo de especialistas"
          description="Psicólogos clínicos y terapeutas especializados"
          icon={<UserRound className="h-5 w-5 text-purple-700" />}
          linkText="Conocer al equipo"
          linkUrl="/app/equipo/psicologos"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Nuestro equipo multidisciplinario incluye psicólogos especializados en diversas áreas terapéuticas para brindar atención personalizada.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Consultas"
          description="Atención personalizada y seguimiento continuo"
          icon={<CalendarClock className="h-5 w-5 text-purple-700" />}
          linkText="Agendar consulta"
          linkUrl="/app/citas/nueva"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Ofrecemos consultas presenciales y telepsicología para facilitar el acceso a nuestros servicios, con horarios flexibles.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Evaluaciones psicológicas"
          description="Diagnóstico preciso y plan de tratamiento personalizado"
          icon={<FileCheck className="h-5 w-5 text-purple-700" />}
          linkText="Más información"
          linkUrl="/app/servicios/evaluaciones-psicologicas"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Realizamos evaluaciones completas utilizando herramientas estandarizadas para crear un plan de tratamiento efectivo y personalizado.
          </p>
        </EspecialidadCard>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Servicios de psicología</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ProcedimientoCard
          title="Terapia individual"
          description="Atención personalizada para necesidades específicas"
          duration="45-60 min"
          price="$800 / sesión"
          tags={["Ansiedad", "Depresión", "Autoestima"]}
          icon={<Brain className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sesiones diseñadas para abordar problemas específicos mediante un enfoque terapéutico adaptado a cada persona.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Terapia de pareja"
          description="Mejora de la comunicación y resolución de conflictos"
          duration="60-90 min"
          price="$1,200 / sesión"
          tags={["Comunicación", "Resolución de conflictos"]}
          icon={<Brain className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enfocada en mejorar la dinámica de relación, fortalecer vínculos y resolver conflictos de manera constructiva.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Terapia familiar"
          description="Intervenciones para mejorar la dinámica familiar"
          duration="90 min"
          price="$1,500 / sesión"
          tags={["Parentalidad", "Conflictos", "Comunicación"]}
          icon={<Brain className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aborda los patrones familiares disfuncionales y promueve una comunicación saludable entre los miembros de la familia.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Psicología infantil"
          description="Atención especializada para niños y adolescentes"
          duration="45-60 min"
          price="$900 / sesión"
          tags={["Desarrollo", "Conducta", "Aprendizaje"]}
          icon={<Brain className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Servicios adaptados a las necesidades de desarrollo de niños y adolescentes, con abordajes lúdicos y específicos para cada etapa.
          </p>
        </ProcedimientoCard>
      </div>
    </EspecialidadLayout>
  );
};

export default PsicologoPage;
