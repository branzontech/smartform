/**
 * Cliente de datos de Ker Hub: consultas a las tablas de Neon a través de la
 * API propia (/api/data), con la misma forma de escribir que usaba el código
 * heredado (`db.from("pacientes").select("*").eq("id", x).single()`).
 *
 * Sustituye por completo al cliente de Supabase. La seguridad no está aquí: la
 * base aplica las políticas por rol en cada consulta (ver
 * smartform-backend/src/routes/data.ts). También cubre lo que el cliente
 * viejo hacía fuera de las tablas: archivos (storage) y la configuración de
 * Google Maps (antes una edge function).
 */
import { apiFetch, ApiError, fileUrl } from "@/integrations/api/client";

export interface DataError {
  message: string;
  code?: string;
  details?: string;
}
export interface DataResponse<T> {
  data: T | null;
  error: DataError | null;
  count: number | null;
}

type FilterTuple = [string, string, unknown];

function toDataError(e: unknown): DataError {
  if (e instanceof ApiError) {
    const body = e.body as { error?: string; code?: string; details?: string } | null;
    return { message: body?.error ?? e.message, code: body?.code, details: body?.details };
  }
  return { message: e instanceof Error ? e.message : String(e) };
}

/* eslint-disable @typescript-eslint/no-explicit-any -- el código heredado consume filas sin tipar */
class QueryBuilder<T = any> implements PromiseLike<DataResponse<T>> {
  private body: Record<string, unknown>;
  constructor(table: string) {
    this.body = { table, action: "select", filters: [] as FilterTuple[], or: [] as string[], order: [] as unknown[] };
  }
  private f(col: string, op: string, v: unknown) {
    (this.body.filters as FilterTuple[]).push([col, op, v]);
    return this;
  }

  select(columns = "*", options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    if (this.body.action !== "select") this.body.returning = true;
    this.body.columns = columns;
    if (options?.count) this.body.count = true;
    if (options?.head) this.body.headOnly = true;
    return this;
  }
  insert(values: unknown) {
    this.body.action = "insert";
    this.body.values = values;
    return this;
  }
  upsert(values: unknown, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.body.action = "upsert";
    this.body.values = values;
    if (options?.onConflict) this.body.onConflict = options.onConflict;
    if (options?.ignoreDuplicates) this.body.ignoreDuplicates = true;
    return this;
  }
  update(values: unknown) {
    this.body.action = "update";
    this.body.values = values;
    return this;
  }
  delete() {
    this.body.action = "delete";
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
      const list = Array.isArray(v) ? v : String(v).replace(/^\(|\)$/g, "").split(",").filter(Boolean);
      return this.f(col, "not.in", list);
    }
    throw new Error(`Filtro not.${op} no soportado`);
  }
  match(obj: Record<string, unknown>) {
    for (const [k, v] of Object.entries(obj)) this.f(k, "eq", v);
    return this;
  }
  or(expression: string) {
    (this.body.or as string[]).push(expression);
    return this;
  }
  order(col: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    (this.body.order as unknown[]).push({ col, asc: options?.ascending !== false, nullsFirst: options?.nullsFirst });
    return this;
  }
  limit(n: number) {
    this.body.limit = n;
    return this;
  }
  range(from: number, to: number) {
    this.body.from = from;
    this.body.to = to;
    return this;
  }
  single() {
    this.body.single = "one";
    return this as unknown as QueryBuilder<any>;
  }
  maybeSingle() {
    this.body.single = "maybe";
    return this as unknown as QueryBuilder<any>;
  }

  async execute(): Promise<DataResponse<T>> {
    try {
      const r = await apiFetch<{ data: T; count: number | null }>("/api/data", { method: "POST", body: JSON.stringify(this.body) });
      return { data: r.data ?? null, error: null, count: r.count ?? null };
    } catch (e) {
      return { data: null, error: toDataError(e), count: null };
    }
  }
  then<A = DataResponse<T>, B = never>(
    onFulfilled?: ((v: DataResponse<T>) => A | PromiseLike<A>) | null,
    onRejected?: ((e: unknown) => B | PromiseLike<B>) | null,
  ) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

/** Archivos: lo que antes era `supabase.storage.from(bucket)`. */
function storageBucket(bucket: string) {
  return {
    async upload(path: string, file: Blob, options?: { upsert?: boolean; contentType?: string; cacheControl?: string }) {
      const form = new FormData();
      form.append("path", path);
      form.append("upsert", String(Boolean(options?.upsert)));
      const type = options?.contentType ?? file.type;
      form.append("file", type && type !== file.type ? new Blob([file], { type }) : file, path.split("/").pop());
      try {
        const r = await apiFetch<{ path: string }>(`/api/files/${bucket}`, { method: "POST", body: form });
        return { data: { path: r.path }, error: null };
      } catch (e) {
        return { data: null, error: toDataError(e) };
      }
    },
    async remove(paths: string[]) {
      try {
        const r = await apiFetch<{ data: { name: string }[] }>(`/api/files/${bucket}`, {
          method: "DELETE",
          body: JSON.stringify({ paths }),
        });
        return { data: r.data, error: null };
      } catch (e) {
        return { data: null, error: toDataError(e) };
      }
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: fileUrl(bucket, path) } };
    },
  };
}

/** Funciones remotas heredadas que ahora son rutas de la API. */
const FUNCTIONS: Record<string, string> = {
  "get-maps-config": "/api/maps/config",
};

export const db = {
  from<T = any>(table: string) {
    return new QueryBuilder<T>(table);
  },
  async rpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<DataResponse<T>> {
    try {
      const r = await apiFetch<{ data: T }>("/api/data/rpc", { method: "POST", body: JSON.stringify({ fn, args }) });
      return { data: r.data ?? null, error: null, count: null };
    } catch (e) {
      return { data: null, error: toDataError(e), count: null };
    }
  },
  /** Usuario de la sesión, desde la API (/api/me). */
  auth: {
    async getUser() {
      try {
        const me = await apiFetch<{ user: { id: string; email: string; name: string } }>("/api/me");
        return { data: { user: me.user }, error: null };
      } catch (e) {
        return { data: { user: null }, error: toDataError(e) };
      }
    },
  },
  storage: { from: storageBucket },
  functions: {
    async invoke(name: string): Promise<{ data: any; error: DataError | null }> {
      const path = FUNCTIONS[name];
      if (!path) return { data: null, error: { message: `La función «${name}» no existe` } };
      try {
        return { data: await apiFetch(path), error: null };
      } catch (e) {
        return { data: null, error: toDataError(e) };
      }
    },
  },
};
