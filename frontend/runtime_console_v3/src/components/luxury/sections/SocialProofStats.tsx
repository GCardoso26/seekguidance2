import type { AudienceSegment } from "@/constants/luxury/landingCopy";
import { SOCIAL_STATS } from "@/constants/luxury/landingCopy";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";

type Props = {
  segment?: AudienceSegment;
};

export function SocialProofStats({ segment = "home" }: Props) {
  if (segment !== "home") return null;

  return (
    <section className="relative border-y border-white/5 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <RevealOnScroll>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {SOCIAL_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-light text-luxury-gold md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-xs tracking-[0.2em] text-luxury-mist uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
