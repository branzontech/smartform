// Tipos para el sistema de correcciones clínicas (FHIR Provenance pattern)

export type CorreccionTargetTable =
  | "respuestas_formularios"
  | "ordenes_medicas"
  | "observaciones";

export type CorreccionActivityType =
  | "entered-in-error" // Anulación sin reemplazo
  | "correction" // Anulación + registro corregido
  | "amendment"; // Enmienda menor

export type EstadoRegistro = "active" | "entered-in-error" | "superseded";

export type InteropBroadcastStatus =
  | "not_required"
  | "pending"
  | "sent"
  | "failed";

export type CountryCode = "CO" | "MX" | "EC" | "PE" | "AR";

export interface ProvenanceClinico {
  id: string;
  target_table: CorreccionTargetTable;
  target_record_id: string;
  replacement_record_id: string | null;
  activity_type: CorreccionActivityType;
  reason_code: string | null;
  reason_text: string;
  agent_user_id: string;
  agent_role: string;
  agent_nombre_completo: string;
  client_ip: string | null;
  user_agent: string | null;
  previous_snapshot: Record<string, unknown>;
  recorded_at: string;
  country_code: CountryCode | null;
  interop_broadcast_status: InteropBroadcastStatus;
  interop_broadcast_attempts: number;
  interop_last_error: string | null;
  fhir_extensions: Record<string, unknown>;
  created_at: string;
}

export interface CorreccionConfiguracion {
  id: string;
  target_table: CorreccionTargetTable;
  nombre_legible: string;
  ventana_edicion_rapida_minutos: number;
  requiere_motivo: boolean;
  permite_anulacion_sin_reemplazo: boolean;
  permite_correccion_con_reemplazo: boolean;
  bloquear_si_facturado: boolean;
  activo: boolean;
  fhir_extensions: Record<string, unknown>;
}

// Input para crear una anulación (sin reemplazo)
export interface AnulacionInput {
  target_table: CorreccionTargetTable;
  target_record_id: string;
  reason_text: string;
  reason_code?: string;
}

// Input para crear una corrección (anulación + nuevo registro)
export interface CorreccionInput {
  target_table: CorreccionTargetTable;
  target_record_id: string;
  replacement_data: Record<string, unknown>;
  reason_text: string;
  reason_code?: string;
}

// Resultado del cálculo de modo disponible
export interface ModoCorreccionDisponible {
  modo: "edicion_rapida" | "correccion_formal" | "bloqueado";
  minutos_restantes_edicion_rapida?: number;
  motivo_bloqueo?: string;
}
