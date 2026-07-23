"use client";

import dynamic from "next/dynamic";

const PersonalizedHomeStrip = dynamic(
  () =>
    import("@/components/experience/PersonalizedHomeStrip").then(
      (m) => m.PersonalizedHomeStrip,
    ),
  { ssr: false, loading: () => null },
);

const MarketplaceHomeInteractiveSections = dynamic(
  () =>
    import("@/components/marketplace/MarketplaceHomeInteractiveSections").then(
      (m) => m.MarketplaceHomeInteractiveSections,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-muted/30" aria-hidden data-testid="home-stream-fallback" />
    ),
  },
);

/** Client island — defer non-LCP home sections. */
export function MarketplaceHomeBelowFold() {
  return (
    <>
      <PersonalizedHomeStrip />
      <MarketplaceHomeInteractiveSections />
    </>
  );
}
