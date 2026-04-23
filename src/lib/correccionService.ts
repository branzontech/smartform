import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type {
  AnulacionInput,
  CorreccionConfiguracion,
  CorreccionInput,
  CorreccionTargetTable,
  ModoCorreccionDisponible,
  ProvenanceClinico,
} from "@/types/correccion";

// ============================================================
// SCHEMAS ZOD
// ============================================================
export const anulacionSchema = z.object({
  target_table: z.enum([
    "respuestas_formularios",
    "ordenes_medicas",
    "observaciones",
  ]),
  target_record_id: z.string().uuid("ID de registro inválido"),
  reason_text: z
    .string()
    .min(10, "El motivo debe tener al menos 10 caracteres")
    .max(2000, "El motivo no puede exceder 2000 caracteres"),
  reason_code: z.string().optional(),
});

export const correccionSchema = z.object({
  target_table: z.enum([
    "respuestas_formularios",
    "ordenes_medicas",
    "observaciones",
  ]),
  target_record_id: z.string().uuid(),
  replacement_data: z.record(z.unknown()),
  reason_text: z.string().min(10).max(2000),
  reason_code: z.string().optional(),
});

// ============================================================
// HELPERS DE CONTEXTO DEL CLIENTE
// ============================================================
function obtenerUserAgent(): string {
  return typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
}

async function obtenerDatosAgente(
  userId: string
): Promise<{ role: string; nombre: string }> {
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    role: (roleData?.role as string) ?? "user",
    nombre: profileData?.full_name ?? "Usuario sin nombre",
  };
}

// ============================================================
// CONFIGURACIÓN: obtener reglas por tabla
// ============================================================
export async function obtenerConfiguracionCorreccion(
  targetTable: CorreccionTargetTable
): Promise<CorreccionConfiguracion | null> {
  const { data, error } = await supabase
    .from("correccion_configuracion")
    .select("*")
    .eq("target_table", targetTable)
    .eq("activo", true)
    .maybeSingle();

  if (error) throw new Error(`Error obteniendo configuración: ${error.message}`);
  return (data as unknown as CorreccionConfiguracion) ?? null;
}

// ============================================================
// DETERMINAR MODO DISPONIBLE
// ============================================================
export async function calcularModoCorreccion(
  targetTable: CorreccionTargetTable,
  _targetRecordId: string,
  createdAt: string,
  estadoRegistro: string,
  esFacturado: boolean = false
): Promise<ModoCorreccionDisponible> {
  if (estadoRegistro !== "active") {
    return {
      modo: "bloqueado",
      motivo_bloqueo:
        "Este registro ya fue anulado o reemplazado. No se puede corregir nuevamente.",
    };
  }

  const config = await obtenerConfiguracionCorreccion(targetTable);
  if (!config) {
    return {
      modo: "bloqueado",
      motivo_bloqueo:
        "No existe configuración de corrección para este tipo de registro.",
    };
  }

  if (esFacturado && config.bloquear_si_facturado) {
    return {
      modo: "bloqueado",
      motivo_bloqueo:
        "El registro ya fue enviado a facturación. Debe anular la factura antes de corregir.",
    };
  }

  const creacion = new Date(createdAt).getTime();
  const ahora = Date.now();
  const minutosTranscurridos = (ahora - creacion) / (1000 * 60);
  const minutosRestantes =
    config.ventana_edicion_rapida_minutos - minutosTranscurridos;

  if (minutosRestantes > 0) {
    return {
      modo: "edicion_rapida",
      minutos_restantes_edicion_rapida: Math.floor(minutosRestantes),
    };
  }

  return { modo: "correccion_formal" };
}

