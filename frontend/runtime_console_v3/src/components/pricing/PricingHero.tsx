"use client";

import { motion } from "framer-motion";
import { PricingToggle } from "./PricingToggle";

type Props = {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
  onToggleTrack?: (isAnnual: boolean) => void;
};

export function PricingHero({ isAnnual, onToggle, onToggleTrack }: Props) {
  return (
    <section className="relative overflow-hidden py-16 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #d4af37 0%, transparent 40%), radial-gradient(circle at 80% 70%, #c0c0c0 0%, transparent 35%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <p className="mb-4 text-xs tracking-[0.3em] text-primary uppercase">Planos</p>
        <h1 className="mb-4 text-4xl font-light text-foreground md:text-6xl">
          Escolha seu <span className="text-luxury">Plano</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Do casual ao competitivo. Encontre o plano que combina com seu estilo de jogo.
        </p>
        <p className="mb-6 text-sm text-primary/90">
          7 dias de garantia · Cancele quando quiser
        </p>
        <PricingToggle
          isAnnual={isAnnual}
          onChange={(annual) => {
            onToggle(annual);
            onToggleTrack?.(annual);
          }}
        />
      </motion.div>
    </section>
  );
}
