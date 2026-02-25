import React from "react";
import { Settings2 } from "lucide-react";
import { DynamicFieldConfigurator } from "./DynamicFieldConfigurator";

export const PatientFieldsConfig: React.FC = () => (
  <DynamicFieldConfigurator
    tableName="configuracion_campos_paciente"
    title="Campos Personalizados de Pacientes (Extensiones FHIR)"
    description="Define campos dinámicos adicionales para el formulario de pacientes. Se almacenan en fhir_extensions siguiendo el estándar HL7 FHIR R4."
    icon={<Settings2 className="w-5 h-5 text-primary" />}
  />
);

export default PatientFieldsConfig;
