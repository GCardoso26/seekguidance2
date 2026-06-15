"use client";

import { useJudgeAuth } from "@/features/auth/AuthProvider";

export function LoginButton() {
  const { configured, loading, user, signInWithGoogle } = useJudgeAuth();

  if (!configured || user || loading) return null;

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="rounded-full border border-luxury-gold/30 bg-luxury-gold/10 px-3 py-1.5 text-xs font-semibold text-luxury-gold transition hover:bg-luxury-gold/20 hover:text-luxury-gold-light"
    >
      Entrar com Google
    </button>
  );
}
