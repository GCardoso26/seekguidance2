export function FeedPostSkeleton() {
  return (
    <div className="surface-card flex animate-pulse gap-3 rounded-xl p-4">
      <div className="h-16 w-8 rounded bg-muted" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="h-3 w-32 rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}
