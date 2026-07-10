"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TcgLogoImage } from "@/components/judge/TcgLogoImage";
import { getTcgTheme } from "@/styles/tcg-theme";
import { TCG_OPTIONS, type TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

const SHOWCASE_TCGS: TcgType[] = ["magic", "yugioh", "pokemon", "digimon", "lorcana", "flesh_and_blood"];

export function LandingTcgShowcase() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {SHOWCASE_TCGS.map((id) => {
        const option = TCG_OPTIONS.find((g) => g.id === id);
        const theme = getTcgTheme(id);
        const available = option?.enabled ?? false;
        const href = available ? `/judge?tcg=${id}` : undefined;

        const card = (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
              "judge-card group relative flex flex-col items-center rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 text-center transition",
              available
                ? "cursor-pointer hover:border-[var(--tcg-border)] hover:shadow-[0_0_24px_hsl(var(--tcg-accent)/0.25)]"
                : "opacity-75",
            )}
            style={
              {
                "--tcg-accent": theme.accent,
                "--tcg-border": `hsl(${theme.accent} / 0.4)`,
              } as CSSProperties
            }
          >
            <div className="mb-3 w-16">
              <TcgLogoImage tcgId={id} variant="compact" selected={available} />
            </div>
            <p className="text-sm font-semibold text-foreground">{option?.label ?? id}</p>
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                available ? "text-success" : "text-slate-500",
              )}
            >
              {available ? "Disponível" : "Em breve"}
            </p>
            {available && (
              <span className="mt-2 text-xs font-semibold text-warning opacity-0 transition group-hover:opacity-100">
                Jogar →
              </span>
            )}
          </motion.div>
        );

        return href ? (
          <Link key={id} href={href} aria-label={`Jogar ${option?.label}`}>
            {card}
          </Link>
        ) : (
          <div key={id} aria-label={`${option?.label} em breve`}>
            {card}
          </div>
        );
      })}
    </div>
  );
}
