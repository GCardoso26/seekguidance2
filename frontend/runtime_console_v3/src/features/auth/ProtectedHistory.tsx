"use client";

import type { ReactNode } from "react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

/** Renderiza histórico cloud apenas com utilizador autenticado. */
export function ProtectedHistory({ children, fallback = null }: Props) {
  const { user, loading, configured } = useJudgeAuth();
  if (!configured || loading || !user) return <>{fallback}</>;
  return <>{children}</>;
}
