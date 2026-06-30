export function ProductSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
      data-testid="marketplace-products-skeleton"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <div className="aspect-square bg-white/10" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
            <div className="h-5 w-1/3 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
