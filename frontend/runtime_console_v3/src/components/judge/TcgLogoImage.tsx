"use client";

import Image from "next/image";
import { useState } from "react";
import { getTcgLogo, getTcgLogoDimensions } from "@/lib/tcg-logos";
import { getTcgTheme } from "@/styles/tcg-theme";
import type { TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  tcgId: TcgType;
  variant?: "default" | "compact";
  selected?: boolean;
  priority?: boolean;
  className?: string;
};

export function TcgLogoImage({
  tcgId,
  variant = "default",
  selected = false,
  priority = false,
  className,
}: Props) {
  const [failed, setFailed] = useState(false);
  const logo = getTcgLogo(tcgId);
  const theme = getTcgTheme(tcgId);
  const { width, height } = getTcgLogoDimensions(variant);
  const compact = variant === "compact";

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
        className,
      )}
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          "h-auto w-full object-contain drop-shadow-md transition-all duration-200",
          "group-hover:scale-105 group-hover:drop-shadow-lg",
          selected && "scale-[1.02] drop-shadow-[0_0_14px_rgba(251,191,36,0.5)]",
        )}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
