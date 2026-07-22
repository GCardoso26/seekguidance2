"use client";

import type { ReactNode } from "react";
import { ResponsiveImage } from "@/components/assets/ResponsiveImage";
import type { AssetMetaView } from "@/lib/assets";
import { cn } from "@/lib/utils";

type HeroAssetProps = {
  desktopSrc?: string | null;
  mobileSrc?: string | null;
  fallbackSrc?: string | null;
  overlaySrc?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  meta?: AssetMetaView;
  children?: ReactNode;
};

/**
 * Hero assets — desktop / mobile / overlay / fallback.
 * Video structure is handled by parent (GameHero); this is the still layer.
 */
export function HeroAssetFrame({
  desktopSrc,
  mobileSrc,
  fallbackSrc,
  overlaySrc,
  alt,
  priority = true,
  className,
  meta,
  children,
}: HeroAssetProps) {
  const desktop = desktopSrc || fallbackSrc;
  const mobile = mobileSrc || desktopSrc || fallbackSrc;

  return (
    <div className={cn("absolute inset-0 z-0", className)} aria-hidden={!children}>
      {desktop ? (
        <div className="absolute inset-0 hidden md:block">
          <ResponsiveImage
            src={desktop}
            alt={alt}
            mediaType="GAME_HERO"
            meta={meta}
            fill
            priority={priority}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ) : null}
      {mobile ? (
        <div className="absolute inset-0 md:hidden">
          <ResponsiveImage
            src={mobile}
            alt={alt}
            mediaType="GAME_HERO_MOBILE"
            meta={meta}
            fill
            priority={priority}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ) : null}
      {overlaySrc ? (
        <div className="pointer-events-none absolute inset-0">
          <ResponsiveImage
            src={overlaySrc}
            alt=""
            mediaType="HERO_OVERLAY"
            fill
            className="object-cover opacity-60"
            sizes="100vw"
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
