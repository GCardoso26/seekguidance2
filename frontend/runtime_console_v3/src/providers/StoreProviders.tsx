"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { SearchPlatformProvider } from "@/features/search/SearchPlatformContext";

const CartDrawer = dynamic(
  () => import("@/components/cart/CartDrawer").then((m) => m.CartDrawer),
  { ssr: false },
);

const PWAInstallPrompt = dynamic(
  () => import("@/components/pwa/PWAInstallPrompt").then((m) => m.PWAInstallPrompt),
  { ssr: false },
);

/**
 * Providers mínimos do hub Store (`/loja`).
 * Sem UpgradeModal (não usado no hub). CartDrawer lazy pós-interação.
 */
export function StoreProviders({ children }: { children: ReactNode }) {
  return (
    <SearchPlatformProvider>
      {children}
      <CartDrawer />
      <PWAInstallPrompt />
    </SearchPlatformProvider>
  );
}
