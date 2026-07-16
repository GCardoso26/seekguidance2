"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiClients } from "@/src/api";
import {
  clearSession,
  getAccessToken,
  getCurrentUser,
  getRefreshToken,
  hasSessionMaterial,
  isAccessTokenExpired,
  loadPersistedUserMeta,
} from "@/src/auth/session";
import type {
  AuthState,
  CurrentUser,
  LoginInput,
  RegisterInput,
  UserResponse,
} from "@/src/types/auth";

interface AuthContextValue {
  state: AuthState;
  user: CurrentUser | null;
  register: (input: RegisterInput) => Promise<UserResponse>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const { authApi, http } = getApiClients();

  const syncFromSession = useCallback(() => {
    const u = getCurrentUser();
    if (u && getAccessToken()) {
      setUser(u);
      setState("authenticated");
    } else {
      setUser(null);
      setState("anonymous");
    }
  }, []);

  const refresh = useCallback(async () => {
    await authApi.refresh();
    syncFromSession();
  }, [authApi, syncFromSession]);

  useEffect(() => {
    http.setUnauthorizedHandler(async () => {
      clearSession();
      setUser(null);
      setState("anonymous");
    });
  }, [http]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!hasSessionMaterial()) {
        if (!cancelled) {
          setState("anonymous");
          setUser(null);
        }
        return;
      }

      // Hydrate meta for display while refreshing
      loadPersistedUserMeta();

      if (getAccessToken() && !isAccessTokenExpired() && getCurrentUser()) {
        if (!cancelled) syncFromSession();
        return;
      }

      if (!getRefreshToken()) {
        clearSession();
        if (!cancelled) {
          setState("anonymous");
          setUser(null);
        }
        return;
      }

      try {
        await authApi.refresh();
        if (!cancelled) syncFromSession();
      } catch {
        clearSession();
        if (!cancelled) {
          setState("anonymous");
          setUser(null);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [authApi, syncFromSession]);

  const register = useCallback(
    async (input: RegisterInput) => {
      return authApi.register(input);
    },
    [authApi],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      await authApi.login(input);
      syncFromSession();
    },
    [authApi, syncFromSession],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setState("anonymous");
  }, [authApi]);

  const value = useMemo<AuthContextValue>(
    () => ({ state, user, register, login, logout, refresh }),
    [state, user, register, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
