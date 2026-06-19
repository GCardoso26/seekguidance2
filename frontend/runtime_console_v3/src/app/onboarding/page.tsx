import type { Metadata } from "next";
import { OnboardingPageClient } from "@/components/onboarding/OnboardingPageClient";

export const metadata: Metadata = {
  title: "Onboarding — Judge TCG",
  description: "Escolha seus 5 TCGs favoritos para começar na mesa.",
};

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}
