"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Scale } from "lucide-react";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { readEntrarNext } from "@/lib/auth/entrar-path";
import {
  type AccountStatusPayload,
  resolvePostAuthPath,
} from "@/hooks/useAccountStatus";

async function fetchAccountStatus(): Promise<AccountStatusPayload | undefined> {
  try {
    const res = await fetch("/api/account/status", { credentials: "include" });
    if (!res.ok) return undefined;
    return (await res.json()) as AccountStatusPayload;
  } catch {
    return undefined;
  }
}

function EntrarForm() {
  const searchParams = useSearchParams();
  const afterCpf = readEntrarNext((k) => searchParams.get(k), "/perfil");
  /** Google/OAuth: completar-perfil redireciona sozinho se o documento já estiver ativo. */
  const oauthGatePath = `/completar-perfil?next=${encodeURIComponent(afterCpf)}`;
  const { signInWithEmail, signUpWithEmail } = useJudgeAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const { needsEmailConfirmation } = await signUpWithEmail(email.trim(), password);
        if (needsEmailConfirmation) {
          setInfo(
            "Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, volte aqui para entrar.",
          );
          return;
        }
        window.location.href = resolvePostAuthPath(undefined, afterCpf);
        return;
      }
      await signInWithEmail(email.trim(), password);
      const status = await fetchAccountStatus();
      window.location.href = resolvePostAuthPath(status, afterCpf);
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
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Scale className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Judge TCG</p>
            <h1 className="text-lg font-medium text-foreground">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h1>
          </div>
        </div>

        <GoogleLoginButton redirectTo={oauthGatePath} />

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-muted" />
          ou e-mail
          <div className="h-px flex-1 bg-muted" />
        </div>

        <form onSubmit={(e) => void handleEmailAuth(e)} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail"
            className="w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder="Senha (mín. 8 caracteres)"
            className="w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-foreground" role="status">
              {info}
            </p>
          )}
          <Button type="submit" className="w-full min-h-11 text-body" disabled={loading}>
            {loading ? "Aguarde…" : mode === "login" ? "Entrar com e-mail" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-primary underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Não tem conta? Registre-se" : "Já tem conta? Entrar"}
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Após o registro você precisará validar seu CPF para comprar ou vender.
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function EntrarPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
          <span className="sr-only">Carregando…</span>
        </main>
      }
    >
      <EntrarForm />
    </Suspense>
  );
}
