import type { Metadata } from "next";
import { LuxuryFeaturesPage } from "@/components/luxury/pages/LuxuryFeaturesPage";

export const metadata: Metadata = {
  title: "Funcionalidades — Judge TCG",
  description:
    "IA judge, torneios, marketplace e comunidade — tudo o que você precisa para o competitivo sério.",
};

export default function FeaturesPage() {
  return <LuxuryFeaturesPage />;
}
