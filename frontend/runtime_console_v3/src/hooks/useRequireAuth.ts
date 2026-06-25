"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

/**
 * Redireciona para /entrar quando não autenticado (useEffect — seguro em SSR).
 */
export function useRequireAuth(returnPath: string) {
  const router = useRouter();
  const { user, loading } = useJudgeAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/entrar?next=${encodeURIComponent(returnPath)}`);
    }
  }, [loading, user, router, returnPath]);

  return { user, loading, isAuthenticated: Boolean(user) };
}
