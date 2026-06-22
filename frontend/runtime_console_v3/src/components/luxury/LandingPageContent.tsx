import type { AudienceSegment } from "@/constants/luxury/landingCopy";
import { CatalogMarketplaceSection } from "@/components/home/CatalogMarketplaceSection";
import { CtaFinalSection } from "@/components/luxury/sections/CtaFinalSection";
import { FeaturesSection } from "@/components/luxury/sections/FeaturesSection";
import { HeroSection } from "@/components/luxury/sections/HeroSection";
import { PricingSection } from "@/components/luxury/sections/PricingSection";
import { SegmentPainSection } from "@/components/luxury/sections/SegmentPainSection";
import { ShowcaseSection } from "@/components/luxury/sections/ShowcaseSection";
import { SocialProofStats } from "@/components/luxury/sections/SocialProofStats";
import { TcgGallerySection } from "@/components/luxury/sections/TcgGallerySection";
import { TestimonialsSection } from "@/components/luxury/sections/TestimonialsSection";

type Props = {
  segment: AudienceSegment;
};

export function LandingPageContent({ segment }: Props) {
  return (
    <>
      <HeroSection segment={segment} />
      {segment === "home" && <CatalogMarketplaceSection />}
      {segment !== "home" && <SegmentPainSection segment={segment} />}
      <SocialProofStats segment={segment} />
      <FeaturesSection segment={segment} />
      <ShowcaseSection segment={segment} />
      <TcgGallerySection />
      <TestimonialsSection segment={segment} />
      <PricingSection segment={segment} />
      <CtaFinalSection segment={segment} />
    </>
  );
}
