"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Scale } from "lucide-react";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { normalizeInternalPath } from "@/lib/auth/safe-path";

function EntrarForm() {
  const searchParams = useSearchParams();
  const afterCpf = normalizeInternalPath(searchParams.get("next") ?? "/perfil", "/perfil");
  const nextPath = `/completar-perfil?next=${encodeURIComponent(afterCpf)}`;
  const { signInWithEmail, signUpWithEmail } = useJudgeAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const { needsEmailConfirmation } = await signUpWithEmail(email.trim(), password);
        if (needsEmailConfirmation) {
          setError("Confirme seu e-mail antes de continuar. Verifique sua caixa de entrada.");
          return;
        }
        window.location.href = nextPath;
        return;
      }
      await signInWithEmail(email.trim(), password);
      window.location.href = nextPath;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha na autenticação";
      if (msg.toLowerCase().includes("already registered")) {
        setError("E-mail já cadastrado. Faça login ou recupere sua senha.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-luxury-onyx p-4 text-luxury-frost">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-luxury-obsidian p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-luxury-gold/30 bg-luxury-gold/10">
            <Scale className="h-5 w-5 text-luxury-gold" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-luxury-mist">Judge TCG</p>
            <h1 className="text-lg font-medium text-luxury-frost">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h1>
          </div>
        </div>

        <GoogleLoginButton redirectTo={nextPath} />

        <div className="my-6 flex items-center gap-3 text-xs text-luxury-mist">
          <div className="h-px flex-1 bg-white/10" />
          ou e-mail
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={(e) => void handleEmailAuth(e)} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder="Senha (mín. 8 caracteres)"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aguarde…" : mode === "login" ? "Entrar com e-mail" : "Registrar"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-luxury-gold underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Não tem conta? Registre-se" : "Já tem conta? Entrar"}
        </button>

        <p className="mt-6 text-center text-xs text-luxury-mist">
          Após o registro você precisará validar seu CPF para comprar ou vender.
        </p>
        <p className="mt-2 text-center text-xs text-luxury-mist">
          <Link href="/" className="text-luxury-gold hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-onyx" />}>
      <EntrarForm />
    </Suspense>
  );
}
