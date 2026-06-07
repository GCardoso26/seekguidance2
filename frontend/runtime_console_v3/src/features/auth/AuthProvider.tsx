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
import type { Session, User } from "@supabase/supabase-js";
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const hasMigratedRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void recordGrowthEvent({ metric_type: "login" });
      }
      if (event === "SIGNED_IN" && nextSession?.user && !hasMigratedRef.current) {
        hasMigratedRef.current = true;
        await migrateLocalStorageHistory(nextSession.user.id).catch((err) =>
          console.warn("Migração de histórico falhou (não crítico):", err),
        );
      }
      if (event === "SIGNED_IN" && nextSession?.user && typeof window !== "undefined") {
        const pending = sessionStorage.getItem("oauth_next");
        if (pending) {
          sessionStorage.removeItem("oauth_next");
          const path = window.location.pathname;
          if (path === "/" || path === "/auth/callback") {
            window.location.replace(pending.startsWith("/") ? pending : `/${pending}`);
          }
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signInWithGoogle = useCallback(
    async (path = "/judge") => {
      if (!supabase) return;
      const nextPath = path.startsWith("/") ? path : `/${path}`;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("oauth_next", nextPath);
      }
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
