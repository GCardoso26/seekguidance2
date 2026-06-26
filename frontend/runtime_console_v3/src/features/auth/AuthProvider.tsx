"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import {
  clearOAuthRedirectState,
  isOAuthReturnPath,
  performOAuthRedirect,
  setOAuthRedirectTarget,
  tryConsumeOAuthRedirect,
} from "@/lib/auth/oauth-redirect";
import { buildOAuthCallbackUrl } from "@/lib/app-url";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { migrateLocalStorageHistory } from "@/features/auth/historyMigration";
import { recordGrowthEvent } from "@/services/judgeGrowthApi";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const hasMigratedRef = useRef(false);
  const redirectAttemptedRef = useRef(false);

  const maybeRedirectAfterOAuth = useCallback(
    (activeUser: User | null, event?: string) => {
      if (!activeUser || redirectAttemptedRef.current) return;
      if (typeof window === "undefined") return;

      const isOAuthEvent =
        event === undefined || event === "SIGNED_IN" || event === "INITIAL_SESSION";
      if (!isOAuthEvent) return;

      // Só redireciona na home/callback — preserva flags se cair brevemente em /judge
      if (!isOAuthReturnPath(window.location.pathname)) return;

      const redirectTarget = tryConsumeOAuthRedirect();
      if (!redirectTarget) return;

      redirectAttemptedRef.current = true;
      if (process.env.NODE_ENV === "development") {
        console.log("[Auth] OAuth redirect →", redirectTarget, event ?? "getSession");
      }
      performOAuthRedirect(redirectTarget);
    },
    [],
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      maybeRedirectAfterOAuth(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        void recordGrowthEvent({ metric_type: "login" });
      }

      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        maybeRedirectAfterOAuth(nextSession?.user ?? null, event);
      }

      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        nextSession?.user &&
        !hasMigratedRef.current
      ) {
        hasMigratedRef.current = true;
        await migrateLocalStorageHistory(nextSession.user.id).catch((err) =>
          console.warn("Migração de histórico falhou (não crítico):", err),
        );
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase, maybeRedirectAfterOAuth]);

  // Re-tenta redirect se navegação client-side cair em / sem remount (ex.: bounce /judge → /)
  useEffect(() => {
    if (loading || !user) return;
    maybeRedirectAfterOAuth(user);
  }, [pathname, user, loading, maybeRedirectAfterOAuth]);

  const signInWithGoogle = useCallback(
    async (path = "/judge") => {
      if (!supabase) return;
      redirectAttemptedRef.current = false;
      const nextPath = path.startsWith("/") ? path : `/${path}`;
      setOAuthRedirectTarget(nextPath);
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const redirectTo = path.startsWith("http") ? path : buildOAuthCallbackUrl(nextPath, origin);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
    },
    [supabase],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Auth não configurado");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [supabase],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Auth não configurado");
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    redirectAttemptedRef.current = false;
    clearOAuthRedirectState();
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      configured,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      signOut,
    }),
    [user, session, loading, configured, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useJudgeAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      session: null,
      loading: false,
      configured: false,
      signInWithGoogle: async () => {},
      signUpWithEmail: async () => ({ needsEmailConfirmation: false }),
      signInWithEmail: async () => {},
      signOut: async () => {},
    };
  }
  return ctx;
}
