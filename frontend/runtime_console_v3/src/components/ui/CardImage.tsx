"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type CardImageProps = Omit<ImageProps, "onError" | "onLoad"> & {
  fallbackLabel?: string;
};

export function CardImage({
  src,
  alt,
  className,
  style,
  fallbackLabel,
  fill,
  ...props
}: CardImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted/40 text-muted-foreground",
          className,
        )}
        style={style}
        role="img"
        aria-label={alt || "Imagem da carta indisponível"}
      >
        <span className="px-2 text-center text-xs">{fallbackLabel ?? alt ?? "Carta"}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", fill && "h-full w-full")}>
      {!loaded && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse rounded-lg bg-muted/50",
            className,
          )}
          aria-hidden
        />
      )}
      <Image
        src={src}
        alt={alt || "Imagem da carta"}
        className={cn(className, !loaded && "opacity-0")}
        style={style}
        fill={fill}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        {...props}
      />
    </div>
  );
}
