"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { fadeUp } from "@/constants/luxury/motion";
import { GlowOrb } from "@/components/luxury/effects/GlowOrb";
import { MagneticButton } from "@/components/luxury/effects/MagneticButton";
import { NoiseOverlay } from "@/components/luxury/effects/NoiseOverlay";
import { useMousePosition } from "@/hooks/useMousePosition";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const { x, y } = useMousePosition();
  const parallaxX = typeof window !== "undefined" ? (x / window.innerWidth - 0.5) * 10 : 0;
  const parallaxY = typeof window !== "undefined" ? (y / window.innerHeight - 0.5) * 10 : 0;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(10,10,15,0.55), rgba(10,10,15,0.92)), url('/images/hero-tournament.svg')",
          transform: `translate(${parallaxX}px, ${parallaxY}px) scale(1.05)`,
        }}
        role="img"
        aria-label="Mesa de torneio TCG com cartas e jogadores competitivos"
      />
      <NoiseOverlay opacity={0.04} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center lg:px-8">
        <motion.p
          className="mb-6 text-xs font-medium tracking-[0.35em] text-luxury-mist uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          A plataforma definitiva para
        </motion.p>

        <motion.h1
          className="text-luxury mb-8 font-light"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Justiça nas Cartas
        </motion.h1>

        <motion.p
          className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed font-light text-luxury-mist md:text-xl"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          Rulings instantâneos, vereditos confiáveis, torneios impecáveis. A autoridade que o
          jogo competitivo precisa.
        </motion.p>

        <motion.div
          className="relative flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
        >
          <GlowOrb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" size={280} />
          <Link href="/judge">
            <MagneticButton>
              Experimentar a Mesa
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </MagneticButton>
          </Link>
          <Link href="/pricing">
            <MagneticButton variant="secondary">Ver Planos</MagneticButton>
          </Link>
        </motion.div>
      </div>

      <a
        href="#features"
        className={cn(
          "absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-luxury-mist transition-colors hover:text-luxury-gold",
        )}
        aria-label="Descer para funcionalidades"
      >
        <ChevronDown className="h-6 w-6 animate-float" strokeWidth={1.5} />
      </a>
    </section>
  );
}
