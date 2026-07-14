"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/CartProvider";
import { UpgradeModalProvider } from "@/components/premium/UpgradeModalProvider";
import { SearchPlatformProvider } from "@/features/search/SearchPlatformContext";

const PWAInstallPrompt = dynamic(
  () => import("@/components/pwa/PWAInstallPrompt").then((m) => m.PWAInstallPrompt),
  { ssr: false },
);

/**
 * Shell de área Marketplace / buyer commerce.
 * Isola Cart + Command Palette + Upgrade do shared root bundle.
 */
export function MarketplaceProviders({ children }: { children: ReactNode }) {
  return (
    <UpgradeModalProvider>
      <CartProvider>
        <SearchPlatformProvider>
          {children}
          <PWAInstallPrompt />
        </SearchPlatformProvider>
      </CartProvider>
    </UpgradeModalProvider>
  );
}
