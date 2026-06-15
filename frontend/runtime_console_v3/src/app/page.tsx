import type { Metadata } from "next";
import { LuxuryLayout } from "@/components/luxury/layout/LuxuryLayout";
import { CtaFinalSection } from "@/components/luxury/sections/CtaFinalSection";
import { FeaturesSection } from "@/components/luxury/sections/FeaturesSection";
import { HeroSection } from "@/components/luxury/sections/HeroSection";
import { PricingSection } from "@/components/luxury/sections/PricingSection";
import { ShowcaseSection } from "@/components/luxury/sections/ShowcaseSection";
import { TcgGallerySection } from "@/components/luxury/sections/TcgGallerySection";
import { TestimonialsSection } from "@/components/luxury/sections/TestimonialsSection";

export const metadata: Metadata = {
  title: "Judge TCG — Justiça nas Cartas",
  description:
    "Rulings instantâneos, vereditos confiáveis, torneios impecáveis. A autoridade que o jogo competitivo precisa.",
};

export default function HomePage() {
  return (
    <LuxuryLayout>
      <HeroSection />
      <FeaturesSection />
      <ShowcaseSection />
      <TcgGallerySection />
      <TestimonialsSection />
      <PricingSection />
      <CtaFinalSection />
    </LuxuryLayout>
  );
}
