"use client";

import { useState } from "react";
import { TCG_THEMES } from "@/constants/luxury/tcgThemes";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";
import { cn } from "@/lib/utils";

function TcgLogo({ short, accent, active }: { short: string; accent: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-xl border transition-all duration-500",
        active
          ? "border-current bg-current/10 shadow-lg"
          : "border-white/10 bg-white/5 text-luxury-silver",
      )}
      style={active ? { color: accent, borderColor: `${accent}66` } : undefined}
    >
      <span className="text-xs font-semibold tracking-widest">{short}</span>
    </div>
  );
}

export function TcgGallerySection() {
  const [hovered, setHovered] = useState<string | null>(null);
  const items = [...TCG_THEMES, ...TCG_THEMES];

  return (
    <section className="relative overflow-hidden py-28 lg:py-36">
      <div className="mx-auto mb-16 max-w-7xl px-6 text-center lg:px-8">
        <RevealOnScroll>
          <p className="mb-4 text-xs tracking-[0.3em] text-luxury-gold uppercase">Ecossistema</p>
          <h2 className="text-luxury-frost">14 universos. Uma autoridade.</h2>
        </RevealOnScroll>
      </div>

      <div className="relative">
        <div className="flex animate-marquee gap-12 whitespace-nowrap">
          {items.map((tcg, i) => {
            const active = hovered === `${tcg.id}-${i}`;
            return (
              <div
                key={`${tcg.id}-${i}`}
                className="flex shrink-0 flex-col items-center gap-4 px-4"
                onMouseEnter={() => setHovered(`${tcg.id}-${i}`)}
                onMouseLeave={() => setHovered(null)}
              >
                <TcgLogo short={tcg.short} accent={tcg.accent} active={active} />
                <span
                  className={cn(
                    "text-xs tracking-[0.25em] uppercase transition-colors duration-500",
                    active ? "text-luxury-frost" : "text-luxury-mist",
                  )}
                  style={active ? { color: tcg.accent } : undefined}
                >
                  {tcg.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
