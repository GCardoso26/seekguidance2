"use client";

/**
 * CardImage — thin wrapper over ResponsiveImage (Asset Pipeline V2).
 * Keeps existing import surface for cards / marketplace / collection.
 */
import { ResponsiveImage } from "@/components/assets/ResponsiveImage";
import type { MediaType } from "@/lib/assets";
import { normalizeCatalogImageUrl } from "@/lib/format-currency";
import type { ImageProps } from "next/image";

type CardImageProps = Omit<
  ImageProps,
  "onError" | "onLoad" | "placeholder" | "blurDataURL" | "src"
> & {
  src?: string | null;
  fallbackLabel?: string;
  listQuality?: boolean;
  /** Unified catalog: CARD | SEALED_* | ACCESSORY_* via ResponsiveImage. */
  mediaType?: MediaType;
};

export function CardImage({
  src,
  alt,
  fallbackLabel,
  listQuality = false,
  mediaType = "CARD",
  ...props
}: CardImageProps) {
  const normalized = src ? normalizeCatalogImageUrl(src) : src;
  return (
    <ResponsiveImage
      src={normalized}
      alt={alt}
      mediaType={mediaType}
      fallbackLabel={fallbackLabel}
      listQuality={listQuality}
      zoomOnHover
      {...props}
    />
  );
}
