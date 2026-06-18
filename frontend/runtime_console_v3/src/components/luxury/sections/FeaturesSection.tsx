"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Cloud,
  Globe,
  Layers,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AudienceSegment } from "@/constants/luxury/landingCopy";
import { FEATURES_SECTION_COPY } from "@/constants/luxury/landingCopy";
import { featuresForSegment } from "@/constants/luxury/tcgThemes";
import { stagger } from "@/constants/luxury/motion";
import { Card } from "@/components/luxury/ui/Card";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";

const ICONS: Record<string, LucideIcon> = {
  Zap,
  Layers,
  Trophy,
  BookOpen,
  Cloud,
  Globe,
};

type Props = {
  segment?: AudienceSegment;
};

export function FeaturesSection({ segment = "home" }: Props) {
  const sectionCopy = FEATURES_SECTION_COPY[segment];
  const features = featuresForSegment(segment);

  return (
    <section id="features" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <RevealOnScroll className="mb-16 max-w-2xl">
          <p className="mb-4 text-xs tracking-[0.3em] text-luxury-gold uppercase">
            {sectionCopy.eyebrow}
          </p>
          <h2 className="mb-6 text-luxury-frost">{sectionCopy.title}</h2>
          <p className="text-lg font-light text-luxury-mist">{sectionCopy.subtitle}</p>
        </RevealOnScroll>

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((feature, i) => {
            const Icon = ICONS[feature.icon];
            return (
              <RevealOnScroll key={feature.title} delay={i * 0.1}>
                <Card hover className="h-full">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-luxury-gold/20 bg-luxury-gold/5">
                    <Icon className="h-5 w-5 text-luxury-gold" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-3 text-xl text-luxury-frost">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-luxury-mist">{feature.description}</p>
                </Card>
              </RevealOnScroll>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
