import type { Metadata } from "next";
import { TournamentHubClient } from "@/components/tournament/TournamentHubClient";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/torneio", {
  title: "Tournament Hub — eventos, resultados e decklists",
  description:
    "Próximos torneios, resultados, rankings e decks vencedores no JudgeTCG.",
  openGraph: {
    title: "Tournament Hub | JudgeTCG",
    description: "Calendário, resultados e meta competitiva.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tournament Hub | JudgeTCG",
    description: "Calendário, resultados e meta competitiva.",
  },
});

export default function TorneioIndexPage() {
  return <TournamentHubClient />;
}
