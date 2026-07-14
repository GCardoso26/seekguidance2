"use client";

import type { ReactNode } from "react";
import { UpgradeModalProvider } from "@/components/premium/UpgradeModalProvider";
import { SearchPlatformProvider } from "@/features/search/SearchPlatformContext";

/** Painel vendedor: search (Ctrl+K) + upgrade, sem CartDrawer do marketplace. */
export function SellerProviders({ children }: { children: ReactNode }) {
  return (
    <UpgradeModalProvider>
      <SearchPlatformProvider>{children}</SearchPlatformProvider>
    </UpgradeModalProvider>
  );
}
