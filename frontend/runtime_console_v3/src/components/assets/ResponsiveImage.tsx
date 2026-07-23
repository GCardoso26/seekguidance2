"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useMemo, useState } from "react";
import { shouldBypassImageOptimizer, isUnusableImageSrc } from "@/lib/format-currency";
import { trackEvent } from "@/lib/analytics";
import {
  DEFAULT_SIZES_ATTR,
  type MediaType,
  lqipForMedia,
  type AssetMetaView,
} from "@/lib/assets";
import { cn } from "@/lib/utils";

type ResponsiveImageProps = Omit<
  ImageProps,
  "onError" | "onLoad" | "placeholder" | "blurDataURL" | "src"
> & {
  src?: string | null;
  mediaType?: MediaType;
  meta?: AssetMetaView;
  fallbackLabel?: string;
  listQuality?: boolean;
  /** Show zoom affordance on hover (CSS only). */
  zoomOnHover?: boolean;
};

/**
 * Unified responsive image — lazy by default, priority for heroes,
 * blur/LQIP, never loads "original" unless that's the only src passed.
 */
export function ResponsiveImage({
  src,
  alt,
  className,
  style,
  mediaType = "CARD",
  meta,
  fallbackLabel,
  fill,
  listQuality = false,
  quality,
  priority,
  unoptimized: unoptimizedProp,
  zoomOnHover,
  sizes,
  ...props
}: ResponsiveImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const usableSrc = isUnusableImageSrc(src) ? null : src;

  const resolvedAlt = alt || meta?.alt || fallbackLabel || mediaType;
  const blurDataURL = useMemo(
    () => meta?.lqip || lqipForMedia(mediaType, resolvedAlt),
    [meta?.lqip, mediaType, resolvedAlt],
  );
  const unoptimized = unoptimizedProp ?? shouldBypassImageOptimizer(usableSrc ?? "");
  const sizesAttr = sizes ?? DEFAULT_SIZES_ATTR[mediaType] ?? DEFAULT_SIZES_ATTR.default;

  const handleError = useCallback(() => {
    setError(true);
    if (usableSrc) {
      try {
        const host = new URL(
          usableSrc,
          typeof window !== "undefined" ? window.location.origin : "https://judgetcg.com",
        ).host;
        void trackEvent("image_failure", { url_host: host, media_type: mediaType });
      } catch {
        void trackEvent("image_failure", { url_host: "unknown", media_type: mediaType });
      }
    }
  }, [usableSrc, mediaType]);

  if (error || !usableSrc) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted/40 text-muted-foreground",
          className,
        )}
        style={style}
        role="img"
        aria-label={resolvedAlt}
      >
        <span className="line-clamp-3 px-2 text-center text-xs">
          {fallbackLabel ?? resolvedAlt}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill && "h-full w-full",
        zoomOnHover && "group",
      )}
    >
      {!loaded && (
        <div
          className={cn("absolute inset-0 animate-pulse rounded-lg bg-muted/50", className)}
          aria-hidden
        />
      )}
      <Image
        src={usableSrc}
        alt={resolvedAlt}
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          zoomOnHover && "transition-transform duration-300 group-hover:scale-[1.04]",
        )}
        style={{
          ...style,
          ...(meta?.dominantColor ? { backgroundColor: meta.dominantColor } : null),
        }}
        fill={fill}
        onError={handleError}
        onLoad={() => setLoaded(true)}
        placeholder="blur"
        blurDataURL={blurDataURL}
        quality={quality ?? (listQuality || !priority ? 60 : 78)}
        loading={priority ? "eager" : "lazy"}
        sizes={sizesAttr}
        priority={priority}
        unoptimized={unoptimized}
        {...props}
      />
    </div>
  );
}
