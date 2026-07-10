"use client";

import { Star } from "lucide-react";

type Props = {
  rating: number;
  size?: "sm" | "md" | "lg";
  max?: number;
};

const sizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function StarRating({ rating, size = "md", max = 5 }: Props) {
  const cls = sizeMap[size];
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} de ${max} estrelas`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating > i && rating < i + 1;
        return (
          <Star
            key={i}
            className={`${cls} ${filled || half ? "fill-amber-400 text-warning" : "text-muted-foreground/40"}`}
          />
        );
      })}
    </div>
  );
}
