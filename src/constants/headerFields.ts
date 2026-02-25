export interface HeaderFieldDef {
  key: string;
  label: string;
  placeholder: string;
  jsonbTarget: "identificacion_fiscal" | "datos_regulatorios";
}

export interface EntityTypeOption {
  value: string;
  label: string;
}

export interface CountryOption {
  value: string;
  label: string;
  flag: string;
}

export const ENTITY_TYPES: EntityTypeOption[] = [
  { value: "institucion", label: "Clínica / Institución" },
  { value: "profesional_independiente", label: "Profesional Independiente" },
];

export const COUNTRIES: CountryOption[] = [
  { value: "CO", label: "Colombia", flag: "🇨🇴" },
  { value: "MX", label: "México", flag: "🇲🇽" },
  { value: "PE", label: "Perú", flag: "🇵🇪" },
  { value: "EC", label: "Ecuador", flag: "🇪🇨" },
  { value: "CL", label: "Chile", flag: "🇨🇱" },
  { value: "AR", label: "Argentina", flag: "🇦🇷" },
  { value: "OTHER", label: "Otro", flag: "🌐" },
];

/**
 * Returns the dynamic fields to render based on entity type + country.
 */
export function getHeaderFields(
  tipoEntidad: string,
  pais: string
): HeaderFieldDef[] {
  if (tipoEntidad === "profesional_independiente") {
    return [
      {
        key: "documento_identidad",
        label: "Documento de Identidad / RUT",
        placeholder: "Ej: 1.234.567.890",
        jsonbTarget: "identificacion_fiscal",
      },
      {
        key: "especialidad",
        label: "Especialidad",
        placeholder: "Ej: Medicina General",
        jsonbTarget: "datos_regulatorios",
      },
      {
        key: "registro_medico",
        label: "Registro Médico / Cédula Profesional",
        placeholder: "Ej: RM-12345",
        jsonbTarget: "datos_regulatorios",
      },
    ];
  }

  // Institution fields vary by country
  switch (pais) {
    case "CO":
      return [
        {
          key: "nit",
          label: "NIT",
          placeholder: "Ej: 900.123.456-7",
          jsonbTarget: "identificacion_fiscal",
        },
        {
          key: "resolucion_habilitacion",
          label: "Resolución de Habilitación",
          placeholder: "Ej: Res. 1234 de 2024",
          jsonbTarget: "datos_regulatorios",
        },
      ];
    case "MX":
      return [
        {
          key: "rfc",
          label: "RFC",
          placeholder: "Ej: XAXX010101000",
          jsonbTarget: "identificacion_fiscal",
        },
        {
          key: "licencia_sanitaria",
          label: "Licencia Sanitaria",
          placeholder: "Ej: LS-2024-0001",
          jsonbTarget: "datos_regulatorios",
        },
      ];
    case "PE":
      return [
        {
          key: "ruc",
          label: "RUC",
          placeholder: "Ej: 20123456789",
          jsonbTarget: "identificacion_fiscal",
        },
        {
          key: "registro_susalud",
          label: "Registro SUSALUD",
          placeholder: "Ej: RS-0001",
          jsonbTarget: "datos_regulatorios",
        },
      ];
    case "EC":
      return [
        {
          key: "ruc",
          label: "RUC",
          placeholder: "Ej: 1790012345001",
          jsonbTarget: "identificacion_fiscal",
        },
        {
          key: "permiso_arcsa",
          label: "Permiso ARCSA",
          placeholder: "Ej: ARCSA-2024-001",
          jsonbTarget: "datos_regulatorios",
        },
      ];
    case "CL":
      return [
        {
          key: "rut",
          label: "RUT",
          placeholder: "Ej: 76.123.456-7",
          jsonbTarget: "identificacion_fiscal",
        },
        {
          key: "resolucion_seremi",
          label: "Resolución SEREMI",
          placeholder: "Ej: Res. Exenta 123/2024",
          jsonbTarget: "datos_regulatorios",
        },
      ];
    case "AR":
      return [
        {
          key: "cuit",
          label: "CUIT",
          placeholder: "Ej: 30-12345678-9",
          jsonbTarget: "identificacion_fiscal",
        },
        {
          key: "habilitacion_ministerio",
          label: "Habilitación Min. Salud",
          placeholder: "Ej: Hab. 1234/2024",
          jsonbTarget: "datos_regulatorios",
        },
      ];
    default:
      return [
        {
          key: "id_fiscal",
          label: "Identificación Fiscal",
          placeholder: "Número de identificación fiscal",
          jsonbTarget: "identificacion_fiscal",
        },
        {
          key: "registro_salud",
          label: "Registro Sanitario",
          placeholder: "Número de registro",
          jsonbTarget: "datos_regulatorios",
        },
      ];
  }
}
