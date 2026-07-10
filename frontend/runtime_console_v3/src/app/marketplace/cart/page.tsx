"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { useShopCart } from "@/hooks/useShopCart";
import { useSmartCart } from "@/hooks/useBuyerExperience";
import type { SmartCartGoal } from "@/types/buyer-experience";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { CpfCheckoutModal } from "@/components/kyc/CpfCheckoutModal";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const GOALS: { id: SmartCartGoal; label: string }[] = [
  { id: "best_value", label: "Custo-benefício" },
  { id: "lowest_price", label: "Menor preço" },
  { id: "fewest_stores", label: "Menos lojas" },
  { id: "highest_reputation", label: "Maior confiança" },
  { id: "fastest_shipping", label: "Menor prazo" },
];

export default function SmartCartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: accountStatus } = useAccountStatus();
  const [cpfModal, setCpfModal] = useState(false);
  const [goal, setGoal] = useState<SmartCartGoal>("best_value");
  const [groupByStore, setGroupByStore] = useState(true);
  const { data: cart, isLoading: cartLoading } = useShopCart();
  const { data: smart, isLoading: smartLoading } = useSmartCart(goal);

  const items = cart?.items ?? [];
  const loading = cartLoading || smartLoading;

  const fallbackGroups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const list = map.get(item.store_id) ?? [];
      list.push(item);
      map.set(item.store_id, list);
    }
    return Array.from(map.entries()).map(([store_id, storeItems]) => ({
      store_id,
      store_name: store_id.slice(0, 8),
      items: storeItems,
      subtotal_cents: storeItems.reduce((s, i) => s + i.price_cents * i.quantity, 0),
    }));
  }, [items]);

  async function updateQty(productId: string, quantity: number) {
    await fetch(`/api/marketplace/shop/cart/items/${encodeURIComponent(productId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
    await queryClient.invalidateQueries({ queryKey: ["smart-cart"] });
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8 pb-28 md:pb-8">
        <Link href="/loja" className="text-sm text-luxury-mist">
          ← Loja
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Carrinho inteligente</h1>
        <p className="mt-1 text-sm text-luxury-mist">
          Otimize por preço, frete, lojas, prazo ou reputação — sem compras automáticas.
        </p>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Objetivo do carrinho">
          {GOALS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setGoal(g.id);
                void trackEvent("smart_cart_goal", { goal: g.id });
              }}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                goal === g.id
                  ? "border-luxury-gold bg-luxury-gold/20 text-luxury-gold"
                  : "border-white/15 text-luxury-mist hover:border-white/30"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-luxury-mist">
            <input
              type="checkbox"
              checked={groupByStore}
              onChange={(e) => setGroupByStore(e.target.checked)}
              className="rounded border-white/20"
            />
            Agrupar por loja
          </label>
        </div>

        {smart?.summary && items.length > 0 && (
          <div
            className="mt-4 grid gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:grid-cols-3"
            data-testid="smart-cart-summary"
          >
            <div>
              <p className="text-xs text-luxury-mist">Produtos</p>
              <p className="font-semibold">{formatShopPrice(smart.summary.products_cents)}</p>
            </div>
            <div>
              <p className="text-xs text-luxury-mist">Frete estimado</p>
              <p className="font-semibold">{formatShopPrice(smart.summary.estimated_shipping_cents)}</p>
            </div>
            <div>
              <p className="text-xs text-luxury-mist">Economia vs. envios separados</p>
              <p className="font-semibold text-emerald-400">
                {formatShopPrice(smart.summary.savings_cents)}
              </p>
            </div>
            <p className="sm:col-span-3 text-xs text-luxury-mist">
              {smart.summary.store_count} loja(s) · Trust médio {smart.summary.avg_trust} · Prazo ~
              {smart.summary.estimated_sla_days}d
            </p>
          </div>
        )}

        {loading && <p className="mt-6 text-luxury-mist">Carregando…</p>}
        {!loading && items.length === 0 && (
          <p className="mt-8 text-center text-luxury-mist">Seu carrinho está vazio.</p>
        )}

        {groupByStore && (smart?.by_store?.length || fallbackGroups.length) > 0 ? (
          <div className="mt-6 space-y-4">
            {(smart?.by_store?.length ? smart.by_store : fallbackGroups).map((group) => (
              <section
                key={group.store_id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">
                    {"store_name" in group ? group.store_name : "Loja"}
                  </h2>
                  {"trust_score" in group && typeof group.trust_score === "number" && (
                    <span className="text-xs text-luxury-mist">Trust {Math.round(group.trust_score)}</span>
                  )}
                </div>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li
                      key={item.product_id}
                      className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 first:border-0 first:pt-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-luxury-mist">{formatShopPrice(item.price_cents)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Diminuir"
                          onClick={() => void updateQty(item.product_id, item.quantity - 1)}
                          className="rounded bg-white/10 px-2 py-1"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Aumentar"
                          onClick={() => void updateQty(item.product_id, item.quantity + 1)}
                          className="rounded bg-white/10 px-2 py-1"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-right text-sm text-luxury-mist">
                  Subtotal {formatShopPrice(group.subtotal_cents)}
                  {"estimated_shipping_cents" in group &&
                    typeof group.estimated_shipping_cents === "number" && (
                      <> · Frete ~{formatShopPrice(group.estimated_shipping_cents)}</>
                    )}
                </p>
              </section>
            ))}
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li
                key={item.product_id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-luxury-mist">{formatShopPrice(item.price_cents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => void updateQty(item.product_id, item.quantity - 1)} className="rounded bg-white/10 px-2 py-1">
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => void updateQty(item.product_id, item.quantity + 1)} className="rounded bg-white/10 px-2 py-1">
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-white/10 bg-luxury-obsidian/95 p-4 backdrop-blur md:static md:mt-8 md:rounded-xl md:border md:bg-white/5 md:p-4 md:backdrop-blur-none">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <div>
                <p className="text-xs text-luxury-mist">Total estimado</p>
                <p className="font-mono text-lg font-bold">
                  {formatShopPrice(
                    smart?.summary.estimated_total_cents ?? cart?.total_cents ?? 0,
                  )}
                </p>
              </div>
              <Button
                className="min-w-[140px]"
                onClick={() => {
                  void trackEvent("checkout_started", { source: "smart_cart", goal });
                  if (needsCpfCompletion(accountStatus)) {
                    setCpfModal(true);
                    return;
                  }
                  router.push("/checkout");
                }}
              >
                Checkout
              </Button>
            </div>
            {smart?.hint && <p className="mx-auto mt-2 max-w-3xl text-[11px] text-luxury-mist">{smart.hint}</p>}
          </div>
        )}

        <CpfCheckoutModal open={cpfModal} onClose={() => setCpfModal(false)} />
      </div>
    </MobileLayout>
  );
}
