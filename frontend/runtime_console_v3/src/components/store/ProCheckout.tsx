"use client";

import { useState } from "react";

type Props = {
  storeId: string;
  onSuccess?: () => void;
};

export function ProCheckout({ storeId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<Record<string, unknown> | null>(null);

  async function checkout(plan: "pro" | "enterprise", paymentMethod: "card" | "pix") {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void checkout("pro", "card")}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
        >
          Pro — Cartão (R$ 49/mês)
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void checkout("pro", "pix")}
          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          Pro — PIX
        </button>
      </div>
      {pixData && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm">
          <p className="font-medium">PIX Pro Loja</p>
          <p className="mt-2 font-mono text-xs break-all">{String(pixData.copy_payload ?? "")}</p>
          <p className="mt-2 text-muted-foreground">Identificador: {String(pixData.txid ?? "")}</p>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
