"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useWishlist } from "@/hooks/useWishlist";

export function WishlistBadge() {
  const { user } = useJudgeAuth();
  const { data } = useWishlist();
  const count = user ? (data?.total ?? 0) : 0;

  if (!user) return null;

  return (
    <Link
      href="/wishlist"
      data-testid="wishlist-header-badge"
      className="relative rounded-lg p-2 text-luxury-mist hover:bg-white/5 hover:text-luxury-gold"
      aria-label={`Wishlist${count ? `, ${count} itens` : ""}`}
    >
      <Heart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-luxury-gold px-1 text-[10px] font-bold text-luxury-onyx">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
