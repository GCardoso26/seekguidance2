"use client";

import { Badge } from "@/components/ui/badge";
import { StoreRatingInline } from "@/components/store/StoreRatingBadge";

type Props = {
  verificationStatus?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  acceptsPix?: boolean | null;
  acceptsCard?: boolean | null;
  compact?: boolean;
  className?: string;
};

/** Sprint 3 — sinais observáveis de confiança (sem inventar nota). */
export function StoreTrustChips({
  verificationStatus,
  averageRating,
  reviewCount,
  acceptsPix,
  acceptsCard,
  compact = false,
  className = "",
}: Props) {
  const verified = verificationStatus === "verified";
  const reviews = Number(reviewCount ?? 0);
  const rating = Number(averageRating ?? 0);
  const gap = compact ? "gap-1" : "gap-1.5";

  return (
    <div className={`flex flex-wrap items-center ${gap} ${className}`} data-testid="store-trust-chips">
      {verified && (
        <Badge variant="success" className={compact ? "text-[10px] px-1.5 py-0" : undefined}>
          Verificada
        </Badge>
      )}
      {reviews > 0 ? (
        <StoreRatingInline rating={rating} count={reviews} />
      ) : (
        <span className="text-caption text-muted-foreground">Nova loja</span>
      )}
      {acceptsPix && (
        <Badge variant="secondary" className={compact ? "text-[10px] px-1.5 py-0" : undefined}>
          PIX
        </Badge>
      )}
      {acceptsCard && (
        <Badge variant="secondary" className={compact ? "text-[10px] px-1.5 py-0" : undefined}>
          Cartão
        </Badge>
      )}
    </div>
  );
}
