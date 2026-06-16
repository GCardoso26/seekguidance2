"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useState } from "react";
import { getTcgLogo, getTcgLogoDimensions } from "@/lib/tcg-logos";
import { getTcgTheme } from "@/styles/tcg-theme";
import type { TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

export interface TCGLogoProps {
  tcgId: TcgType;
  size?: number;
  monochrome?: boolean;
  selected?: boolean;
  priority?: boolean;
  className?: string;
  /** Alias de variant legado */
  variant?: "default" | "compact";
}

/**
 * Logo de TCG com fallback emoji, modo monocromático e hover com acento do tema.
 */
export function TCGLogo({
  tcgId,
  size,
  monochrome = false,
  selected = false,
  priority = false,
  className,
  variant = "default",
}: TCGLogoProps) {
  const [failed, setFailed] = useState(false);
  const logo = getTcgLogo(tcgId);
  const theme = getTcgTheme(tcgId);
  const dims = getTcgLogoDimensions(variant === "compact" ? "compact" : "default");
  const width = size ?? dims.width;
  const height = size ?? dims.height;
  const compact = variant === "compact" || (size != null && size <= 64);

  if (failed) {
    return (
      <span
        className={cn(
          "flex aspect-square w-full items-center justify-center drop-shadow-md",
          compact ? "text-xl" : "text-2xl",
          className,
        )}
        aria-hidden
      >
        {theme.emoji}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex aspect-square w-full items-center justify-center",
        compact ? "max-w-[48px]" : "max-w-[72px]",
        "group/logo",
        className,
      )}
      style={
        selected
          ? ({ filter: `drop-shadow(0 0 12px hsl(${theme.accent} / 0.55))` } as CSSProperties)
          : undefined
      }
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "h-auto w-full object-contain transition-all duration-200",
          "group-hover/logo:scale-105",
          monochrome &&
            "brightness-0 invert opacity-80 group-hover/logo:opacity-100 group-hover/logo:[filter:brightness(1)_invert(0)]",
          !monochrome &&
            "drop-shadow-md group-hover/logo:drop-shadow-[0_0_14px_hsl(var(--tcg-accent)/0.45)]",
          selected && !monochrome && "scale-[1.02]",
        )}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
