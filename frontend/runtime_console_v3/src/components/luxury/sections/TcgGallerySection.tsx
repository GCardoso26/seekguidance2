"use client";

import { useState } from "react";
import { FEATURED_TCG_IDS, TCG_THEMES } from "@/constants/luxury/tcgThemes";
import { TCG_GALLERY_COPY } from "@/constants/luxury/landingCopy";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";
import { cn } from "@/lib/utils";

function TcgLogo({
  short,
  accent,
  active,
  size = "md",
}: {
  short: string;
  accent: string;
  active: boolean;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border transition-all duration-500",
        size === "lg" ? "h-20 w-20" : "h-16 w-16",
        active
          ? "border-current bg-current/10 shadow-lg"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
      style={active ? { color: accent, borderColor: `${accent}66` } : undefined}
    >
      <span className={cn("font-semibold tracking-widest", size === "lg" ? "text-sm" : "text-xs")}>
        {short}
      </span>
    </div>
  );
}

export function TcgGallerySection() {
  const [hovered, setHovered] = useState<string | null>(null);
  const featured = TCG_THEMES.filter((t) => FEATURED_TCG_IDS.includes(t.id as (typeof FEATURED_TCG_IDS)[number]));
  const others = TCG_THEMES.filter((t) => !FEATURED_TCG_IDS.includes(t.id as (typeof FEATURED_TCG_IDS)[number]));

  return (
    <section className="relative overflow-hidden py-28 lg:py-36">
      <div className="mx-auto mb-16 max-w-7xl px-6 text-center lg:px-8">
        <RevealOnScroll>
          <p className="mb-4 text-xs tracking-[0.3em] text-primary uppercase">
            {TCG_GALLERY_COPY.eyebrow}
          </p>
          <h2 className="mb-4 text-foreground">{TCG_GALLERY_COPY.title}</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">{TCG_GALLERY_COPY.subtitle}</p>
        </RevealOnScroll>
      </div>

      <div className="mx-auto mb-12 flex max-w-5xl flex-wrap items-center justify-center gap-8 px-6">
        {featured.map((tcg) => {
          const active = hovered === tcg.id;
          return (
            <div
              key={tcg.id}
              className="flex flex-col items-center gap-3"
              onMouseEnter={() => setHovered(tcg.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <TcgLogo short={tcg.short} accent={tcg.accent} active={active} size="lg" />
              <div className="text-center">
                <span
                  className={cn(
                    "block text-sm tracking-wide transition-colors duration-500",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                  style={active ? { color: tcg.accent } : undefined}
                >
                  {tcg.name}
                </span>
                {tcg.description && (
                  <span className="mt-1 block text-xs text-muted-foreground">{tcg.description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative">
        <div className="flex animate-marquee gap-10 whitespace-nowrap">
          {[...others, ...others].map((tcg, i) => {
            const active = hovered === `${tcg.id}-${i}`;
            return (
              <div
                key={`${tcg.id}-${i}`}
                className="flex shrink-0 flex-col items-center gap-3 px-3"
                onMouseEnter={() => setHovered(`${tcg.id}-${i}`)}
                onMouseLeave={() => setHovered(null)}
              >
                <TcgLogo short={tcg.short} accent={tcg.accent} active={active} />
                <span
                  className={cn(
                    "text-xs tracking-[0.2em] uppercase transition-colors duration-500",
                    active ? "text-foreground" : "text-muted-foreground",
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
