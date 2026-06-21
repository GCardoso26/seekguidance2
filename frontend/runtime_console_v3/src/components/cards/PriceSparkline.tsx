import { cn } from "@/lib/utils";

interface PriceSparklineProps {
  trend: number;
  className?: string;
}

function generatePath(trend: number): string {
  const width = 60;
  const height = 20;
  const midY = height / 2;

  if (trend === 0) {
    return `M 0 ${midY} L ${width} ${midY}`;
  }

  const isUp = trend > 0;
  const amplitude = Math.min(Math.abs(trend) * 0.5, height / 2 - 2);

  return isUp
    ? `M 0 ${midY + amplitude} Q ${width * 0.3} ${midY - amplitude} ${width * 0.5} ${midY} T ${width} ${midY - amplitude}`
    : `M 0 ${midY - amplitude} Q ${width * 0.3} ${midY + amplitude} ${width * 0.5} ${midY} T ${width} ${midY + amplitude}`;
}

export function PriceSparkline({ trend, className }: PriceSparklineProps) {
  const color = trend >= 0 ? "#22C55E" : "#EF4444";
  const endY = trend >= 0 ? 2 : 18;

  return (
    <svg width="60" height="20" viewBox="0 0 60 20" className={cn(className)} aria-hidden="true">
      <path
        d={generatePath(trend)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="58" cy={endY} r="2" fill={color} />
    </svg>
  );
}
