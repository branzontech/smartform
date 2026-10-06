/**
 * Cliente de identidad (Better Auth) contra la API de Ker Hub. La sesión es
 * una cookie que emite la API en el mismo origen que la web (/api/auth).
 */
import { createAuthClient } from "better-auth/react";
import { API_BASE_URL } from "@/integrations/api/client";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL || window.location.origin,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
});
