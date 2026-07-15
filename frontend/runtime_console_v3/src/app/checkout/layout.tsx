import type { Metadata } from "next";
import { CheckoutProviders } from "@/providers/CheckoutProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/checkout", {
  title: "Finalizar compra",
  description:
    "Finalize sua compra de cartas TCG com PIX ou cartão. Judge TCG.",
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <CheckoutProviders>{children}</CheckoutProviders>;
}
