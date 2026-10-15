import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, setSessionExpiredHandler, signIn as apiSignIn, signOut as apiSignOut, type Me } from './api';
import { readToken } from './session';

interface AuthState {
  loading: boolean;
  me: Me | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);

  const load = useCallback(async () => {
    if (!(await readToken())) return setMe(null);
    try {
      setMe(await fetchMe());
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      queryClient.clear();
      setMe(null);
    });
    load().finally(() => setLoading(false));
  }, [load, queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      me,
      signIn: async (email, password) => {
        await apiSignIn(email, password);
        queryClient.clear();
        await load();
      },
      signOut: async () => {
        await apiSignOut();
        queryClient.clear();
        setMe(null);
      },
    }),
    [loading, me, load, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
}
