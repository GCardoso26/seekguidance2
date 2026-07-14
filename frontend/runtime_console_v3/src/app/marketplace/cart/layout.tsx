import type { Metadata } from "next";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/marketplace/cart", {
  title: "Carrinho",
  description: "Revise itens do carrinho e prossiga para o checkout no Judge TCG.",
});

/** Providers vêm de `marketplace/layout.tsx` — evita double-wrap. */
export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
