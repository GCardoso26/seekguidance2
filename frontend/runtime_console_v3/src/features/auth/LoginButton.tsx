"use client";

import { useJudgeAuth } from "@/features/auth/AuthProvider";

export function LoginButton() {
  const { configured, loading, user, signInWithGoogle } = useJudgeAuth();

  if (!configured || user || loading) return null;

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 hover:text-primary"
    >
      Entrar com Google
    </button>
  );
}
