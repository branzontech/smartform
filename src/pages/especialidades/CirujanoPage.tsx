
import React from "react";
import { EspecialidadLayout } from "@/components/especialidades/EspecialidadLayout";
import { EspecialidadCard } from "@/components/especialidades/EspecialidadCard";
import { ProcedimientoCard } from "@/components/especialidades/ProcedimientoCard";
import { Scissors, Heart, Activity, Stethoscope, UserRound } from "lucide-react";

const CirujanoPage = () => {
  return (
    <EspecialidadLayout
      title="Cirugía"
      description="Servicios quirúrgicos y procedimientos especializados"
      icon={<Scissors className="h-6 w-6 text-purple-700" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <EspecialidadCard
          title="Equipo médico"
          description="Nuestro equipo de profesionales especializados"
          icon={<UserRound className="h-5 w-5 text-purple-700" />}
          linkText="Ver todos los cirujanos"
          linkUrl="/app/equipo/cirujanos"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Contamos con cirujanos especializados en diversas áreas, respaldados por años de experiencia y formación internacional.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Instalaciones"
          description="Quirófanos y tecnología médica de vanguardia"
          icon={<Stethoscope className="h-5 w-5 text-purple-700" />}
          linkText="Ver instalaciones"
          linkUrl="/app/instalaciones/quirofanos"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Nuestras instalaciones cuentan con la última tecnología en equipamiento quirúrgico, garantizando los más altos estándares de seguridad.
          </p>
        </EspecialidadCard>
        
        <EspecialidadCard
          title="Consulta pre-quirúrgica"
          description="Evaluación integral antes de cualquier procedimiento"
          icon={<Activity className="h-5 w-5 text-purple-700" />}
          linkText="Agendar consulta"
          linkUrl="/app/citas/nueva"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Antes de cualquier procedimiento, realizamos una evaluación completa para garantizar la seguridad y el éxito de la cirugía.
          </p>
        </EspecialidadCard>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Procedimientos quirúrgicos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ProcedimientoCard
          title="Cirugía General"
          description="Procedimientos en cavidad abdominal y digestivos"
          duration="1-3 horas"
          price="Desde $10,000"
          tags={["Vesícula", "Apéndice", "Hernias"]}
          icon={<Scissors className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Especialidad que abarca operaciones del aparato digestivo, sistema endocrino, abdomen y tejidos blandos.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Cirugía Cardiovascular"
          description="Intervenciones en corazón y vasos sanguíneos"
          duration="2-6 horas"
          price="Consultar"
          tags={["Bypass", "Válvulas", "Marcapasos"]}
          icon={<Heart className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tratamiento quirúrgico de enfermedades del corazón y sistema vascular, utilizando técnicas mínimamente invasivas cuando es posible.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Cirugía Laparoscópica"
          description="Técnicas mínimamente invasivas"
          duration="1-2 horas"
          price="Desde $15,000"
          tags={["Mínima invasión", "Recuperación rápida"]}
          icon={<Scissors className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Procedimientos con pequeñas incisiones que permiten una recuperación más rápida y menos dolor postoperatorio.
          </p>
        </ProcedimientoCard>
        
        <ProcedimientoCard
          title="Cirugía Plástica"
          description="Procedimientos reconstructivos y estéticos"
          duration="Variable"
          price="Desde $12,000"
          tags={["Reconstructiva", "Estética"]}
          icon={<Scissors className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Incluye procedimientos tanto reconstructivos para recuperar función y apariencia, como estéticos para mejorar la imagen corporal.
          </p>
        </ProcedimientoCard>
      </div>
    </EspecialidadLayout>
  );
};

export default CirujanoPage;
