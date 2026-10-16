import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError, SESSION_EXPIRED } from "@/integrations/api/client";
import { getAuthClient } from "@/integrations/auth/client";

/**
 * Sesión de Doctor Ker sobre la API propia (Better Auth + /api/me). Conserva la
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

/** Empresa (IPS, consultorio) a la que pertenece el usuario, con su rol en ella. */
export interface Company {
  id: string;
  nombre: string;
  rol: string;
  /** Solo en la empresa activa: estado de su licencia. */
  licencia?: { estado: string; acceso: boolean; graciaHasta?: string } | null;
  licenciaFin?: string | null;
}

/** Empresa a la que pertenece pero no puede entrar, y por qué. */
export interface CompanyBlock {
  nombre: string;
  estado: "pendiente" | "suspendida" | "por_iniciar" | "vencida" | string;
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
  /** Empresa activa: todos los datos que se ven y se escriben son de ella. */
  company: Company | null;
  companies: Company[];
  /** Sin empresa con acceso: las empresas del usuario que están bloqueadas. */
  blocks: CompanyBlock[];
  /** Dueño de la plataforma (Branzon): gestiona empresas e invitaciones. */
  isPlatformAdmin: boolean;
  /** Cambia de empresa y recarga la app para no mezclar datos en pantalla. */
  switchCompany: (companyId: string) => Promise<void>;
}

interface Me {
  user: AuthUser;
  profile: Profile | null;
  roles: string[];
  empresa: Company | null;
  empresas: Company[];
  bloqueos?: CompanyBlock[];
  isPlatformAdmin: boolean;
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
  company: null,
  companies: [],
  blocks: [],
  isPlatformAdmin: false,
  switchCompany: async () => {},
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => useContext(AuthContext) ?? defaultAuthContext;

const toError = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
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
    // Nada en caché de una sesión a otra: el siguiente usuario puede ser de otra empresa.
    const onExpired = () => {
      queryClient.clear();
      setMe(null);
    };
    window.addEventListener(SESSION_EXPIRED, onExpired);
    return () => {
      alive = false;
      window.removeEventListener(SESSION_EXPIRED, onExpired);
    };
  }, [loadMe, queryClient]);

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
      queryClient.clear();
      setMe(null);
    }
  }, [queryClient]);

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

  const switchCompany = useCallback(async (companyId: string) => {
    try {
      await apiFetch("/api/me/empresa", { method: "POST", body: JSON.stringify({ empresaId: companyId }) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar de empresa.");
      return;
    }
    // Recarga completa: nada en memoria (caché, formularios abiertos) de la empresa anterior.
    window.location.assign("/app/home");
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
      company: me?.empresa ?? null,
      companies: me?.empresas ?? [],
      blocks: me?.bloqueos ?? [],
      isPlatformAdmin: !!me?.isPlatformAdmin,
      switchCompany,
    };
  }, [me, isLoading, signIn, signOut, resetPassword, updatePassword, loadMe, switchCompany]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
