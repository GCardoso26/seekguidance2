import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  opacity?: number;
};

export function NoiseOverlay({ className, opacity = 0.03 }: Props) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <filter id="luxury-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#luxury-noise)" />
    </svg>
  );
}
