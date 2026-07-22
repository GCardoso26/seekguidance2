import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Asset Pipeline V2 — content-specific skeletons. */

export function CardAssetSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("aspect-[63/88] w-full rounded-lg skeleton-shimmer", className)}
      data-testid="asset-skeleton-card"
    />
  );
}

export function BoosterAssetSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)} data-testid="asset-skeleton-booster">
      <Skeleton className="mx-auto aspect-[420/560] w-full max-w-[280px] rounded-xl skeleton-shimmer" />
      <div className="flex justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-10 rounded skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}

export function MarketplaceAssetSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      data-testid="asset-skeleton-marketplace"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="space-y-2">
          <Skeleton className="aspect-[420/560] w-full rounded-xl skeleton-shimmer" />
          <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
          <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
        </li>
      ))}
    </ul>
  );
}

export function HeroAssetSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("min-h-[min(72vh,640px)] w-full rounded-none skeleton-shimmer", className)}
      data-testid="asset-skeleton-hero"
    />
  );
}

export function CollectionAssetSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul
      className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6"
      data-testid="asset-skeleton-collection"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <CardAssetSkeleton />
        </li>
      ))}
    </ul>
  );
}

export function DeckAssetSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)} data-testid="asset-skeleton-deck">
      <Skeleton className="aspect-[3/4] w-full max-w-[240px] rounded-xl skeleton-shimmer" />
      <Skeleton className="h-5 w-40 skeleton-shimmer" />
      <Skeleton className="h-3 w-28 skeleton-shimmer" />
    </div>
  );
}

export function ProfileAssetSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)} data-testid="asset-skeleton-profile">
      <Skeleton className="h-40 w-full rounded-xl skeleton-shimmer md:h-52" />
      <div className="flex items-center gap-4 px-2">
        <Skeleton className="h-16 w-16 rounded-full skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40 skeleton-shimmer" />
          <Skeleton className="h-3 w-24 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
