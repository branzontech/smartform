import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, ApiError, SESSION_EXPIRED } from "@/integrations/api/client";
import { getAuthClient } from "@/integrations/auth/client";

/**
 * Sesión de Ker Hub sobre la API propia (Better Auth + /api/me). Conserva la
 * interfaz que usaba el resto de la app con Supabase: user, profile, roles,
 * signIn, signOut, resetPassword, updatePassword, hasRole.
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  specialty: string | null;
  license_number: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  profile: Profile | null;
  roles: string[];
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  /** Cambia la contraseña con el token del enlace de restablecimiento (?token=). */
  updatePassword: (password: string, token: string) => Promise<{ error: Error | null }>;
  hasRole: (role: string) => boolean;
  refreshProfile: () => Promise<void>;
}

interface Me {
  user: AuthUser;
  profile: Profile | null;
  roles: string[];
}

const notMounted = async () => ({ error: new Error("AuthProvider no está montado") });

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  roles: [],
  isLoading: true,
  signIn: notMounted,
  signOut: async () => {},
  resetPassword: notMounted,
  updatePassword: notMounted,
  hasRole: () => false,
  refreshProfile: async () => {},
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => useContext(AuthContext) ?? defaultAuthContext;

const toError = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Lee quién soy. Sin sesión, la API responde 401 y queda en null. */
  const loadMe = useCallback(async () => {
    try {
      setMe(await apiFetch<Me>("/api/me"));
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) console.error("[auth] no se pudo leer la sesión:", e);
      setMe(null);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    loadMe().finally(() => {
      if (alive) setIsLoading(false);
    });
    // Si la API dice que la sesión murió (caducó o se cerró en otro lado), se olvida aquí también.
    const onExpired = () => setMe(null);
    window.addEventListener(SESSION_EXPIRED, onExpired);
    return () => {
      alive = false;
      window.removeEventListener(SESSION_EXPIRED, onExpired);
    };
  }, [loadMe]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await getAuthClient().signIn.email({ email, password });
      if (error) return { error: new Error(error.message ?? "No fue posible iniciar sesión") };
      await loadMe();
      return { error: null };
    },
    [loadMe],
  );

  const signOut = useCallback(async () => {
    try {
      await getAuthClient().signOut({});
    } finally {
      // Los borradores de consulta tienen datos clínicos: no quedan en el equipo al salir.
      try {
        Object.keys(localStorage).filter((k) => k.startsWith("kerhub-draft-")).forEach((k) => localStorage.removeItem(k));
      } catch { /* almacenamiento no disponible */ }
      setMe(null);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await getAuthClient().requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/app/reset-password`,
      });
      return { error: error ? new Error(error.message ?? "No fue posible enviar el enlace") : null };
    } catch (e) {
      return { error: toError(e) };
    }
  }, []);

  const updatePassword = useCallback(async (password: string, token: string) => {
    try {
      const { error } = await getAuthClient().resetPassword({ newPassword: password, token });
      return { error: error ? new Error(error.message ?? "No fue posible cambiar la contraseña") : null };
    } catch (e) {
      return { error: toError(e) };
    }
  }, []);

  const value = useMemo<AuthContextType>(() => {
    const roles = me?.roles ?? [];
    return {
      user: me?.user ?? null,
      session: me ? { user: me.user } : null,
      profile: me?.profile ?? null,
      roles,
      isLoading,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      hasRole: (role: string) => roles.includes(role),
      refreshProfile: loadMe,
    };
  }, [me, isLoading, signIn, signOut, resetPassword, updatePassword, loadMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
