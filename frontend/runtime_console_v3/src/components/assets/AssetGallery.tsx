"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import { ResponsiveImage } from "@/components/assets/ResponsiveImage";
import {
  SEALED_GALLERY_LABELS,
  type GalleryItem,
  type MediaType,
  type SealedGalleryShot,
} from "@/lib/assets";
import { cn } from "@/lib/utils";

type Props = {
  items: GalleryItem[];
  title?: string;
  mediaType?: MediaType;
  className?: string;
  /** Aspect for main stage — sealed 420×560 default */
  stageClassName?: string;
};

/**
 * Full gallery for sealed / accessories — front, back, side, open, contents, zoom.
 * Never a single lonely thumbnail.
 */
export function AssetGallery({
  items,
  title,
  mediaType = "SEALED_GALLERY",
  className,
  stageClassName,
}: Props) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (!items.length) return;
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + items.length) % items.length);
    },
    [items.length],
  );

  if (!items.length) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground", className)}>
        Galeria indisponível — aguardando assets do Product Catalog / Asset Service.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} onKeyDown={onKey} tabIndex={0} role="region" aria-label={title ?? "Galeria"}>
      {title ? <h3 className="text-sm font-semibold text-foreground">{title}</h3> : null}
      <div
        className={cn(
          "relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[var(--game-card-radius,0.75rem)] border border-border bg-muted/20",
          stageClassName,
        )}
      >
        <ResponsiveImage
          src={current.url}
          alt={current.meta?.alt ?? current.label ?? title ?? "Produto"}
          mediaType={mediaType}
          meta={current.meta}
          width={420}
          height={560}
          zoomOnHover
          className="h-auto w-full object-contain"
          sizes="(max-width: 640px) 90vw, 420px"
        />
        {current.label || current.shot ? (
          <p className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
            {current.label ??
              (current.shot && current.shot in SEALED_GALLERY_LABELS
                ? SEALED_GALLERY_LABELS[current.shot as SealedGalleryShot]
                : current.shot)}
          </p>
        ) : null}
      </div>
      <ul className="flex flex-wrap gap-2" role="list">
        {items.map((item, idx) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActive(idx)}
              aria-pressed={idx === active}
              className={cn(
                "relative h-16 w-12 overflow-hidden rounded border transition",
                idx === active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border opacity-80 hover:opacity-100",
              )}
            >
              <ResponsiveImage
                src={item.url}
                alt=""
                mediaType="SEALED_PRODUCT"
                fill
                listQuality
                className="object-cover"
                sizes="48px"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Build gallery slots from sparse URLs — fills missing shots with primary. */
export function buildSealedGallery(
  primaryUrl: string | null | undefined,
  extras: Array<{ url: string; shot?: SealedGalleryShot; label?: string }> = [],
): GalleryItem[] {
  const items: GalleryItem[] = [];
  if (primaryUrl) {
    items.push({ id: "primary", url: primaryUrl, shot: "front", label: "Frente" });
  }
  extras.forEach((ex, i) => {
    if (!ex.url || ex.url === primaryUrl) return;
    items.push({
      id: `g-${i}-${ex.shot ?? i}`,
      url: ex.url,
      shot: ex.shot,
      label: ex.label,
    });
  });
  // Ensure at least conceptual shots exist (same primary as placeholder until Asset Service fills)
  if (primaryUrl && items.length === 1) {
    (["back", "side", "zoom"] as SealedGalleryShot[]).forEach((shot) => {
      items.push({
        id: `placeholder-${shot}`,
        url: primaryUrl,
        shot,
        label: `${SEALED_GALLERY_LABELS[shot]} (em sincronização)`,
      });
    });
  }
  return items;
}
