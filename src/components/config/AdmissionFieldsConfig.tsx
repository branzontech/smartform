import React from "react";
import { ClipboardList } from "lucide-react";
import { DynamicFieldConfigurator } from "./DynamicFieldConfigurator";

export const AdmissionFieldsConfig: React.FC = () => (
  <DynamicFieldConfigurator
    tableName="configuracion_campos_admision"
    title="Campos Personalizados de Admisión (FHIR Extensions)"
    description="Define campos dinámicos adicionales para el formulario de admisiones. Se almacenan en fhir_extensions.customFields."
    icon={<ClipboardList className="w-5 h-5 text-primary" />}
  />
);

export default AdmissionFieldsConfig;
