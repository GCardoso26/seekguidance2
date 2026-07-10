"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ProductSkeleton } from "@/components/marketplace/ProductSkeleton";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const MarketplaceShopBrowse = dynamic(
  () => import("@/components/marketplace/MarketplaceShopBrowse").then((m) => m.MarketplaceShopBrowse),
  { loading: () => <ProductSkeleton />, ssr: false },
);

const MarketplaceDecklistsTab = dynamic(
  () => import("@/components/marketplace/MarketplaceDecklistsTab").then((m) => m.MarketplaceDecklistsTab),
  { ssr: false },
);

export default function MarketplaceProdutosPage() {
  const [tab, setTab] = useState<"shop" | "decklists">("shop");

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          className="mb-4 text-muted-foreground"
          items={[
            { label: "Início", href: "/" },
            { label: "Loja", href: "/loja" },
            { label: "Produtos selados" },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos selados</h1>
            <p className="text-sm text-muted-foreground">Boosters, acessórios e decklists de torneio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/loja" className="rounded-lg border border-border px-3 py-2 text-sm">
              Singles TCG
            </Link>
            <Link href="/marketplace/orders" className="rounded-lg border border-border px-3 py-2 text-sm">
              Meus pedidos
            </Link>
            <Link href="/carrinho" className="rounded-lg border border-border px-3 py-2 text-sm">
              Carrinho
            </Link>
            <Link href="/wishlist" className="rounded-lg border border-border px-3 py-2 text-sm">
              Wishlist
            </Link>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("shop")}
            className={`px-4 py-2 text-sm ${tab === "shop" ? "border-b-2 border-luxury-gold text-primary" : "text-muted-foreground"}`}
          >
            Produtos
          </button>
          <button
            type="button"
            onClick={() => setTab("decklists")}
            className={`px-4 py-2 text-sm ${tab === "decklists" ? "border-b-2 border-luxury-gold text-primary" : "text-muted-foreground"}`}
          >
            Decklists
          </button>
        </div>

        {tab === "shop" ? <MarketplaceShopBrowse /> : <MarketplaceDecklistsTab />}
      </div>
    </MobileLayout>
  );
}
