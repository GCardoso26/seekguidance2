import type { Metadata } from "next";
import { LandingPageContent } from "@/components/luxury/LandingPageContent";

export const metadata: Metadata = {
  title: "Para Jogadores — Judge TCG",
  description:
    "A ruling que você precisa antes do clock acabar. Fonte oficial em segundos para mostrar ao oponente ou ao juiz.",
};

export default function JogadorPage() {
  return <LandingPageContent segment="player" />;
}
