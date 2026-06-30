"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ProductSkeleton } from "@/components/marketplace/ProductSkeleton";

const MarketplaceShopBrowse = dynamic(
  () => import("@/components/marketplace/MarketplaceShopBrowse").then((m) => m.MarketplaceShopBrowse),
  { loading: () => <ProductSkeleton />, ssr: false },
);

const MarketplaceDecklistsTab = dynamic(
  () => import("@/components/marketplace/MarketplaceDecklistsTab").then((m) => m.MarketplaceDecklistsTab),
  { ssr: false },
);

export default function MarketplacePage() {
  const [tab, setTab] = useState<"shop" | "decklists">("shop");

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
            <Link href="/wishlist" className="rounded-lg border border-white/10 px-3 py-2 text-sm">
              Wishlist
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

        {tab === "shop" ? <MarketplaceShopBrowse /> : <MarketplaceDecklistsTab />}
      </div>
    </MobileLayout>
  );
}
