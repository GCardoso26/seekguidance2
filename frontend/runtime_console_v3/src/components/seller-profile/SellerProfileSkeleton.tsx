import { Skeleton } from "@/components/ui/skeleton";

export function SellerProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
