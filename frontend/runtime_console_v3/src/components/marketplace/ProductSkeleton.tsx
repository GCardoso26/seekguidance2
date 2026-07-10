export function ProductSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
      data-testid="marketplace-products-skeleton"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden surface-card">
          <div className="aspect-square bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
