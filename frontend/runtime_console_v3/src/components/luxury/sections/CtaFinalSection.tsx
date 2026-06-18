"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { AudienceSegment } from "@/constants/luxury/landingCopy";
import { CTA_FINAL_COPY } from "@/constants/luxury/landingCopy";
import { MetallicGradient } from "@/components/luxury/effects/MetallicGradient";
import { MagneticButton } from "@/components/luxury/effects/MagneticButton";
import { NoiseOverlay } from "@/components/luxury/effects/NoiseOverlay";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";

type Props = {
  segment?: AudienceSegment;
};

export function CtaFinalSection({ segment = "home" }: Props) {
  const copy = CTA_FINAL_COPY[segment];
  const isMailto = copy.href.startsWith("mailto:");

  return (
    <section className="relative overflow-hidden py-28 lg:py-32">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 px-8 py-20 text-center lg:px-16">
        <MetallicGradient />
        <NoiseOverlay opacity={0.05} />
        <div
          className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent"
          aria-hidden
        />

        <RevealOnScroll className="relative z-10">
          <h2 className="mb-6 text-luxury-frost">{copy.title}</h2>
          <p className="mx-auto mb-10 max-w-lg text-lg font-light text-luxury-mist">{copy.subtitle}</p>
          {isMailto ? (
            <a href={copy.href}>
              <MagneticButton className="shadow-lg shadow-luxury-gold/20">
                {copy.cta}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </MagneticButton>
            </a>
          ) : (
            <Link href={copy.href}>
              <MagneticButton className="shadow-lg shadow-luxury-gold/20">
                {copy.cta}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </MagneticButton>
            </Link>
          )}
        </RevealOnScroll>
      </div>
    </section>
  );
}
