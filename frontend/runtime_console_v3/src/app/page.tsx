import type { Metadata } from "next";
import { LandingPageContent } from "@/components/luxury/LandingPageContent";

export const metadata: Metadata = {
  title: "Judge TCG — A ruling certa antes do clock zerar",
  description:
    "Juízes consistentes. Jogadores confiantes. Torneios que começam e acabam na hora. Rulings com fonte oficial em segundos.",
};

export default function HomePage() {
  return <LandingPageContent segment="home" />;
}
