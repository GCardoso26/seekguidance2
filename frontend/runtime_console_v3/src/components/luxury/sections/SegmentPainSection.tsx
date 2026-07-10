import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AudienceSegment } from "@/constants/luxury/landingCopy";
import { PAIN_SECTIONS } from "@/constants/luxury/landingCopy";
import { MagneticButton } from "@/components/luxury/effects/MagneticButton";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";

type Props = {
  segment: Exclude<AudienceSegment, "home">;
};

export function SegmentPainSection({ segment }: Props) {
  const copy = PAIN_SECTIONS[segment];
  const isMailto = copy.ctaHref.startsWith("mailto:");

  return (
    <section className="relative border-y border-white/5 bg-muted/40 py-28 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        <RevealOnScroll>
          <p className="mb-4 text-xs tracking-[0.3em] text-primary uppercase">{copy.eyebrow}</p>
          <h2 className="mb-6 text-foreground">{copy.title}</h2>
          <p className="mb-10 text-lg leading-relaxed font-light text-muted-foreground">{copy.body}</p>
          {isMailto ? (
            <a href={copy.ctaHref}>
              <MagneticButton>
                {copy.cta}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </MagneticButton>
            </a>
          ) : (
            <Link href={copy.ctaHref}>
              <MagneticButton>
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
