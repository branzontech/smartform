
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  List,
  Mail,
  Phone,
  Radio,
  Star,
  Table2,
  Type,
  Sigma,
} from "lucide-react";
import { SurveyQuestionType, SurveyQuestionTypeOption } from "./types";

export const SURVEY_QUESTION_TYPES: SurveyQuestionTypeOption[] = [
  {
    id: "short-text",
    label: "Texto corto",
    icon: Type,
    description: "Respuesta de texto corta (una línea)",
  },
  {
    id: "long-text",
    label: "Texto largo",
    icon: AlignLeft,
    description: "Respuesta de texto larga (párrafo)",
  },
  {
    id: "single-choice",
    label: "Opción única",
    icon: Radio,
    description: "Seleccionar una opción entre varias",
  },
  {
    id: "multiple-choice",
    label: "Opción múltiple",
    icon: CheckSquare,
    description: "Seleccionar varias opciones",
  },
  {
    id: "dropdown",
    label: "Lista desplegable",
    icon: List,
    description: "Seleccionar una opción de una lista",
  },
  {
    id: "rating",
    label: "Calificación",
    icon: Star,
    description: "Calificar en una escala de estrellas",
  },
  {
    id: "scale",
    label: "Escala",
    icon: Sigma,
    description: "Respuesta en una escala numérica",
  },
  {
    id: "matrix",
    label: "Matriz",
    icon: Table2,
    description: "Tabla de respuestas en filas y columnas",
  },
  {
    id: "date",
    label: "Fecha",
    icon: Calendar,
    description: "Seleccionar una fecha",
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    description: "Correo electrónico",
  },
  {
    id: "phone",
    label: "Teléfono",
    icon: Phone,
    description: "Número de teléfono",
  },
];

export const getQuestionTypeInfo = (
  type: SurveyQuestionType
): SurveyQuestionTypeOption | undefined => {
  return SURVEY_QUESTION_TYPES.find((t) => t.id === type);
};

export const QuestionTypeIcon = ({
  type,
  className,
}: {
  type: SurveyQuestionType;
  className?: string;
}) => {
  const typeInfo = getQuestionTypeInfo(type);
  if (!typeInfo) return null;

  const Icon = typeInfo.icon;
  return <Icon className={className} size={18} />;
};
