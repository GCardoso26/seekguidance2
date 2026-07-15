"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SkipToMain } from "@/components/a11y/SkipToMain";
import { CheckoutProgressBar } from "@/components/checkout/CheckoutProgressBar";
import { SmartCartLineItem } from "@/components/cart/SmartCartLineItem";
import { CartShippingQuotePanel } from "@/components/cart/CartShippingQuotePanel";
import { SmartCartSummary } from "@/components/cart/SmartCartSummary";
import { PageHeader } from "@/components/seller-dashboard/PageShell";
import { CpfCheckoutModal } from "@/components/kyc/CpfCheckoutModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SHOP_CART_QUERY_KEY, useShopCart } from "@/hooks/useShopCart";
import { useSmartCart } from "@/hooks/useBuyerExperience";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import type { SmartCartGoal } from "@/types/buyer-experience";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

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
    await queryClient.invalidateQueries({ queryKey: SHOP_CART_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ["smart-cart"] });
  }

  const storeGroups = smart?.by_store?.length ? smart.by_store : fallbackGroups;

  return (
    <MobileLayout>
      <SkipToMain />
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 lg:px-8 md:pb-8" id="main-content">
        <CheckoutProgressBar currentStep="cart" className="mb-8" />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            title="Carrinho inteligente"
            description="Otimize por preço, frete, lojas, prazo ou reputação — sem compras automáticas."
          />
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/loja">← Loja</Link>
          </Button>
        </div>

        {items.length > 0 && (
          <Card className="mb-6 border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                Estratégia de compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Objetivo do carrinho">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGoal(g.id);
                      void trackEvent("smart_cart_goal", { goal: g.id });
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      goal === g.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={groupByStore}
                  onChange={(e) => setGroupByStore(e.target.checked)}
                  className="rounded border-border"
                />
                Agrupar por loja
              </label>
            </CardContent>
          </Card>
        )}

        {smart?.summary && items.length > 0 && <SmartCartSummary summary={smart.summary} className="mb-6" />}

        {items.length > 0 && (
          <Card className="mb-6 border-border bg-card">
            <CardContent className="pt-6">
              <CartShippingQuotePanel />
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-lg font-medium text-foreground">Seu carrinho está vazio</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Explore a loja e adicione cartas para ver a otimização por loja.
              </p>
              <Button asChild>
                <Link href="/loja">Ir à loja</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && items.length > 0 && groupByStore && storeGroups.length > 0 && (
          <div className="space-y-4">
            {storeGroups.map((group) => (
              <Card key={group.store_id} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {"store_name" in group ? group.store_name : "Loja"}
                    </CardTitle>
                    {"trust_score" in group && typeof group.trust_score === "number" && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Nota {Math.round(group.trust_score)}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-3">
                    {group.items.map((item) => (
                      <li key={item.product_id}>
                        <SmartCartLineItem
                          item={{
                            product_id: item.product_id,
                            store_id: group.store_id,
                            name: item.name,
                            image: item.image,
                            price_cents: item.price_cents,
                            quantity: item.quantity,
                          }}
                          onUpdateQty={(productId, quantity) => void updateQty(productId, quantity)}
                        />
                      </li>
                    ))}
                  </ul>
                  <p className="text-right text-sm text-muted-foreground">
                    Subtotal {formatShopPrice(group.subtotal_cents)}
                    {"estimated_shipping_cents" in group &&
                      typeof group.estimated_shipping_cents === "number" && (
                        <> · Frete ~{formatShopPrice(group.estimated_shipping_cents)}</>
                      )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && items.length > 0 && !groupByStore && (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.product_id}>
                <SmartCartLineItem
                  item={item}
                  onUpdateQty={(productId, quantity) => void updateQty(productId, quantity)}
                />
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="sticky-mobile-bar fixed left-0 right-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur md:static md:mt-8 md:rounded-xl md:border md:bg-card md:p-4 md:backdrop-blur-none">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total estimado</p>
                <p className="font-mono text-lg font-bold tabular-nums">
                  {formatShopPrice(smart?.summary.estimated_total_cents ?? cart?.total_cents ?? 0)}
                </p>
              </div>
              <Button
                className="min-w-[140px]"
                size="lg"
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
            {smart?.hint && (
              <p className="mx-auto mt-2 max-w-6xl text-caption text-muted-foreground">{smart.hint}</p>
            )}
          </div>
        )}

        <CpfCheckoutModal open={cpfModal} onClose={() => setCpfModal(false)} />
      </div>
    </MobileLayout>
  );
}
