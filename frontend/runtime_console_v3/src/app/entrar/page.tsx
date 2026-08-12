"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Scale, ShoppingBag, Store } from "lucide-react";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { normalizeInternalPath } from "@/lib/auth/safe-path";

function EntrarForm() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent"); // buy | sell
  const rawNext = searchParams.get("next");
  const sellFlow =
    intent === "sell" || (rawNext != null && (rawNext.startsWith("/vender") || rawNext.startsWith("/vendedor")));
  const buyFlow = intent === "buy" || (!sellFlow && rawNext != null);
  const showChooser = !sellFlow && !buyFlow;

  const afterCpf = normalizeInternalPath(
    rawNext ?? (sellFlow ? "/vender" : "/loja"),
    sellFlow ? "/vender" : "/loja",
  );
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

  if (showChooser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Scale className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">JudgeTCG</p>
              <h1 className="text-lg font-medium text-foreground">Como você quer começar?</h1>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/entrar?intent=buy&next=/loja"
              className="rounded-xl border border-border bg-background p-5 transition hover:border-primary/40 hover:bg-muted/40"
            >
              <ShoppingBag className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Comprar no JudgeTCG</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Conta de comprador — CPF no perfil. Sem loja, sem plano seller.
              </p>
            </Link>
            <Link
              href="/vender"
              className="rounded-xl border border-border bg-background p-5 transition hover:border-primary/40 hover:bg-muted/40"
            >
              <Store className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Vender no JudgeTCG</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Credenciamento de hobby store com CNPJ — não é signup de vendedor.
              </p>
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/entrar?intent=buy&next=/perfil" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Scale className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Judge TCG</p>
            <h1 className="text-lg font-medium text-foreground">
              {sellFlow
                ? mode === "login"
                  ? "Entrar para credenciar"
                  : "Conta para credenciamento"
                : mode === "login"
                  ? "Entrar para comprar"
                  : "Criar conta de comprador"}
            </h1>
          </div>
        </div>

        {sellFlow && (
          <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Vender exige CNPJ e aprovação. Isso não transforma sua conta de comprador em loja
            automaticamente.{" "}
            <Link href="/vender" className="text-primary underline">
              Saiba mais
            </Link>
          </p>
        )}

        <GoogleLoginButton redirectTo={nextPath} />

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
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aguarde…" : mode === "login" ? "Entrar com e-mail" : "Continuar"}
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
          {sellFlow
            ? "Compradores usam CPF no perfil; a loja é uma Organization com CNPJ."
            : "Após o registro você validará seu CPF para comprar."}
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href="/entrar" className="text-primary hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <EntrarForm />
    </Suspense>
  );
}
