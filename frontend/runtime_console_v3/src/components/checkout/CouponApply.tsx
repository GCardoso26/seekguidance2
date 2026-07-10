"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Props = {
  storeId: string;
  orderTotalCents: number;
  onApplied: (discount: number, code: string) => void;
  onClear: () => void;
  className?: string;
};

export function CouponApply({ storeId, orderTotalCents, onApplied, onClear, className }: Props) {
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
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-card", className)}>
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-small font-semibold">Cupom de desconto</p>
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código do cupom"
          data-testid="coupon-input"
          className="uppercase"
        />
        <Button
          type="button"
          variant="outline"
          disabled={loading || !code.trim()}
          data-testid="apply-coupon"
          onClick={() => void apply()}
        >
          Aplicar
        </Button>
      </div>
      {error && <p className="mt-2 text-small text-danger">{error}</p>}
      {applied && (
        <p className="mt-2 text-small text-success">
          Desconto: −{formatShopPrice(applied.discount)} · Total: {formatShopPrice(applied.final)}
        </p>
      )}
    </div>
  );
}
