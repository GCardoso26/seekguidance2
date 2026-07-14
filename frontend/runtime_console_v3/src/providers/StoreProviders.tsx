"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { CartDrawerOnDemand } from "@/components/cart/CartDrawerOnDemand";
import { SearchPlatformProvider } from "@/features/search/SearchPlatformContext";

const PWAInstallPrompt = dynamic(
  () => import("@/components/pwa/PWAInstallPrompt").then((m) => m.PWAInstallPrompt),
  { ssr: false },
);

/**
 * Providers mínimos do hub Store (`/loja`).
 * Sem UpgradeModal. CartDrawer só após interação.
 */
export function StoreProviders({ children }: { children: ReactNode }) {
  return (
    <SearchPlatformProvider>
      {children}
      <CartDrawerOnDemand />
      <PWAInstallPrompt />
    </SearchPlatformProvider>
  );
}
