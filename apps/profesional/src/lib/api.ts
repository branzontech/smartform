import { createAgendaApi, type Fetcher } from '@kerhub/core/agenda';
import { API_URL } from './config';
import { clearToken, readToken, saveToken } from './session';

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

/** Petición a Ker Hub con el token del profesional (cabecera Authorization: Bearer). */
export const fetcher: Fetcher = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = await readToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
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

export interface Me {
  user: { id: string; email: string; name: string };
  empresa: { id: string; nombre: string; rol: string } | null;
  bloqueos?: { nombre: string; estado: string }[];
}

export const fetchMe = () => fetcher<Me>('/api/me');

/** Entra con correo y contraseña; el servidor devuelve el token en la cabecera set-auth-token. */
export async function signIn(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const token = res.headers.get('set-auth-token');
  if (!res.ok || !token) {
    throw new ApiError(res.status, res.status === 401 ? 'Correo o contraseña incorrectos.' : 'No pudimos iniciar sesión. Intenta de nuevo.');
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
