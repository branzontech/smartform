import type { Fetcher } from "../agenda";
import { processFormValues } from "./process";
import type { FormAnswers, QuestionData, SelectedDiagnosis } from "./types";

/**
 * Atención de una cita: el formato de su admisión, lo ya guardado y el cierre.
 * Habla con /api/data igual que el visor de formatos de la web (mismas tablas
 * y las mismas reglas de la base).
 */

type FilterTuple = [string, string, unknown];

interface DataRequest {
  table: string;
  action: "select" | "insert" | "update";
  columns?: string;
  filters?: FilterTuple[];
  or?: string[];
  order?: { col: string; asc: boolean }[];
  limit?: number;
  values?: unknown;
  returning?: boolean;
  single?: "one" | "maybe";
}

interface FormRow {
  id: string;
  titulo: string;
  descripcion: string | null;
  preguntas: QuestionData[] | null;
  version: number | null;
}

interface ResponseRow {
  id: string;
  formulario_version: number | null;
  admision_id: string | null;
  datos_respuesta: FormAnswers | null;
  fhir_extensions: { consulta_id?: string } | null;
}

export interface AttentionForm {
  formularioId: string;
  title: string;
  description: string;
  /** Versión del formato con que se diligencia (la del registro ya guardado, si existe). */
  version: number;
  questions: QuestionData[];
  /** Registro ya guardado de esta admisión, o null si aún no hay. */
  responseId: string | null;
  formData: FormAnswers;
}

export interface SaveAttentionInput {
  form: AttentionForm;
  responseId: string | null;
  pacienteId: string;
  admisionId: string;
  medicoId: string;
  formData: FormAnswers;
}

/** Quita lo que rompería el filtro «o» de la búsqueda (comas, paréntesis, comodines). */
const searchTerm = (s: string) => s.replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim();

export function createAttentionApi(fetcher: Fetcher) {
  const data = async <T>(req: DataRequest): Promise<T> => {
    const r = await fetcher<{ data: T; count: number | null }>("/api/data", {
      method: "POST",
      body: JSON.stringify({ filters: [], or: [], order: [], ...req }),
    });
    return r.data;
  };

  return {
    /** Formato de la admisión con lo ya guardado (un registro viejo se retoma con las preguntas de su versión). */
    async loadForm({ formularioId, pacienteId, admisionId }: { formularioId: string; pacienteId: string; admisionId: string }): Promise<AttentionForm> {
      const [form, saved] = await Promise.all([
        data<FormRow>({ table: "formularios", action: "select", columns: "id, titulo, descripcion, preguntas, version", filters: [["id", "eq", formularioId]], single: "one" }),
        data<ResponseRow[]>({
          table: "respuestas_formularios",
          action: "select",
          columns: "id, formulario_version, admision_id, datos_respuesta, fhir_extensions",
          filters: [["paciente_id", "eq", pacienteId], ["estado_registro", "eq", "active"], ["formulario_id", "eq", formularioId]],
          order: [{ col: "created_at", asc: false }],
          limit: 50,
        }),
      ]);
      const mine = (saved ?? []).find((r) => r.admision_id === admisionId || r.fhir_extensions?.consulta_id === admisionId) ?? null;
      let questions = form.preguntas ?? [];
      let version = mine?.formulario_version ?? form.version ?? 1;
      if (mine?.formulario_version && form.version && mine.formulario_version !== form.version) {
        const rows = await data<{ version: number; preguntas: QuestionData[] | null }[]>({
          table: "formularios_versiones",
          action: "select",
          columns: "version, preguntas",
          filters: [["formulario_id", "eq", formularioId], ["version", "eq", mine.formulario_version]],
          limit: 1,
        });
        if (rows?.[0]) {
          questions = rows[0].preguntas ?? [];
          version = rows[0].version;
        }
      }
      return {
        formularioId: form.id,
        title: form.titulo,
        description: form.descripcion ?? "",
        version,
        questions,
        responseId: mine?.id ?? null,
        formData: mine?.datos_respuesta ?? {},
      };
    },

    /** Guarda lo diligenciado: crea el registro la primera vez y luego lo actualiza. Devuelve su id. */
    async saveResponse({ form, responseId, pacienteId, admisionId, medicoId, formData }: SaveAttentionInput): Promise<string> {
      const processed = processFormValues(form.questions, formData);
      if (responseId) {
        await data({
          table: "respuestas_formularios",
          action: "update",
          values: { datos_respuesta: processed, updated_at: new Date().toISOString() },
          filters: [["id", "eq", responseId]],
        });
        return responseId;
      }
      const row = await data<{ id: string }>({
        table: "respuestas_formularios",
        action: "insert",
        values: {
          formulario_id: form.formularioId,
          formulario_version: form.version,
          paciente_id: pacienteId,
          admision_id: admisionId,
          medico_id: medicoId,
          datos_respuesta: processed,
          fhir_extensions: { consulta_id: admisionId },
        },
        columns: "id",
        returning: true,
        single: "one",
      });
      return row.id;
    },

    /** Cierra la admisión; la base pasa la cita a «atendida» (disparador cita_sigue_admision). */
    async completeAdmission(admisionId: string): Promise<void> {
      await data({
        table: "admisiones",
        action: "update",
        values: { estado: "completada", fecha_fin: new Date().toISOString() },
        filters: [["id", "eq", admisionId]],
      });
    },

    /** Busca en el catálogo de diagnósticos por código o descripción. */
    async searchDiagnoses(term: string, sistema: "CIE-10" | "CIE-11" = "CIE-10"): Promise<SelectedDiagnosis[]> {
      const t = searchTerm(term);
      if (!t) return [];
      const rows = await data<SelectedDiagnosis[]>({
        table: "catalogo_diagnosticos",
        action: "select",
        columns: "codigo, descripcion, sistema, fhir_system_uri",
        filters: [["sistema", "eq", sistema], ["activo", "eq", true]],
        or: [`codigo.ilike.%${t}%,descripcion.ilike.%${t}%`],
        limit: 10,
      });
      return rows ?? [];
    },
  };
}

