export interface RegulatoryFieldOption {
  value: string;
  label: string;
}

export interface RegulatoryField {
  key: string;
  label: string;
  type: "select" | "text";
  placeholder?: string;
  options?: RegulatoryFieldOption[];
  required?: boolean;
}

export interface CountryRegulatoryConfig {
  label: string;
  flag: string;
  fields: RegulatoryField[];
}

export const REGULATORY_COUNTRIES: { value: string; label: string }[] = [
  { value: "CO", label: "🇨🇴 Colombia" },
  { value: "MX", label: "🇲🇽 México" },
  { value: "OTHER", label: "🌐 Otro / Particular" },
];

export const REGULATORY_FIELDS_BY_COUNTRY: Record<string, CountryRegulatoryConfig> = {
  CO: {
    label: "Colombia – RIPS JSON",
    flag: "🇨🇴",
    fields: [
      {
        key: "finalidad_tecnologia",
        label: "Finalidad de la Tecnología",
        type: "select",
        required: true,
        options: [
          { value: "01", label: "01 - Diagnóstico" },
          { value: "02", label: "02 - Terapéutico" },
          { value: "03", label: "03 - Protección específica" },
          { value: "04", label: "04 - Detección temprana" },
          { value: "05", label: "05 - Paliativo" },
        ],
      },
      {
        key: "tipo_servicio",
        label: "Tipo de Servicio",
        type: "select",
        required: true,
        options: [
          { value: "01", label: "01 - Consulta" },
          { value: "02", label: "02 - Procedimiento" },
          { value: "03", label: "03 - Hospitalización" },
          { value: "04", label: "04 - Urgencias" },
          { value: "05", label: "05 - Medicamento" },
          { value: "06", label: "06 - Otro servicio" },
        ],
      },
      {
        key: "concepto_rips",
        label: "Concepto RIPS",
        type: "text",
        placeholder: "Ej: Consulta de primera vez",
        required: false,
      },
    ],
  },
  MX: {
    label: "México – SAT / CFDI",
    flag: "🇲🇽",
    fields: [
      {
        key: "clave_prod_serv",
        label: "Clave Producto/Servicio (SAT)",
        type: "text",
        placeholder: "Ej: 85121800",
        required: true,
      },
      {
        key: "clave_unidad",
        label: "Clave Unidad (SAT)",
        type: "text",
        placeholder: "Ej: E48",
        required: true,
      },
    ],
  },
  OTHER: {
    label: "General / Particular",
    flag: "🌐",
    fields: [],
  },
};
