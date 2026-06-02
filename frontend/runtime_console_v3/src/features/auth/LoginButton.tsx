"use client";

import { useJudgeAuth } from "@/features/auth/AuthProvider";

export function LoginButton() {
  const { configured, loading, user, signInWithGoogle } = useJudgeAuth();

  if (!configured || user || loading) return null;

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="rounded-full border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-xs font-semibold text-[hsl(222_20%_35%)] transition hover:shadow-sm"
    >
      Entrar com Google
    </button>
  );
}
