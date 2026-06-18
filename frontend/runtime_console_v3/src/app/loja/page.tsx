import type { Metadata } from "next";
import { LandingPageContent } from "@/components/luxury/LandingPageContent";

export const metadata: Metadata = {
  title: "Para Lojas — Judge TCG",
  description:
    "Seu torneio começa na hora. Pairing, bracket e rulings oficiais — infraestrutura de YCS para sua LGS.",
};

export default function LojaPage() {
  return <LandingPageContent segment="lgs" />;
}
