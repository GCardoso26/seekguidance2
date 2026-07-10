"use client";

import dynamic from "next/dynamic";
import { MobileLayout } from "@/components/layout/MobileLayout";

const WishlistPage = dynamic(
  () => import("@/components/marketplace/WishlistPage").then((m) => m.WishlistPage),
  {
    loading: () => <p className="text-sm text-muted-foreground">Carregando…</p>,
    ssr: false,
  },
);

export default function WishlistRoutePage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8" data-testid="wishlist-route">
        <h1 className="text-2xl font-bold text-foreground">Minha Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">Produtos salvos para comprar depois</p>
        <div className="mt-6">
          <WishlistPage />
        </div>
      </div>
    </MobileLayout>
  );
}
