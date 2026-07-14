import type { Metadata } from "next";
import { MarketplaceProviders } from "@/providers/MarketplaceProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/wishlist", {
  title: "Wishlist",
  description: "Lista de desejos e alertas de preço no Judge TCG.",
});

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
