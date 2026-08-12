"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";

/**
 * Stripe Connect onboarding — só para loja já existente.
 * Sem loja: entry ADR-018 é /vender (credenciamento CNPJ), não signup seller via Stripe.
 */
export default function StoreOnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"checking" | "redirecting" | "error">("checking");

  useEffect(() => {
    async function start() {
      try {
        const mineRes = await fetch("/api/stores/mine");
        const stores = mineRes.ok
          ? ((await mineRes.json()) as Array<{ id?: string }>)
          : [];
        const storeId = stores[0]?.id;

        if (!storeId) {
          router.replace("/vender");
          return;
        }

        setPhase("redirecting");
        const res = await fetch("/api/marketplace/shop/connect/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          onboarding_url?: string;
          detail?: string;
        };

        if (!res.ok) {
          throw new Error(String(data.detail ?? "Falha ao conectar pagamentos"));
        }
        if (data.onboarding_url) {
          window.location.href = data.onboarding_url;
          return;
        }
        throw new Error("URL de onboarding Stripe não retornada");
      } catch (err) {
        setPhase("error");
        setError(err instanceof Error ? err.message : "Erro ao conectar pagamentos");
      }
    }
    void start();
  }, [router]);

  const title =
    phase === "error"
      ? "Não foi possível conectar pagamentos"
      : phase === "checking"
        ? "Verificando sua loja…"
        : "Redirecionando para Stripe…";

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ??
            (phase === "checking"
              ? "Credenciamento de hobby store vem antes dos pagamentos."
              : "Conecte sua conta para receber pagamentos na loja.")}
        </p>
        {phase === "error" && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link
              href="/vendedor/painel/configuracoes/pagamentos"
              className="text-primary underline"
            >
              Voltar às configurações de pagamentos
            </Link>
            <Link href="/vender" className="text-sm text-muted-foreground underline">
              Solicitar credenciamento
            </Link>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
