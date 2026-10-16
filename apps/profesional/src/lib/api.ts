import { createAgendaApi, type Fetcher } from '@kerhub/core/agenda';
import { createAttentionApi, createFormatsApi } from '@kerhub/core/forms';
import { CONTENT_BUCKET, apiFileUrl, createContentApi } from '@kerhub/core/contenido';
import { createOrdersApi } from '@kerhub/core/ordenes';
import { clearToken, currentEnvironment, readToken, saveToken } from './session';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Avisa a la app cuando el servidor da la sesión por terminada. */
let onExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (handler: () => void) => {
  onExpired = handler;
};

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Petición a Doctor Ker con el token del profesional (cabecera Authorization: Bearer). */
export const fetcher: Fetcher = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = await readToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // Sin cookies: la sesión va solo en el token. Una cookie guardada por el teléfono
  // hace que el servidor exija un «Origin» que una app nativa no envía.
  const res = await fetch(`${currentEnvironment().url}${path}`, { ...init, headers, credentials: 'omit' });
  const body = await parse(res);
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    await clearToken();
    onExpired?.();
  }
  if (!res.ok) {
    const message = body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : `Error ${res.status}`;
    throw new ApiError(res.status, message);
  }
  return body as T;
};

export const agenda = createAgendaApi(fetcher);
export const attention = createAttentionApi(fetcher);
export const formats = createFormatsApi(fetcher);
export const orders = createOrdersApi(fetcher);
export const content = createContentApi(fetcher);

/** Imagen de una publicación, servida por la API del ambiente activo. */
export const contentImageUrl = (path: string) => apiFileUrl(currentEnvironment().url, CONTENT_BUCKET, path);

/**
 * Logo de la institución. La web lo guarda con la dirección de la API desde la que se subió;
 * se toma solo la ruta del archivo para servirlo desde el ambiente activo.
 */
export function institutionLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const at = url.indexOf('/api/files/');
  if (at >= 0) return `${currentEnvironment().url}${url.slice(at)}`;
  return url.startsWith('https://') ? url : null;
}

export interface Me {
  user: { id: string; email: string; name: string };
  empresa: { id: string; nombre: string; rol: string } | null;
  bloqueos?: { nombre: string; estado: string }[];
}

export const fetchMe = () => fetcher<Me>('/api/me');

/** Entra con correo y contraseña; el servidor devuelve el token en la cabecera set-auth-token. */
export async function signIn(email: string, password: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${currentEnvironment().url}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(0, `No hay conexión con ${currentEnvironment().label}. Revisa que el teléfono y el computador estén en la misma red.`);
  }
  const token = res.headers.get('set-auth-token');
  if (res.status === 401) throw new ApiError(401, `Correo o contraseña incorrectos en ${currentEnvironment().label}.`);
  if (res.status === 429) throw new ApiError(429, 'Demasiados intentos. Espera un minuto y vuelve a intentar.');
  if (!res.ok || !token) {
    // El motivo del servidor (p. ej. «Missing or null Origin») ayuda a saber qué pasó.
    const body = await parse(res);
    const reason = body && typeof body === 'object' ? ((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error) : null;
    throw new ApiError(res.status, `No pudimos iniciar sesión (${res.status}${reason ? `: ${reason}` : ''}). Intenta de nuevo.`);
  }
  await saveToken(token);
}

export async function signOut(): Promise<void> {
  try {
    await fetcher('/api/auth/sign-out', { method: 'POST', body: '{}' });
  } catch {
    // Aunque el servidor no responda, la sesión se borra del teléfono.
  }
  await clearToken();
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Algo salió mal. Intenta de nuevo.');
