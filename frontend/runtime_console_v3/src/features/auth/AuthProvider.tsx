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
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import {
  clearOAuthRedirectState,
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
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const hasMigratedRef = useRef(false);

  const maybeRedirectAfterOAuth = useCallback(
    (activeUser: User | null, event?: string) => {
      if (!activeUser) return;

      const isOAuthEvent =
        event === undefined || event === "SIGNED_IN" || event === "INITIAL_SESSION";
      if (!isOAuthEvent) return;

      const redirectTarget = tryConsumeOAuthRedirect();
      if (redirectTarget) {
        if (process.env.NODE_ENV === "development") {
          console.log("[Auth] OAuth redirect →", redirectTarget, event ?? "getSession");
        }
        router.replace(redirectTarget);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. Sessão inicial — cobre INITIAL_SESSION antes do listener
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      maybeRedirectAfterOAuth(data.session?.user ?? null);
    });

    // 2. Mudanças de auth — SIGNED_IN e INITIAL_SESSION
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

  const signInWithGoogle = useCallback(
    async (path = "/judge") => {
      if (!supabase) return;
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

  const signOut = useCallback(async () => {
    if (!supabase) return;
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
      signOut,
    }),
    [user, session, loading, configured, signInWithGoogle, signOut],
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
      signOut: async () => {},
    };
  }
  return ctx;
}
