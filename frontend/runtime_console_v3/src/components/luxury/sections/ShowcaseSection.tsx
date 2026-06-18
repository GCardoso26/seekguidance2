"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { AudienceSegment } from "@/constants/luxury/landingCopy";
import { SHOWCASE_COPY } from "@/constants/luxury/landingCopy";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";

type Props = {
  segment?: AudienceSegment;
};

export function ShowcaseSection({ segment = "home" }: Props) {
  const copy = SHOWCASE_COPY[segment];
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} className="relative overflow-hidden py-28 lg:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <RevealOnScroll variant="slideRight">
          <p className="mb-4 text-xs tracking-[0.3em] text-luxury-gold uppercase">{copy.eyebrow}</p>
          <h2 className="mb-6 text-luxury-frost">{copy.title}</h2>
          <p className="mb-8 text-lg font-light leading-relaxed text-luxury-mist">{copy.description}</p>
          <Link
            href="/judge"
            className="inline-flex items-center gap-2 text-sm font-medium text-luxury-gold transition-colors hover:text-luxury-gold-light"
          >
            {copy.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </RevealOnScroll>

        <motion.div
          style={{ y: mockupY }}
          className="relative mx-auto w-full max-w-lg [perspective:1200px]"
        >
          <div className="glass relative overflow-hidden rounded-2xl shadow-2xl shadow-black/50 [transform:rotateY(-5deg)]">
            <div className="border-b border-white/10 bg-luxury-midnight/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-luxury-gold/80" />
                <span className="text-xs tracking-wider text-luxury-mist uppercase">
                  Judge TCG — Mesa
                </span>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-luxury-mist">Pergunta</p>
                <p className="mt-1 text-sm text-luxury-frost">{copy.question}</p>
              </div>
              <div className="rounded-xl border border-luxury-gold/20 bg-luxury-gold/5 p-4">
                <p className="text-xs text-luxury-gold">Veredito</p>
                <p className="mt-2 text-sm leading-relaxed text-luxury-frost">{copy.answer}</p>
                <p className="mt-3 text-xs text-luxury-mist">{copy.meta}</p>
              </div>
            </div>
          </div>
          <div
            className="absolute -inset-4 -z-10 rounded-3xl bg-luxury-gold/10 blur-3xl"
            aria-hidden
          />
        </motion.div>
      </div>
    </section>
  );
}
