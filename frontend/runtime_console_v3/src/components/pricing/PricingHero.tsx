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
    <section className="relative overflow-hidden py-20 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #f59e0b 0%, transparent 40%), radial-gradient(circle at 80% 70%, #8b5cf6 0%, transparent 35%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 1px, transparent 12px)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">
          Escolha seu <span className="text-amber-400">Plano</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400 md:text-xl">
          Do casual ao competitivo. Encontre o plano que combina com seu estilo de jogo.
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
