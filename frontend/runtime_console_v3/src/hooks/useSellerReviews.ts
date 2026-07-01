"use client";

import { useQuery } from "@tanstack/react-query";

export type SellerReview = {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  condition_accuracy?: boolean | null;
  shipping_speed?: number | null;
  communication?: number | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  reviewer_name: string;
  created_at?: string | null;
  store_response?: string | null;
};

export type SellerReviewsResponse = {
  reviews: SellerReview[];
  total: number;
  page: number;
  limit: number;
  rating_summary: {
    average: number;
    total: number;
    distribution: Record<string, number>;
  };
};

type ReviewSort = "newest" | "highest" | "lowest" | "helpful";

export function useSellerReviews(
  username: string,
  options: { sort?: ReviewSort; verifiedOnly?: boolean } = {},
) {
  const { sort = "newest", verifiedOnly = false } = options;

  return useQuery({
    queryKey: ["seller-reviews", username, sort, verifiedOnly],
    queryFn: async (): Promise<SellerReviewsResponse> => {
      const params = new URLSearchParams({ sort, verified_only: String(verifiedOnly) });
      const res = await fetch(
        `/api/marketplace/sellers/${encodeURIComponent(username)}/reviews?${params}`,
      );
      if (!res.ok) throw new Error("reviews_fetch_failed");
      return res.json();
    },
    staleTime: 60_000,
    enabled: Boolean(username) && process.env.NEXT_PUBLIC_FEATURE_REVIEWS !== "false",
  });
}