// ============================================================
// ANULACIÓN LÓGICA (sin registro de reemplazo)
// ============================================================
export async function anularRegistro(
  input: AnulacionInput
): Promise<ProvenanceClinico> {
  const parsed = anulacionSchema.parse(input);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  // 1. Snapshot del registro original
  const { data: originalRecord, error: fetchError } = await supabase
    .from(parsed.target_table)
    .select("*")
    .eq("id", parsed.target_record_id)
    .single();

  if (fetchError || !originalRecord) {
    throw new Error(
      `No se encontró el registro original: ${fetchError?.message ?? "desconocido"}`
    );
  }

  if ((originalRecord as any).estado_registro !== "active") {
    throw new Error("Este registro ya fue anulado o reemplazado previamente.");
  }

  // 2. Contexto del agente
  const { role, nombre } = await obtenerDatosAgente(user.id);
  const userAgent = obtenerUserAgent();

  // 3. Insertar provenance (inmutable)
  const { data: provenance, error: provError } = await supabase
    .from("provenance_clinico")
    .insert({
      target_table: parsed.target_table,
      target_record_id: parsed.target_record_id,
      replacement_record_id: null,
      activity_type: "entered-in-error",
      reason_text: parsed.reason_text,
      reason_code: parsed.reason_code ?? null,
      agent_user_id: user.id,
      agent_role: role,
      agent_nombre_completo: nombre,
      user_agent: userAgent,
      previous_snapshot: originalRecord as any,
      interop_broadcast_status: "pending",
    })
    .select()
    .single();

  if (provError || !provenance) {
    throw new Error(
      `Error registrando provenance: ${provError?.message ?? "desconocido"}`
    );
  }

  // 4. Marcar el registro original como 'entered-in-error'
  const { error: updateError } = await supabase
    .from(parsed.target_table)
    .update({ estado_registro: "entered-in-error" } as any)
    .eq("id", parsed.target_record_id);

  if (updateError) {
    throw new Error(
      `Error marcando registro como anulado: ${updateError.message}`
    );
  }

  return provenance as unknown as ProvenanceClinico;
}

// ============================================================
// CORRECCIÓN CON REEMPLAZO
// ============================================================
export async function corregirRegistro(input: CorreccionInput): Promise<{
  provenance: ProvenanceClinico;
  replacementId: string;
}> {
  const parsed = correccionSchema.parse(input);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  // 1. Snapshot original
  const { data: originalRecord, error: fetchError } = await supabase
    .from(parsed.target_table)
    .select("*")
    .eq("id", parsed.target_record_id)
    .single();

  if (fetchError || !originalRecord) {
    throw new Error(
      `No se encontró el registro original: ${fetchError?.message ?? "desconocido"}`
    );
  }

  if ((originalRecord as any).estado_registro !== "active") {
    throw new Error("Este registro ya fue anulado o reemplazado previamente.");
  }

  // 2. Crear nuevo registro de reemplazo
  const {
    id: _oldId,
    created_at: _oldCreated,
    updated_at: _oldUpdated,
    ...sanitized
  } = originalRecord as any;

  const replacementPayload = {
    ...sanitized,
    ...parsed.replacement_data,
    estado_registro: "active",
    supersedes: parsed.target_record_id,
    superseded_by: null,
  };

  const { data: replacement, error: insertError } = await supabase
    .from(parsed.target_table)
    .insert(replacementPayload as any)
    .select("id")
    .single();

  if (insertError || !replacement) {
    throw new Error(
      `Error creando registro de reemplazo: ${insertError?.message ?? "desconocido"}`
    );
  }

  // 3. Crear provenance
  const { role, nombre } = await obtenerDatosAgente(user.id);
  const userAgent = obtenerUserAgent();

  const { data: provenance, error: provError } = await supabase
    .from("provenance_clinico")
    .insert({
      target_table: parsed.target_table,
      target_record_id: parsed.target_record_id,
      replacement_record_id: (replacement as any).id,
      activity_type: "correction",
      reason_text: parsed.reason_text,
      reason_code: parsed.reason_code ?? null,
      agent_user_id: user.id,
      agent_role: role,
      agent_nombre_completo: nombre,
      user_agent: userAgent,
      previous_snapshot: originalRecord as any,
      interop_broadcast_status: "pending",
    })
    .select()
    .single();

  if (provError || !provenance) {
    throw new Error(
      `Error registrando provenance: ${provError?.message ?? "desconocido"}`
    );
  }

  // 4. Marcar original como superseded
  const { error: updateError } = await supabase
    .from(parsed.target_table)
    .update({
      estado_registro: "superseded",
      superseded_by: (replacement as any).id,
    } as any)
    .eq("id", parsed.target_record_id);

  if (updateError) {
    throw new Error(
      `Error marcando registro como superseded: ${updateError.message}`
    );
  }

  return {
    provenance: provenance as unknown as ProvenanceClinico,
    replacementId: (replacement as any).id,
  };
}

// ============================================================
// HISTORIAL DE PROVENANCE
// ============================================================
export async function obtenerHistorialProvenance(
  targetTable: CorreccionTargetTable,
  targetRecordId: string
): Promise<ProvenanceClinico[]> {
  const { data, error } = await supabase
    .from("provenance_clinico")
    .select("*")
    .eq("target_table", targetTable)
    .or(
      `target_record_id.eq.${targetRecordId},replacement_record_id.eq.${targetRecordId}`
    )
    .order("recorded_at", { ascending: true });

  if (error)
    throw new Error(`Error obteniendo historial: ${error.message}`);
  return (data ?? []) as unknown as ProvenanceClinico[];
}
