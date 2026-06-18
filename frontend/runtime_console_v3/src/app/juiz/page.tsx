import type { Metadata } from "next";
import { LandingPageContent } from "@/components/luxury/LandingPageContent";

export const metadata: Metadata = {
  title: "Para Juízes — Judge TCG",
  description:
    "Cite a fonte. Justifique o veredito. Proteja-se do appeal. Rulings consistentes com policy, MTR e documentos oficiais.",
};

export default function JuizPage() {
  return <LandingPageContent segment="judge" />;
}
