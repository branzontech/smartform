/**
 * Cliente de datos de Ker Hub: consultas a las tablas de Neon a través de la
 * API propia (/api/datos), con la misma forma de escribir que usaba el código
 * heredado (`baseDatos.from("pacientes").select("*").eq("id", x).single()`).
 *
 * Sustituye por completo al cliente de Supabase. La seguridad no está aquí: la
 * base aplica las políticas por rol en cada consulta (ver
 * smartform-backend/src/routes/datos.ts). También cubre lo que el cliente
 * viejo hacía fuera de las tablas: archivos (storage) y la configuración de
 * Google Maps (antes una edge function).
 */
import { apiFetch, ApiError, urlArchivo } from "@/integrations/api/client";

export interface ErrorDatos {
  message: string;
  code?: string;
  details?: string;
}
export interface Respuesta<T> {
  data: T | null;
  error: ErrorDatos | null;
  count: number | null;
}

type Filtro = [string, string, unknown];

function aError(e: unknown): ErrorDatos {
  if (e instanceof ApiError) {
    const cuerpo = e.body as { error?: string; code?: string; details?: string } | null;
    return { message: cuerpo?.error ?? e.message, code: cuerpo?.code, details: cuerpo?.details };
  }
  return { message: e instanceof Error ? e.message : String(e) };
}

/* eslint-disable @typescript-eslint/no-explicit-any -- el código heredado consume filas sin tipar */
class Consulta<T = any> implements PromiseLike<Respuesta<T>> {
  private cuerpo: Record<string, unknown>;
  constructor(tabla: string) {
    this.cuerpo = { tabla, accion: "select", filtros: [] as Filtro[], o: [] as string[], orden: [] as unknown[] };
  }
  private f(col: string, op: string, v: unknown) {
    (this.cuerpo.filtros as Filtro[]).push([col, op, v]);
    return this;
  }

  select(columnas = "*", opciones?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    if (this.cuerpo.accion !== "select") this.cuerpo.devolver = true;
    this.cuerpo.columnas = columnas;
    if (opciones?.count) this.cuerpo.contar = true;
    if (opciones?.head) this.cuerpo.soloConteo = true;
    return this;
  }
  insert(valores: unknown) {
    this.cuerpo.accion = "insert";
    this.cuerpo.valores = valores;
    return this;
  }
  upsert(valores: unknown, opciones?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.cuerpo.accion = "upsert";
    this.cuerpo.valores = valores;
    if (opciones?.onConflict) this.cuerpo.conflicto = opciones.onConflict;
    if (opciones?.ignoreDuplicates) this.cuerpo.ignorarDuplicados = true;
    return this;
  }
  update(valores: unknown) {
    this.cuerpo.accion = "update";
    this.cuerpo.valores = valores;
    return this;
  }
  delete() {
    this.cuerpo.accion = "delete";
    return this;
  }

  eq(col: string, v: unknown) { return this.f(col, "eq", v); }
  neq(col: string, v: unknown) { return this.f(col, "neq", v); }
  gt(col: string, v: unknown) { return this.f(col, "gt", v); }
  gte(col: string, v: unknown) { return this.f(col, "gte", v); }
  lt(col: string, v: unknown) { return this.f(col, "lt", v); }
  lte(col: string, v: unknown) { return this.f(col, "lte", v); }
  like(col: string, v: string) { return this.f(col, "like", v); }
  ilike(col: string, v: string) { return this.f(col, "ilike", v); }
  is(col: string, v: null | boolean) { return this.f(col, "is", v); }
  in(col: string, v: readonly unknown[]) { return this.f(col, "in", [...v]); }
  contains(col: string, v: unknown) { return this.f(col, "contains", v); }
  not(col: string, op: string, v: unknown) {
    if (op === "is" || op === "eq") return this.f(col, `not.${op}`, v);
    if (op === "in") {
      // Forma heredada: .not("col", "in", "(a,b)") o con lista.
      const lista = Array.isArray(v) ? v : String(v).replace(/^\(|\)$/g, "").split(",").filter(Boolean);
      return this.f(col, "not.in", lista);
    }
    throw new Error(`Filtro not.${op} no soportado`);
  }
  match(obj: Record<string, unknown>) {
    for (const [k, v] of Object.entries(obj)) this.f(k, "eq", v);
    return this;
  }
  or(expresion: string) {
    (this.cuerpo.o as string[]).push(expresion);
    return this;
  }
  order(col: string, opciones?: { ascending?: boolean; nullsFirst?: boolean }) {
    (this.cuerpo.orden as unknown[]).push({ col, asc: opciones?.ascending !== false, nullsFirst: opciones?.nullsFirst });
    return this;
  }
  limit(n: number) {
    this.cuerpo.limite = n;
    return this;
  }
  range(desde: number, hasta: number) {
    this.cuerpo.desde = desde;
    this.cuerpo.hasta = hasta;
    return this;
  }
  single() {
    this.cuerpo.unico = "uno";
    return this as unknown as Consulta<any>;
  }
  maybeSingle() {
    this.cuerpo.unico = "quizas";
    return this as unknown as Consulta<any>;
  }

