"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { CpfCheckoutModal } from "@/components/kyc/CpfCheckoutModal";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useToggleWishlist, useWishlistProductIds } from "@/hooks/useWishlist";
import type { ShopProduct } from "@/lib/marketplace-shop";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  product?: ShopProduct;
  className?: string;
  size?: "sm" | "md";
};

export function WishlistButton({ productId, product, className, size = "md" }: Props) {
  const { user } = useJudgeAuth();
  const savedIds = useWishlistProductIds();
  const toggle = useToggleWishlist();
  const router = useRouter();
  const { data: accountStatus } = useAccountStatus();
  const [cpfOpen, setCpfOpen] = useState(false);

  const isSaved = savedIds.has(productId);
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const pad = size === "sm" ? "p-1.5" : "p-2";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/marketplace";
      router.push(`/entrar?next=${encodeURIComponent(next)}`);
      return;
    }

    if (!isSaved && needsCpfCompletion(accountStatus)) {
      setCpfOpen(true);
      return;
    }

    void toggle.mutateAsync({ productId, product, isSaved });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={toggle.isPending}
        aria-label={isSaved ? "Remover da wishlist" : "Adicionar à wishlist"}
        aria-pressed={isSaved}
        data-testid={`wishlist-button-${productId}`}
        className={cn(
          "rounded-full border border-border bg-black/50 text-white backdrop-blur transition hover:border-luxury-gold/50 hover:text-primary",
          pad,
          isSaved && "border-rose-500/50 bg-rose-500/20 text-rose-400",
          toggle.isPending && "opacity-60",
          className,
        )}
      >
        <Heart className={cn(iconSize, isSaved && "fill-current")} />
      </button>
      <CpfCheckoutModal open={cpfOpen} onClose={() => setCpfOpen(false)} />
    </>
  );
}
