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

export function useUserRole() {
  const { user: judgeUser, loading: judgeLoading } = useJudgeAuth();
  const consoleAuth = useAuthStore((s) => s.isAuthenticated);
  const consoleRole = useAuthStore((s) => s.role);
  const [apiMe, setApiMe] = useState<JudgeMeResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (!consoleAuth) {
      setApiMe(null);
      return;
    }
    let cancelled = false;
    setApiLoading(true);
    fetchJudgeMe()
      .then((me) => {
        if (!cancelled) setApiMe(me);
      })
      .catch(() => {
        if (!cancelled) setApiMe(ANONYMOUS);
      })
      .finally(() => {
        if (!cancelled) setApiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [consoleAuth]);

  const supabaseAdmin = isSupabaseAdminUser(judgeUser);
  const consoleAdmin = isConsoleAdminRole(apiMe?.role ?? consoleRole);
  const isAdmin = supabaseAdmin || consoleAdmin || Boolean(apiMe?.is_admin);
  const isOperator = apiMe?.role === "operator" || consoleRole === "operator";
  const canIngest =
    Boolean(apiMe?.can_ingest) || canAccessIngestion(apiMe?.role ?? consoleRole) || isAdmin;

  const role = supabaseAdmin
    ? "admin"
    : apiMe?.role && apiMe.role !== "anonymous"
      ? apiMe.role
      : consoleRole ?? (judgeUser ? "player" : "anonymous");

  const isJudge = isJudgeUser(judgeUser, role) || isAdmin;

  return {
    role,
    isAdmin,
    isJudge,
    isOperator,
    isPlayer: Boolean(judgeUser) && !isAdmin,
    canIngest,
    loading: judgeLoading || apiLoading,
    judgeUser,
    apiMe,
  };
}
