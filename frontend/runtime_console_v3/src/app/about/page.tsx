import type { Metadata } from "next";
import { LuxuryLayout } from "@/components/luxury/layout/LuxuryLayout";
import { LuxuryAboutPage } from "@/components/luxury/pages/LuxuryAboutPage";

export const metadata: Metadata = {
  title: "Sobre — Judge TCG",
  description:
    "Tornar o jogo competitivo justo e acessível — a história e missão do Judge TCG.",
};

export default function AboutPage() {
  return (
    <LuxuryLayout>
      <LuxuryAboutPage />
    </LuxuryLayout>
  );
}
