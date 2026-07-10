"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { normalizeInternalPath } from "@/lib/auth/safe-path";
import { formatCpfMask, isValidCpf } from "@/lib/kyc/cpf";

function CompletarPerfilForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterPath = normalizeInternalPath(searchParams.get("next") ?? "/onboarding", "/onboarding");
  const { user, session, loading } = useJudgeAuth();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cpfDuplicate, setCpfDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-md p-8 text-center text-muted-foreground">
        <p>Faça login para continuar.</p>
        <Link href="/entrar?next=/completar-perfil" className="mt-4 inline-block text-primary underline">
          Entrar
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCpfDuplicate(false);
    if (!isValidCpf(cpf)) {
      setError("CPF inválido. Verifique os dígitos.");
      return;
    }
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/account/cpf", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ cpf }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: unknown };
      if (!res.ok) {
        const detail = data.detail;
        if (typeof detail === "object" && detail && "code" in detail) {
          const coded = detail as { code?: string; message?: string };
          if (coded.code === "cpf_already_registered") {
            setCpfDuplicate(true);
            throw new Error(coded.message ?? "CPF já cadastrado em outra conta.");
          }
          if (coded.message) {
            throw new Error(coded.message);
          }
        }
        if (typeof detail === "object" && detail && "message" in detail) {
          throw new Error(String((detail as { message: string }).message));
        }
        throw new Error(typeof detail === "string" ? detail : "Não foi possível validar o CPF");
      }
      router.replace(afterPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao validar CPF");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-bold text-foreground">Completar perfil</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {user?.app_metadata?.provider === "google" || user?.identities?.some((i) => i.provider === "google")
          ? "Sua conta Google está verificada. Informe seu CPF para ativar compras."
          : "Informe seu CPF para ativar sua conta."}
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="cpf" className="text-sm text-muted-foreground">
            CPF
          </label>
          <input
            id="cpf"
            inputMode="numeric"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-lg tracking-widest"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpfMask(e.target.value))}
          />
          {cpf.length >= 14 && !isValidCpf(cpf) && (
            <p className="mt-1 text-xs text-danger">CPF inválido</p>
          )}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {cpfDuplicate && (
          <p className="text-sm text-warning">
            Já tem conta com este CPF?{" "}
            <Link href="/entrar?next=/completar-perfil" className="font-medium text-primary underline">
              Faça login
            </Link>{" "}
            com o e-mail que você usou no cadastro original.
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting || !isValidCpf(cpf)}>
          {submitting ? "Validando…" : "Validar CPF e continuar"}
        </Button>
      </form>
    </main>
  );
}

export default function CompletarPerfilPage() {
  return (
    <Suspense fallback={<main className="p-8 text-muted-foreground">Carregando…</main>}>
      <CompletarPerfilForm />
    </Suspense>
  );
}