  async ejecutar(): Promise<Respuesta<T>> {
    try {
      const r = await apiFetch<{ data: T; count: number | null }>("/api/datos", { method: "POST", body: JSON.stringify(this.cuerpo) });
      return { data: r.data ?? null, error: null, count: r.count ?? null };
    } catch (e) {
      return { data: null, error: aError(e), count: null };
    }
  }
  then<A = Respuesta<T>, B = never>(
    ok?: ((v: Respuesta<T>) => A | PromiseLike<A>) | null,
    mal?: ((e: unknown) => B | PromiseLike<B>) | null,
  ) {
    return this.ejecutar().then(ok, mal);
  }
}

/** Archivos: lo que antes era `supabase.storage.from(bucket)`. */
function almacen(bucket: string) {
  return {
    async upload(ruta: string, archivo: Blob, opciones?: { upsert?: boolean; contentType?: string; cacheControl?: string }) {
      const formulario = new FormData();
      formulario.append("ruta", ruta);
      formulario.append("sustituir", String(Boolean(opciones?.upsert)));
      const tipo = opciones?.contentType ?? archivo.type;
      formulario.append("archivo", tipo && tipo !== archivo.type ? new Blob([archivo], { type: tipo }) : archivo, ruta.split("/").pop());
      try {
        const r = await apiFetch<{ path: string }>(`/api/archivos/${bucket}`, { method: "POST", body: formulario });
        return { data: { path: r.path }, error: null };
      } catch (e) {
        return { data: null, error: aError(e) };
      }
    },
    async remove(rutas: string[]) {
      try {
        const r = await apiFetch<{ data: { name: string }[] }>(`/api/archivos/${bucket}`, {
          method: "DELETE",
          body: JSON.stringify({ rutas }),
        });
        return { data: r.data, error: null };
      } catch (e) {
        return { data: null, error: aError(e) };
      }
    },
    getPublicUrl(ruta: string) {
      return { data: { publicUrl: urlArchivo(bucket, ruta) } };
    },
  };
}

/** Funciones remotas heredadas que ahora son rutas de la API. */
const FUNCIONES: Record<string, string> = {
  "get-maps-config": "/api/mapas/config",
};

export const baseDatos = {
  from<T = any>(tabla: string) {
    return new Consulta<T>(tabla);
  },
  async rpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<Respuesta<T>> {
    try {
      const r = await apiFetch<{ data: T }>("/api/datos/rpc", { method: "POST", body: JSON.stringify({ fn, args }) });
      return { data: r.data ?? null, error: null, count: null };
    } catch (e) {
      return { data: null, error: aError(e), count: null };
    }
  },
  /** Usuario de la sesión, desde la API (/api/me). */
  auth: {
    async getUser() {
      try {
        const me = await apiFetch<{ user: { id: string; email: string; name: string } }>("/api/me");
        return { data: { user: me.user }, error: null };
      } catch (e) {
        return { data: { user: null }, error: aError(e) };
      }
    },
  },
  storage: { from: almacen },
  functions: {
    async invoke(nombre: string): Promise<{ data: any; error: ErrorDatos | null }> {
      const ruta = FUNCIONES[nombre];
      if (!ruta) return { data: null, error: { message: `La función «${nombre}» no existe` } };
      try {
        return { data: await apiFetch(ruta), error: null };
      } catch (e) {
        return { data: null, error: aError(e) };
      }
    },
  },
};
