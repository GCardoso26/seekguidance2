"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useMemo, useState } from "react";
import { shouldBypassImageOptimizer } from "@/lib/format-currency";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type CardImageProps = Omit<ImageProps, "onError" | "onLoad" | "placeholder" | "blurDataURL" | "src"> & {
  src?: string | null;
  fallbackLabel?: string;
  /** Qualidade JPEG/WebP — listas usam 60 por padrão. */
  listQuality?: boolean;
};

function buildPlaceholderSvg(label: string): string {
  const text = (label || "Card").slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560"><rect width="400" height="560" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="16" font-family="system-ui,sans-serif">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function CardImage({
  src,
  alt,
  className,
  style,
  fallbackLabel,
  fill,
  listQuality = false,
  quality,
  priority,
  unoptimized: unoptimizedProp,
  ...props
}: CardImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const blurDataURL = useMemo(() => buildPlaceholderSvg(alt || fallbackLabel || "Card"), [alt, fallbackLabel]);
  const unoptimized = unoptimizedProp ?? shouldBypassImageOptimizer(src ?? "");

  const handleError = useCallback(() => {
    setError(true);
    if (src) {
      try {
        const host = new URL(
          src,
          typeof window !== "undefined" ? window.location.origin : "https://judgetcg.com",
        ).host;
        void trackEvent("image_failure", { url_host: host });
      } catch {
        void trackEvent("image_failure", { url_host: "unknown" });
      }
    }
    if (!alt?.trim()) {
      void trackEvent("image_failure", { reason: "missing_alt" });
    }
  }, [src, alt]);
  const handleLoad = useCallback(() => setLoaded(true), []);

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
        <span className="line-clamp-3 px-2 text-center text-xs">{fallbackLabel ?? alt ?? "Carta"}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", fill && "h-full w-full")}>
      {!loaded && (
        <div
          className={cn("absolute inset-0 animate-pulse rounded-lg bg-muted/50", className)}
          aria-hidden
        />
      )}
      <Image
        src={src}
        alt={alt || "Imagem da carta"}
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={style}
        fill={fill}
        onError={handleError}
        onLoad={handleLoad}
        placeholder="blur"
        blurDataURL={blurDataURL}
        quality={quality ?? (listQuality || !priority ? 60 : 75)}
        loading={priority ? "eager" : "lazy"}
        sizes={props.sizes ?? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"}
        priority={priority}
        unoptimized={unoptimized}
        {...props}
      />
    </div>
  );
}
