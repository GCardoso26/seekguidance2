"use client";

import { useState } from "react";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { showToast } from "@/lib/toast";

type Props = {
  storeId: string;
  orderTotalCents: number;
  onApplied: (discount: number, code: string) => void;
  onClear: () => void;
};

export function CouponApply({ storeId, orderTotalCents, onApplied, onClear }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{ code: string; discount: number; final: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/shop/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, code, order_total_cents: orderTotalCents }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        detail?: string;
        discount_cents?: number;
        final_total_cents?: number;
        code?: string;
      };
      if (!res.ok) throw new Error(String(data.detail ?? "Cupom inválido"));
      const discount = Number(data.discount_cents ?? 0);
      setApplied({ code: String(data.code ?? code), discount, final: Number(data.final_total_cents) });
      onApplied(discount, String(data.code ?? code));
      showToast("Cupom aplicado!", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cupom inválido");
      setApplied(null);
      onClear();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-medium">Cupom de desconto</p>
      <div className="mt-2 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código"
          data-testid="coupon-input"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm uppercase"
        />
        <button
          type="button"
          disabled={loading || !code.trim()}
          data-testid="apply-coupon"
          onClick={() => void apply()}
          className="rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx disabled:opacity-50"
        >
          Aplicar
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      {applied && (
        <p className="mt-2 text-sm text-emerald-300">
          Desconto: −{formatShopPrice(applied.discount)} · Total: {formatShopPrice(applied.final)}
        </p>
      )}
    </div>
  );
}
