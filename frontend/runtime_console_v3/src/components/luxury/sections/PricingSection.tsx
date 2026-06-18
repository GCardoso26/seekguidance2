"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import type { AudienceSegment } from "@/constants/luxury/landingCopy";
import { PRICING_SECTION_COPY } from "@/constants/luxury/landingCopy";
import { pricingForSegment } from "@/constants/luxury/tcgThemes";
import { Badge } from "@/components/luxury/ui/Badge";
import { Card } from "@/components/luxury/ui/Card";
import { MagneticButton } from "@/components/luxury/effects/MagneticButton";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";
import { cn } from "@/lib/utils";

function planHref(planId: string): string {
  if (planId === "lgs") return "mailto:contato@judgetcg.com.br?subject=Plano%20LGS";
  if (planId === "pro") return "/pricing";
  return "/judge";
}

type Props = {
  segment?: AudienceSegment;
};

export function PricingSection({ segment = "home" }: Props) {
  const sectionCopy = PRICING_SECTION_COPY[segment];
  const plans = pricingForSegment(segment);

  return (
    <section id="pricing" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <RevealOnScroll className="mb-16 text-center">
          <p className="mb-4 text-xs tracking-[0.3em] text-luxury-gold uppercase">
            {sectionCopy.eyebrow}
          </p>
          <h2 className="mb-4 text-luxury-frost">{sectionCopy.title}</h2>
          <p className="mx-auto max-w-xl text-luxury-mist">{sectionCopy.subtitle}</p>
        </RevealOnScroll>

        <div
          className={cn(
            "grid gap-8",
            plans.length === 1 ? "mx-auto max-w-md" : plans.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3",
          )}
        >
          {plans.map((plan, i) => {
            const href = planHref(plan.id);
            const isMailto = href.startsWith("mailto:");

            return (
              <RevealOnScroll key={plan.id} delay={i * 0.1}>
                <Card
                  id={plan.id === "lgs" ? "lgs" : undefined}
                  className={cn(
                    "relative flex h-full flex-col bg-gradient-to-b from-luxury-midnight to-luxury-velvet",
                    plan.highlighted && "border-luxury-gold/40 shadow-xl shadow-luxury-gold/10",
                  )}
                >
                  {"badge" in plan && plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {plan.badge}
                    </Badge>
                  )}
                  <h3 className="text-xl text-luxury-frost">{plan.name}</h3>
                  <p className="mt-2 text-sm text-luxury-mist">{plan.description}</p>
                  <p className="mt-8">
                    <span className="text-4xl font-light text-luxury-frost">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-luxury-mist">{plan.period}</span>
                    )}
                  </p>
                  <ul className="mt-8 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-luxury-mist">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-luxury-gold" strokeWidth={1.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10">
                    {isMailto ? (
                      <a href={href} className="block">
                        <MagneticButton
                          variant={plan.highlighted ? "primary" : "secondary"}
                          className="w-full"
                        >
                          {plan.cta}
                        </MagneticButton>
                      </a>
                    ) : (
                      <Link href={href} className="block">
                        <MagneticButton
                          variant={plan.highlighted ? "primary" : "secondary"}
                          className="w-full"
                        >
                          {plan.cta}
                        </MagneticButton>
                      </Link>
                    )}
                  </div>
                </Card>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
