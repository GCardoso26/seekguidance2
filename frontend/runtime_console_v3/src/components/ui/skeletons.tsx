import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/cards/CardGridSkeleton";

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8" data-testid="profile-skeleton">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48 skeleton-shimmer" />
          <Skeleton className="h-4 w-32 skeleton-shimmer" />
          <Skeleton className="h-4 w-24 skeleton-shimmer" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 skeleton-shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] rounded-lg skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}

export function DecksSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8" data-testid="decks-skeleton">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 skeleton-shimmer" />
        <Skeleton className="h-10 w-32 skeleton-shimmer" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border p-4">
            <Skeleton className="h-6 w-full skeleton-shimmer" />
            <Skeleton className="h-4 w-2/3 skeleton-shimmer" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full skeleton-shimmer" />
              <Skeleton className="h-6 w-16 rounded-full skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="container mx-auto space-y-4 px-4 py-6">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64 skeleton-shimmer" />
        <Skeleton className="h-10 w-32 skeleton-shimmer" />
      </div>
      <CardGridSkeleton count={12} />
    </div>
  );
}

export function GameHubSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12" data-testid="game-hub-skeleton">
      <Skeleton className="h-4 w-32 skeleton-shimmer" />
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <Skeleton className="h-20 w-20 rounded-lg skeleton-shimmer" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48 skeleton-shimmer" />
          <Skeleton className="h-4 w-64 skeleton-shimmer" />
        </div>
      </div>
      <div className="mt-8 flex gap-3">
        <Skeleton className="h-11 w-36 skeleton-shimmer" />
        <Skeleton className="h-11 w-36 skeleton-shimmer" />
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl skeleton-shimmer" />
        <Skeleton className="h-24 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

export { CardGridSkeleton };
