import type { Metadata } from "next";
import { MarketplaceProviders } from "@/providers/MarketplaceProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/marketplace", {
  title: "Marketplace",
  description: "Produtos selados, decklists e compras no Judge TCG.",
});

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
