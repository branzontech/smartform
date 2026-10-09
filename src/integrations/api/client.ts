import { currentEnvironment } from "@/config/environments";

/**
 * Cliente HTTP de la API propia (smartform-backend). Fuera de este archivo
 * nadie escribe `fetch` contra la API ni conoce la URL base.
 *
 * Por defecto la API está en el mismo origen que la web, bajo /api: en local
 * lo resuelve el proxy de Vite y en Railway el servidor de la web. Así la
 * cookie de sesión es de primera parte. El ambiente elegido en el login añade
 * su prefijo (p. ej. /env/produccion). VITE_API_URL solo hace falta si la API
 * se sirve en otro dominio.
 */
export function apiBaseUrl(): string {
  const fixed = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");
  return fixed || currentEnvironment().apiBase;
}

/** Evento: el servidor respondió 401 (sesión caducada o cerrada en otro lado). */
export const SESSION_EXPIRED = "kerhub:session-expired";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Petición a la API con la cookie de sesión. Devuelve el JSON ya parseado o
 * lanza `ApiError` con el estado y el cuerpo de error.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers, credentials: "include" });
  if (res.status === 401 && !path.startsWith("/api/auth/")) window.dispatchEvent(new CustomEvent(SESSION_EXPIRED));
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const errorText = body && typeof body === "object" && "error" in body ? (body as { error: unknown }).error : null;
    throw new ApiError(res.status, typeof errorText === "string" ? errorText : `Error ${res.status}`, body);
  }
  return body as T;
}

/** URL pública de un archivo servido por la API (logo, avatar, firma). */
export function fileUrl(bucket: string, path: string): string {
  return `${apiBaseUrl()}/api/files/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
