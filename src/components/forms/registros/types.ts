import type { QuestionData } from "../question/types";
import type { EstadoRegistro } from "@/types/correccion";

export interface Admission {
  id: string;
  numero_ingreso: string | null;
  fecha_inicio: string;
  estado: string;
  profesional_nombre: string | null;
}

/** Fila de `respuestas_formularios` con su formato. */
export interface FormResponse {
  id: string;
  formulario_id: string;
  formulario_version: number | null;
  admision_id: string | null;
  medico_id: string | null;
  datos_respuesta: Record<string, unknown> | null;
  fhir_extensions: Record<string, unknown> | null;
  created_at: string;
  estado_registro: EstadoRegistro | null;
  formularios: { titulo: string; tipo: string | null; preguntas: QuestionData[] | null } | null;
}

export interface Provenance {
  id: string;
  target_record_id: string;
  activity_type: "entered-in-error" | "correction" | "amendment";
  agent_nombre_completo: string;
  recorded_at: string;
  reason_text: string;
}

export interface ScoreSummary {
  value: number;
  max: number | null;
  label: string;
  /** Color del rango de interpretación (clave de RANGE_TEXT). */
  color: string | null;
}

/** Un registro listo para la lista y la vista previa. */
export interface ClinicalRecord {
  id: string;
  title: string;
  isClinicalHistory: boolean;
  /** Versión de las preguntas con que se diligenció. */
  version: number;
  createdAt: Date;
  professional: string;
  state: EstadoRegistro;
  /** Atención a la que pertenece: consulta, ingreso o, sin ninguno, el día. */
  groupKey: string;
  groupLabel: string;
  score: ScoreSummary | null;
  /** Texto de las respuestas, para buscar dentro del registro. */
  content: string;
  questions: QuestionData[];
  data: Record<string, unknown>;
  admission: Admission | null;
  response: FormResponse;
}

export const STATE_LABEL: Record<EstadoRegistro, string> = {
  active: "Vigente",
  "entered-in-error": "Anulado",
  superseded: "Reemplazado",
};

/** El estado va en el color del texto, nunca en puntos ni barras. */
export const STATE_TEXT: Record<EstadoRegistro, string> = {
  active: "text-green-700 dark:text-green-400",
  "entered-in-error": "text-amber-700 dark:text-amber-400",
  superseded: "text-blue-700 dark:text-blue-400",
};
