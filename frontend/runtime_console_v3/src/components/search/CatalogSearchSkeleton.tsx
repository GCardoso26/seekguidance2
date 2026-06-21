import { CardGridSkeleton } from "@/components/cards/CardGridSkeleton";

export function CatalogSearchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-11 max-w-xl animate-pulse rounded-md bg-muted" />
      <CardGridSkeleton count={12} />
    </div>
  );
}
