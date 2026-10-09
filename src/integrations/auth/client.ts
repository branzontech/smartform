/**
 * Cliente de identidad (Better Auth) contra la API de Ker Hub. La sesión es
 * una cookie que emite la API en el mismo origen que la web (/api/auth).
 *
 * Hay un cliente por ambiente: el que se elija en el login decide a qué API
 * se entra. Se pasa la ruta completa porque, si la URL ya trae ruta, Better
 * Auth ignora `basePath`.
 */
import { createAuthClient } from "better-auth/react";
import { apiBaseUrl } from "@/integrations/api/client";

type AuthClient = ReturnType<typeof createAuthClient>;

const clients = new Map<string, AuthClient>();

export function getAuthClient(): AuthClient {
  const base = apiBaseUrl();
  const cached = clients.get(base);
  if (cached) return cached;
  const origin = /^https?:\/\//.test(base) ? "" : window.location.origin;
  const client = createAuthClient({
    baseURL: `${origin}${base}/api/auth`,
    fetchOptions: { credentials: "include" },
  });
  clients.set(base, client);
  return client;
}
