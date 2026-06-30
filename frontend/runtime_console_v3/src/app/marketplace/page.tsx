"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ProductSkeleton } from "@/components/marketplace/ProductSkeleton";
import { addProductToCart } from "@/lib/marketplace-shop";
import { showToast } from "@/lib/toast";

const MarketplaceShopBrowse = dynamic(
  () => import("@/components/marketplace/MarketplaceShopBrowse").then((m) => m.MarketplaceShopBrowse),
  { loading: () => <ProductSkeleton />, ssr: false },
);

const DecklistCard = dynamic(
  () => import("@/components/marketplace/DecklistCard").then((m) => m.DecklistCard),
  { ssr: false },
);

export default function MarketplacePage() {
  const [tab, setTab] = useState<"shop" | "decklists">("shop");
  const [deckQ, setDeckQ] = useState("");
  const queryClient = useQueryClient();

  const { data: deckItems = [], isLoading: deckLoading } = useQuery({
    queryKey: ["marketplace", "decklists", deckQ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (deckQ) params.set("q", deckQ);
      const res = await fetch(`/api/marketplace/decklists?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: tab === "decklists",
  });

  async function addToCart(productId: string) {
    const result = await addProductToCart(productId);
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
      showToast("Produto adicionado ao carrinho", "success");
      window.location.href = "/marketplace/cart";
      return;
    }
    if (result.needsLogin) {
      showToast("Faça login para adicionar ao carrinho", "error");
      window.location.href = `/login?next=${encodeURIComponent("/marketplace")}`;
      return;
    }
    showToast(result.message, "error");
  }

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-luxury-frost">Marketplace</h1>
            <p className="text-sm text-luxury-mist">Produtos TCG e decklists de torneio</p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace/orders" className="rounded-lg border border-white/10 px-3 py-2 text-sm">
              Meus pedidos
            </Link>
            <Link href="/marketplace/cart" className="rounded-lg border border-white/10 px-3 py-2 text-sm">
              Carrinho
            </Link>
            <Link
              href="/store/dashboard"
              className="rounded-lg bg-luxury-gold px-3 py-2 text-sm font-semibold text-luxury-onyx"
            >
              Minha loja
            </Link>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab("shop")}
            className={`px-4 py-2 text-sm ${tab === "shop" ? "border-b-2 border-luxury-gold text-luxury-gold" : "text-luxury-mist"}`}
          >
            Produtos
          </button>
          <button
            type="button"
            onClick={() => setTab("decklists")}
            className={`px-4 py-2 text-sm ${tab === "decklists" ? "border-b-2 border-luxury-gold text-luxury-gold" : "text-luxury-mist"}`}
          >
            Decklists
          </button>
        </div>

        {tab === "shop" ? (
          <MarketplaceShopBrowse onAddToCart={addToCart} />
        ) : (
          <div className="mt-6">
            <input
              value={deckQ}
              onChange={(e) => setDeckQ(e.target.value)}
              placeholder="Buscar decklist…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2"
            />
            {deckLoading && <p className="mt-4 text-luxury-mist">Carregando…</p>}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(deckItems as Array<Record<string, unknown>>).map((item) => (
                <DecklistCard
                  key={String(item.id)}
                  id={String(item.id)}
                  name={String(item.name)}
                  gameCode={String(item.game_code)}
                  priceCents={Number(item.price_cents)}
                  sellerName={String(item.seller_name ?? item.seller_handle)}
                  rating={Number(item.average_rating)}
                  salesCount={Number(item.sales_count)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
