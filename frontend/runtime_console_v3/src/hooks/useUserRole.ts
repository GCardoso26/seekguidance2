"use client";

import { useEffect, useState } from "react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  canAccessIngestion,
  isConsoleAdminRole,
  isJudgeUser,
  isSupabaseAdminUser,
} from "@/lib/judge-rbac";
import { fetchJudgeMe, type JudgeMeResponse } from "@/services/judgeMeApi";
import { useAuthStore } from "@/stores/auth-store";

const ANONYMOUS: JudgeMeResponse = {
  user_id: null,
  username: null,
  email: null,
  role: "anonymous",
  is_admin: false,
  can_ingest: false,
};

type ConsoleSession = {
  authenticated: boolean;
  role: string;
  username: string | null;
  is_admin: boolean;
};

async function fetchConsoleSession(): Promise<ConsoleSession> {
  const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
  if (!res.ok) return { authenticated: false, role: "anonymous", username: null, is_admin: false };
  return res.json() as Promise<ConsoleSession>;
}

export function useUserRole() {
  const { user: judgeUser, loading: judgeLoading } = useJudgeAuth();
  const consoleAuth = useAuthStore((s) => s.isAuthenticated);
  const consoleRole = useAuthStore((s) => s.role);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const [apiMe, setApiMe] = useState<JudgeMeResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setApiLoading(true);
      try {
        const [session, me] = await Promise.all([
          fetchConsoleSession(),
          fetchJudgeMe().catch(() => ANONYMOUS),
        ]);
        if (cancelled) return;

        const sessionRole =
          session.authenticated && session.role !== "anonymous" ? session.role : null;
        const meRole = me.role !== "anonymous" ? me.role : null;
        const storeRole = useAuthStore.getState().role;
        const effectiveRole = meRole ?? sessionRole ?? storeRole;

        if (session.authenticated || meRole) {
          const current = useAuthStore.getState();
          if (!current.isAuthenticated || current.role !== effectiveRole) {
            setAuthenticated({
              username: me.username ?? session.username ?? undefined,
              tenantId: "default",
              role: effectiveRole ?? undefined,
            });
          }
        }

        setApiMe(
          meRole || session.authenticated
            ? {
                ...me,
                role: effectiveRole ?? "anonymous",
                is_admin:
                  me.is_admin || session.is_admin || isConsoleAdminRole(effectiveRole),
                username: me.username ?? session.username,
              }
            : ANONYMOUS,
        );
      } catch {
        if (!cancelled) setApiMe(ANONYMOUS);
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // Sessão console vem do cookie HttpOnly — recarregar ao montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const supabaseAdmin = isSupabaseAdminUser(judgeUser);

  const resolvedRole =
    apiMe && apiMe.role !== "anonymous"
      ? apiMe.role
      : consoleAuth && consoleRole
        ? consoleRole
        : null;

  const consoleAdmin = isConsoleAdminRole(resolvedRole);
  const isAdmin = supabaseAdmin || consoleAdmin || Boolean(apiMe?.is_admin);
  const isOperator = resolvedRole === "operator";
  const canIngest =
    Boolean(apiMe?.can_ingest) || canAccessIngestion(resolvedRole) || isAdmin;

  const role = supabaseAdmin
    ? "admin"
    : resolvedRole && resolvedRole !== "anonymous"
      ? resolvedRole
      : judgeUser
        ? "player"
        : "anonymous";

  const isJudge = isJudgeUser(judgeUser, role) || isAdmin;

  return {
    role,
    isAdmin,
    isJudge,
    isOperator,
    isPlayer: Boolean(judgeUser) && !isAdmin,
    canIngest,
    loading: judgeLoading || apiLoading || !hydrated,
    judgeUser,
    apiMe,
  };
}
