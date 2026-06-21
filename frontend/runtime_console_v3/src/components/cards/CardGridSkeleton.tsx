import { Skeleton } from "@/components/ui/skeleton";

export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      aria-busy="true"
      aria-label="Carregando cartas"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-xl border border-border bg-card p-3">
          <Skeleton className="aspect-[63/88] rounded-lg" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <Skeleton className="mt-2 h-3 w-8 rounded-full" />
          <Skeleton className="mt-auto h-6 w-full" />
        </div>
      ))}
    </div>
  );
}
