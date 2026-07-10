"use client";

import { useState } from "react";

type Props = {
  storeId: string;
  onCreated: () => void;
};

function randomCode(): string {
  return `JUDGE${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function CouponForm({ storeId, onCreated }: Props) {
  const [code, setCode] = useState(randomCode());
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(0);
  const [maxUses, setMaxUses] = useState<number | "">(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewTotal = 10000;
  const previewDiscount =
    type === "percentage" ? Math.round(previewTotal * value / 100) : value * 100;
  const previewFinal = Math.max(0, previewTotal - previewDiscount);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value_cents: type === "percentage" ? value : value * 100,
          min_order_cents: minOrder * 100,
          max_uses: maxUses === "" ? null : Number(maxUses),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) throw new Error(String(data.detail ?? "Falha ao criar"));
      setCode(randomCode());
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4 surface-card p-6">
      <h2 className="font-semibold">Criar cupom</h2>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1 surface-card rounded-lg px-3 py-2 text-sm uppercase"
        />
        <button type="button" onClick={() => setCode(randomCode())} className="rounded-lg border border-border px-3 text-xs">
          Gerar
        </button>
      </div>
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as "percentage" | "fixed")} className="surface-card rounded-lg px-3 py-2 text-sm">
          <option value="percentage">Percentual (%)</option>
          <option value="fixed">Valor fixo (R$)</option>
        </select>
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-24 surface-card rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <label className="block text-sm">
        Pedido mínimo (R$)
        <input type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} className="mt-1 w-full surface-card rounded-lg px-3 py-2" />
      </label>
      <label className="block text-sm">
        Limite de usos
        <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1 w-full surface-card rounded-lg px-3 py-2" />
      </label>
      <p className="rounded-lg bg-primary/10 p-3 text-xs text-muted-foreground">
        Preview: compra de R$ 100,00 → R$ {(previewFinal / 100).toFixed(2)} com este cupom
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2 font-semibold text-primary-foreground disabled:opacity-50">
        Criar cupom
      </button>
    </form>
  );
}
