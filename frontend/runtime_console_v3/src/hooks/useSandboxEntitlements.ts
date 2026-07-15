"use client";

import { useCallback, useEffect, useState } from "react";
import { canElevateSandbox } from "@/lib/app-mode";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

export type SandboxStatus = {
  mode: string;
  elevated: boolean;
  demos: {
    store: boolean;
    events: boolean;
    financial: boolean;
    tournament: boolean;
    analytics: boolean;
  };
};

const DEFAULT: SandboxStatus = {
  mode: "development",
  elevated: false,
  demos: {
    store: false,
    events: false,
    financial: false,
    tournament: false,
    analytics: false,
  },
};

export function useSandboxEntitlements() {
  const { user, session } = useJudgeAuth();
  const [status, setStatus] = useState<SandboxStatus>(DEFAULT);

  const refresh = useCallback(async () => {
    if (!canElevateSandbox() || !user) {
      setStatus(DEFAULT);
      return;
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      if (user.id) headers["X-Judge-User-Id"] = user.id;
      if (user.email) headers["X-Judge-User-Email"] = user.email;
      const res = await fetch("/api/sandbox/status", { headers, cache: "no-store" });
      if (!res.ok) {
        setStatus({
          ...DEFAULT,
          mode: "sandbox",
          elevated: Boolean(user.email),
          demos: {
            store: true,
            events: true,
            financial: true,
            tournament: true,
            analytics: true,
          },
        });
        return;
      }
      setStatus((await res.json()) as SandboxStatus);
    } catch {
      setStatus({
        ...DEFAULT,
        elevated: canElevateSandbox(),
        demos: {
          store: true,
          events: true,
          financial: true,
          tournament: true,
          analytics: true,
        },
      });
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...status, refresh, allFeaturesUnlocked: status.elevated || canElevateSandbox() };
}
