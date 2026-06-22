import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-luxury-gold transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
