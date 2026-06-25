"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature } from "@/lib/seller-plans";

type CartItem = {
  product_id: string;
  name: string;
  price_cents: number;
  quantity: number;
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PdvPage() {
  const { storeId, hasStore, dashboard } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card">("cash");
  const [lastSale, setLastSale] = useState<Record<string, unknown> | null>(null);

  const { data: searchData, isFetching } = useQuery({
    queryKey: ["pdv-search", storeId, q],
    queryFn: async () => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/pdv?q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) throw new Error("search_failed");
      return res.json() as Promise<{ products: Array<Record<string, unknown>> }>;
    },
    enabled: Boolean(storeId) && q.length >= 2 && planHasFeature(plan, "pdv"),
  });

  const totalCents = useMemo(
    () => cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0),
    [cart],
  );

  const saleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId!)}/pdv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          items: cart.map((c) => ({
            product_id: c.product_id,
            name: c.name,
            quantity: c.quantity,
            price_cents: c.price_cents,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(String((err as { detail?: string }).detail ?? "Erro na venda"));
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCart([]);
      setLastSale((data as { sale?: Record<string, unknown> }).sale ?? null);
    },
  });

  function addToCart(product: Record<string, unknown>) {
    const id = String(product.id);
    setCart((prev) => {
      const existing = prev.find((p) => p.product_id === id);
      if (existing) {
        return prev.map((p) => (p.product_id === id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [
        ...prev,
        {
          product_id: id,
          name: String(product.name),
          price_cents: Number(product.price_cents ?? 0),
          quantity: 1,
        },
      ];
    });
  }

  if (!hasStore) {
    return (
      <main className="p-8 text-center text-luxury-mist">
        <Link href="/stores/create" className="text-luxury-gold underline">
          Cadastre sua loja
        </Link>
      </main>
    );
  }

  if (!planHasFeature(plan, "pdv")) {
    return (
      <main className="p-8 text-center">
        <p className="text-luxury-mist">PDV disponível no plano Pro.</p>
        <Button asChild className="mt-4">
          <Link href="/vendedor/painel/planos">Ver planos</Link>
        </Button>
      </main>
    );
  }

  return (
    <>
      <SellerHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">PDV — Balcão</h2>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              placeholder="Buscar produto por nome ou SKU…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {isFetching && <li className="text-sm text-luxury-mist">Buscando…</li>}
              {(searchData?.products ?? []).map((p) => (
                <li key={String(p.id)} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                  <div>
                    <p className="font-medium">{String(p.name)}</p>
                    <p className="text-xs text-luxury-mist">
                      {formatBRL(Number(p.price_cents ?? 0))} · estoque {String(p.stock)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => addToCart(p)}>
                    +
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <h3 className="font-semibold">Carrinho</h3>
            {cart.length === 0 ? (
              <p className="text-sm text-luxury-mist">Adicione produtos.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {cart.map((item) => (
                  <li key={item.product_id} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatBRL(item.price_cents * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-lg font-bold">Total: {formatBRL(totalCents)}</p>
            <select
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            >
              <option value="cash">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="card">Cartão</option>
            </select>
            <Button
              className="w-full"
              disabled={!cart.length || saleMutation.isPending}
              onClick={() => void saleMutation.mutate()}
            >
              {saleMutation.isPending ? "Finalizando…" : "Finalizar venda"}
            </Button>
            {saleMutation.error && (
              <p className="text-sm text-red-300">{(saleMutation.error as Error).message}</p>
            )}
            {lastSale && (
              <p className="text-sm text-emerald-300">Venda registrada — {formatBRL(Number(lastSale.total_cents ?? 0))}</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
