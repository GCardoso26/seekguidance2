"use client";

import { useState } from "react";

type Props = {
  storeId: string;
  store?: Record<string, unknown>;
  loading?: boolean;
  variant?: "banner" | "panel";
};

export function StripeConnectPanel({ storeId, store, loading, variant = "panel" }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = store?.stripe_onboarding_complete === true;
  const hasAccount = Boolean(store?.stripe_account_id);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/shop/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      });
      const data = (await res.json().catch(() => ({}))) as { onboarding_url?: string; detail?: string };
      if (!res.ok) {
        throw new Error(String(data.detail ?? "Falha ao conectar Stripe"));
      }
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
        return;
      }
      throw new Error("URL de onboarding não retornada. Verifique STRIPE_SECRET_KEY no Render.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar Stripe");
    } finally {
      setConnecting(false);
    }
  }

  if (isComplete) {
    if (variant === "banner") return null;
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6">
        <h2 className="font-semibold text-emerald-200">Stripe conectado (opcional)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aceita cartão via Stripe Connect. Pagamentos vão 100% para sua conta — sem comissão da plataforma.
        </p>
      </div>
    );
  }

  const wrapperClass =
    variant === "banner"
      ? "rounded-xl border border-primary/40 bg-primary/10 p-4"
      : "surface-card p-6";

  return (
    <div className={wrapperClass}>
      <h2 className="font-semibold">{variant === "banner" ? "Configure pagamentos" : "Cartão (Stripe Connect — opcional)"}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasAccount
          ? "Continue o onboarding Stripe para aceitar cartão no checkout."
          : "Opcional: aceite cartão além do PIX. Requer Stripe Connect ativo na plataforma."}
      </p>
      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={connecting || loading || !storeId}
        className="mt-4 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {connecting ? "Redirecionando…" : hasAccount ? "Continuar onboarding Stripe" : "Conectar Stripe"}
      </button>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
