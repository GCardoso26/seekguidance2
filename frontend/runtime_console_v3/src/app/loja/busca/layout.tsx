import type { Metadata } from "next";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/loja/busca", {
  title: "Buscar cartas — Loja Judge TCG",
  description:
    "Busca facetada de cartas TCG: Magic, Pokémon, Yu-Gi-Oh!, Lorcana, One Piece e mais. Filtros por set, raridade e preço.",
  openGraph: {
    title: "Buscar cartas — Judge TCG",
    description: "Encontre cartas em todos os TCGs suportados.",
  },
});

export default function LojaBuscaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
