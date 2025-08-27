import { 
  Type, 
  AlignLeft, 
  ChevronDown, 
  CheckSquare, 
  Radio, 
  Calendar,
  Clock,
  Hash,
  Mail,
  Phone
} from "lucide-react";
import { CustomFieldTypeOption } from "./types";

export const customFieldTypes: CustomFieldTypeOption[] = [
  {
    id: "text",
    label: "Texto corto",
    icon: Type,
    description: "Campo de texto de una línea"
  },
  {
    id: "textarea",
    label: "Texto largo",
    icon: AlignLeft,
    description: "Campo de texto multilínea"
  },
  {
    id: "select",
    label: "Lista desplegable",
    icon: ChevronDown,
    description: "Selección única de opciones"
  },
  {
    id: "checkbox",
    label: "Casillas de verificación",
    icon: CheckSquare,
    description: "Selección múltiple de opciones"
  },
  {
    id: "radio",
    label: "Botones de opción",
    icon: Radio,
    description: "Selección única con botones"
  },
  {
    id: "date",
    label: "Fecha",
    icon: Calendar,
    description: "Selector de fecha"
  },
  {
    id: "time",
    label: "Hora",
    icon: Clock,
    description: "Selector de hora"
  },
  {
    id: "number",
    label: "Número",
    icon: Hash,
    description: "Campo numérico"
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    description: "Campo de correo electrónico"
  },
  {
    id: "phone",
    label: "Teléfono",
    icon: Phone,
    description: "Campo de teléfono"
  }
];

export const getDefaultFieldByType = (type: string) => {
  switch (type) {
    case "select":
    case "radio":
    case "checkbox":
      return {
        options: [
          { id: "1", label: "Opción 1", value: "option1" },
          { id: "2", label: "Opción 2", value: "option2" }
        ]
      };
    default:
      return {};
  }
};