export type AttentionApi = ReturnType<typeof createAttentionApi>;

/** Un formato de la atención: el principal, los del tipo de profesional y los agregados en la visita. */
export interface AttentionFormat {
  formularioId: string;
  titulo: string;
  tipo: string;
  obligatorio: boolean;
  origen: "principal" | "agenda" | "profesional";
  tieneRespuesta: boolean;
}

export interface AvailableForm {
  id: string;
  titulo: string;
  tipo: string;
  global: boolean;
}

export interface FormatConfigRow {
  tipoProfesional: string;
  formularioId: string;
  titulo: string;
  tipo: string;
  principal: boolean;
  obligatorio: boolean;
  orden: number;
}

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

/** Formatos de cada atención y su configuración por tipo de profesional (/api/atencion). */
export function createFormatsApi(fetcher: Fetcher) {
  return {
    fetchAdmissionFormats: (admisionId: string) => fetcher<AttentionFormat[]>(`/api/atencion/admisiones/${admisionId}/formatos`),
    addAdmissionFormat: (admisionId: string, formularioId: string) =>
      fetcher<{ ok: true }>(`/api/atencion/admisiones/${admisionId}/formatos`, send("POST", { formularioId })),
    removeAdmissionFormat: (admisionId: string, formularioId: string) =>
      fetcher<{ ok: true }>(`/api/atencion/admisiones/${admisionId}/formatos/${formularioId}`, send("DELETE")),
    fetchAvailableForms: () => fetcher<AvailableForm[]>("/api/atencion/formularios"),
    fetchFormatConfig: () => fetcher<FormatConfigRow[]>("/api/atencion/formatos-tipo"),
    saveFormatConfig: (tipo: string, formatos: { formularioId: string; principal: boolean; obligatorio: boolean }[]) =>
      fetcher<{ tipo: string; formatos: number }>(`/api/atencion/formatos-tipo/${tipo}`, send("PUT", { formatos })),
  };
}

