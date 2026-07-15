"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import type { ShopProduct } from "@/lib/marketplace-shop";
import {
  invalidateWishlistQueryKeys,
  normalizeWishlistResponse,
  wishlistIdSet,
  WISHLIST_QUERY_KEY,
} from "@/lib/wishlist";
import type { WishlistResponse } from "@/types/wishlist";

const STALE_TIME = 5 * 60 * 1000;

async function fetchWishlist(): Promise<WishlistResponse> {
  const res = await fetch("/api/wishlist");
  if (res.status === 401) {
    return { items: [], total: 0 };
  }
  if (!res.ok) throw new Error("wishlist_fetch_failed");
  return normalizeWishlistResponse(await res.json());
}

export function useWishlist() {
  const { user, loading: authLoading } = useJudgeAuth();
  return useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: fetchWishlist,
    enabled: Boolean(user) && !authLoading,
    staleTime: STALE_TIME,
    retry: false,
  });
}

export function useWishlistProductIds() {
  const { data } = useWishlist();
  return wishlistIdSet(data?.items ?? []);
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useJudgeAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      product,
      isSaved,
    }: {
      productId: string;
      product?: ShopProduct;
      isSaved: boolean;
    }) => {
      if (!user) {
        const next =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/marketplace";
        router.push(`/entrar?next=${encodeURIComponent(next)}`);
        return { skipped: true as const };
      }

      if (isSaved) {
        const res = await fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("wishlist_remove_failed");
        return { action: "remove" as const, productId };
      }

      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, product }),
      });
      if (!res.ok) throw new Error("wishlist_add_failed");
      return { action: "add" as const, productId };
    },
    onSuccess: (result) => {
      if (result && "skipped" in result) return;
      void queryClient.invalidateQueries({ queryKey: invalidateWishlistQueryKeys()[0] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("wishlist_remove_failed");
      return productId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invalidateWishlistQueryKeys()[0] });
    },
  });
}
