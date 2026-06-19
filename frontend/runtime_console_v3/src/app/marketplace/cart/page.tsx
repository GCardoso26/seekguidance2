"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { formatShopPrice, type ShopCart } from "@/lib/marketplace-shop";

export default function CartPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["shop-cart"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/shop/cart");
      if (!res.ok) return { cart: { items: [], total_cents: 0 } as ShopCart };
      return res.json() as Promise<{ cart: ShopCart }>;
    },
  });

  const cart = data?.cart;
  const items = cart?.items ?? [];

  async function updateQty(productId: string, quantity: number) {
    await fetch(`/api/marketplace/shop/cart/items/${encodeURIComponent(productId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/marketplace" className="text-sm text-luxury-mist">← Marketplace</Link>
        <h1 className="mt-4 text-2xl font-bold">Carrinho</h1>
        {isLoading && <p className="mt-4 text-luxury-mist">Carregando…</p>}
        {!isLoading && items.length === 0 && (
          <p className="mt-8 text-center text-luxury-mist">Seu carrinho está vazio.</p>
        )}
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.product_id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-luxury-mist">{formatShopPrice(item.price_cents)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateQty(item.product_id, item.quantity - 1)} className="rounded bg-white/10 px-2 py-1">−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => updateQty(item.product_id, item.quantity + 1)} className="rounded bg-white/10 px-2 py-1">+</button>
                <button type="button" onClick={() => updateQty(item.product_id, 0)} className="ml-2 text-xs text-red-400">Remover</button>
              </div>
            </li>
          ))}
        </ul>
        {items.length > 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-luxury-mist">Total</span>
              <span className="font-mono text-xl font-bold">{formatShopPrice(cart?.total_cents ?? 0)}</span>
            </div>
            <Link href="/marketplace/checkout" className="mt-4 block rounded-lg bg-luxury-gold py-3 text-center font-semibold text-luxury-onyx">
              Ir para checkout
            </Link>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
