import type { Metadata } from "next";
import { StoreProviders } from "@/providers/StoreProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/loja", {
  title: "Loja de cartas TCG",
  description: "Explore todos os jogos de cartas disponíveis no Judge TCG.",
});

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <StoreProviders>{children}</StoreProviders>;
}
