"use client";

import { useJudgeAuth } from "@/features/auth/AuthProvider";

export function LoginButton() {
  const { configured, loading, user, signInWithGoogle } = useJudgeAuth();

  if (!configured || user || loading) return null;

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
    >
      Entrar com Google
    </button>
  );
}
