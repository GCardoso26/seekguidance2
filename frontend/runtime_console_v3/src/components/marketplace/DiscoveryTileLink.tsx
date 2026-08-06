"use client";

import Link from "next/link";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import type { DiscoveryTile } from "@/lib/marketplace-discovery";
import { cn } from "@/lib/utils";

type Props = {
  tile: DiscoveryTile;
  variant?: "category" | "feature";
  className?: string;
};

/** Tile clicável da vitrine — shell comercial (sem game-portal). */
export function DiscoveryTileLink({ tile, variant = "feature", className }: Props) {
  const isCategory = variant === "category";

  return (
    <Link
      href={tile.href}
      data-testid={`discovery-tile-${tile.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      onClick={() => {
        void trackEvent("discovery_ctr", { rail: tile.rail, href: tile.href, id: tile.id });
        if (tile.rail === "categories") {
          void trackEvent("category_ctr", { href: tile.href, source: "home_discovery" });
        }
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted/40",
          isCategory ? "aspect-[4/3]" : "aspect-[16/10]",
        )}
      >
        <Image
          src={tile.imageUrl}
          alt=""
          fill
          sizes={isCategory ? "(max-width:640px) 50vw, 20vw" : "(max-width:640px) 90vw, 30vw"}
          className={cn(
            "transition-transform duration-base group-hover:scale-[1.02]",
            tile.imageUrl.endsWith(".svg") ? "object-contain p-6" : "object-cover",
          )}
          unoptimized={tile.imageUrl.endsWith(".svg")}
        />
        {tile.accent ? (
          <span
            className="absolute left-0 top-0 h-full w-1"
            style={{ backgroundColor: tile.accent }}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3 sm:p-4">
        <p className="line-clamp-2 text-body font-semibold text-foreground group-hover:text-primary">
          {tile.title}
        </p>
        <p className="line-clamp-1 text-caption text-muted-foreground">{tile.subtitle}</p>
      </div>
    </Link>
  );
}
