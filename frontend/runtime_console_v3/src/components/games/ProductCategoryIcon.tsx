"use client";

import Image from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";
import { categoryImageUrl, categoryLabel } from "@/lib/tcg-product-categories";
import { cn } from "@/lib/utils";

type Props = {
  categoryId: string;
  size?: number;
  className?: string;
  showLabel?: boolean;
};

export function ProductCategoryIcon({ categoryId, size = 32, className, showLabel }: Props) {
  const src = categoryImageUrl(categoryId);
  const [failed, setFailed] = useState(false);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="relative flex shrink-0 items-center justify-center rounded-lg bg-muted/50 p-1"
        style={{ width: size + 8, height: size + 8 }}
      >
        {!failed ? (
          <Image
            src={src}
            alt=""
            width={size}
            height={size}
            className="object-contain opacity-90"
            onError={() => setFailed(true)}
          />
        ) : (
          <Package className="h-5 w-5 text-muted-foreground" aria-hidden />
        )}
      </span>
      {showLabel && <span className="text-sm text-foreground">{categoryLabel(categoryId)}</span>}
    </span>
  );
}
