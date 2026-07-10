"use client";

import { formatShopPrice } from "@/lib/marketplace-shop";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value_cents: number;
  is_active: boolean;
  current_uses: number;
  max_uses?: number | null;
  expires_at?: string | null;
};

type Props = {
  coupons: Coupon[];
  onDeactivate: (id: string) => void;
};

export function CouponList({ coupons, onDeactivate }: Props) {
  if (coupons.length === 0) {
    return <p className="text-muted-foreground">Nenhum cupom criado.</p>;
  }

  return (
    <div className="space-y-3">
      {coupons.map((c) => (
        <div key={c.id} className="surface-card p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-mono font-semibold text-primary">{c.code}</span>
            <span className={`text-xs ${c.is_active ? "text-emerald-400" : "text-muted-foreground"}`}>
              {c.is_active ? "Ativo" : "Inativo"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.type === "percentage" ? `${c.value_cents}% off` : formatShopPrice(c.value_cents)} · Usos:{" "}
            {c.current_uses}
            {c.max_uses ? `/${c.max_uses}` : ""}
          </p>
          {c.is_active && (
            <button type="button" onClick={() => onDeactivate(c.id)} className="mt-2 text-xs text-red-300 underline">
              Desativar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
