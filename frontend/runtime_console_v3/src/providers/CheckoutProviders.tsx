"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const PWAInstallPrompt = dynamic(
  () => import("@/components/pwa/PWAInstallPrompt").then((m) => m.PWAInstallPrompt),
  { ssr: false },
);

/**
 * Providers mínimos do checkout — sem SearchPlatform / CartDrawer / UpgradeModal.
 * Evidência RC1: Search+Cart no path de pagamento atrasavam LCP (CHECKOUT_FINAL_PROFILE).
 */
export function CheckoutProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PWAInstallPrompt />
    </>
  );
}
