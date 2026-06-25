"use client";

import { useState } from "react";

type Props = {
  storeId: string;
  plan: "lojista" | "pro" | "enterprise";
  onSuccess?: () => void;
};

const PLAN_LABELS = { lojista: "Lojista", pro: "Pro", enterprise: "Enterprise" };
const PLAN_PRICES = { lojista: 49.9, pro: 149.9, enterprise: 199 };

export function PlanCheckout({ storeId, plan, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<Record<string, unknown> | null>(null);

  async function checkout(paymentMethod: "card" | "pix") {
    setLoading(true);
    setError(null);
    setPixData(null);
    try {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/subscribe/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, payment_method: paymentMethod }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { detail?: string };
      if (!res.ok) throw new Error(String(data.detail ?? "Falha no checkout"));

      if (paymentMethod === "card" && data.checkout_url) {
        window.location.href = String(data.checkout_url);
        return;
      }
      if (paymentMethod === "pix") {
        setPixData(data);
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no checkout");
    } finally {
      setLoading(false);
    }
  }

  const label = PLAN_LABELS[plan];
  const price = PLAN_PRICES[plan];

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void checkout("card")}
        className="w-full rounded-lg bg-luxury-gold px-3 py-2 text-sm font-semibold text-luxury-onyx disabled:opacity-50"
      >
        {label} — Cartão (R$ {price}/mês)
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => void checkout("pix")}
        className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
      >
        {label} — PIX
      </button>
      {pixData && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs">
          <p className="font-mono break-all">{String(pixData.copy_payload ?? "")}</p>
        </div>
      )}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
