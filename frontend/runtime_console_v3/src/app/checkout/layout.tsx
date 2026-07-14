import type { Metadata } from "next";
import { MarketplaceProviders } from "@/providers/MarketplaceProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/checkout", {
  title: "Checkout seguro",
  description:
    "Finalize sua compra de cartas TCG com PIX ou cartão. Checkout seguro Judge TCG.",
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceProviders>{children}</MarketplaceProviders>;
}
