"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";

const WishlistAlertsPage = dynamic(
  () => import("@/components/marketplace/WishlistAlertsPage").then((m) => m.WishlistAlertsPage),
  { loading: () => <p className="text-sm text-luxury-mist">Carregando…</p>, ssr: false },
);

export default function WishlistAlertsRoutePage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8" data-testid="wishlist-alerts-route">
        <Link href="/wishlist" className="text-sm text-luxury-mist hover:text-luxury-gold">
          ← Minha wishlist
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-luxury-frost">Alertas de preço</h1>
        <p className="mt-1 text-sm text-luxury-mist">
          Avisos quando produtos salvos ficarem mais baratos
        </p>
        <div className="mt-6">
          <WishlistAlertsPage />
        </div>
      </div>
    </MobileLayout>
  );
}
