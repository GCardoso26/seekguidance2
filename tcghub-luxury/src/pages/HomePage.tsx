import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { CtaFinalSection } from "@/components/sections/CtaFinalSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { ShowcaseSection } from "@/components/sections/ShowcaseSection";
import { TcgGallerySection } from "@/components/sections/TcgGallerySection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ShowcaseSection />
      <TcgGallerySection />
      <TestimonialsSection />
      <PricingSection />
      <CtaFinalSection />
    </>
  );
}
