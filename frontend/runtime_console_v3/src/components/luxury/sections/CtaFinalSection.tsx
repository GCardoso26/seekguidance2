"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MetallicGradient } from "@/components/luxury/effects/MetallicGradient";
import { MagneticButton } from "@/components/luxury/effects/MagneticButton";
import { NoiseOverlay } from "@/components/luxury/effects/NoiseOverlay";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";

export function CtaFinalSection() {
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
          <h2 className="mb-6 text-luxury-frost">Pronto para elevar seu jogo?</h2>
          <p className="mx-auto mb-10 max-w-lg text-lg font-light text-luxury-mist">
            Junte-se a juízes, lojas e jogadores que já tratam o Judge TCG como infraestrutura —
            não acessório.
          </p>
          <Link href="/judge">
            <MagneticButton>
              Acessar a Mesa
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </MagneticButton>
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
