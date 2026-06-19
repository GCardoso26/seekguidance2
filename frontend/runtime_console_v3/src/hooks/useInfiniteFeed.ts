"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CommunityPost, PostSort, TopPeriod } from "@/types/post";

export type FeedPage = {
  items: CommunityPost[];
  nextCursor: string | null;
};

async function fetchFeedPage(params: URLSearchParams): Promise<FeedPage> {
  const res = await fetch(`/api/social/posts?${params}`, { cache: "no-store" });
  if (!res.ok) return { items: [], nextCursor: null };
  const json = (await res.json()) as FeedPage | CommunityPost[];
  if (Array.isArray(json)) return { items: json, nextCursor: null };
  return { items: json.items ?? [], nextCursor: json.nextCursor ?? null };
}

export function useInfiniteFeed(opts?: {
  communityId?: string;
  authorId?: string;
  tag?: string;
  following?: boolean;
  sort?: PostSort;
  period?: TopPeriod;
  limit?: number;
}) {
  const sort = opts?.sort ?? "hot";
  const period = opts?.period ?? "all";
  const limit = opts?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: ["infinite-feed", opts?.communityId, opts?.authorId, opts?.tag, opts?.following, sort, period],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ sort, limit: String(limit) });
      if (opts?.communityId) params.set("community_id", opts.communityId);
      if (opts?.authorId) params.set("author_id", opts.authorId);
      if (opts?.tag) params.set("tag", opts.tag);
      if (opts?.following) params.set("following", "true");
      if (sort === "top" && period !== "all") params.set("period", period);
      if (pageParam) params.set("cursor", String(pageParam));
      return fetchFeedPage(params);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
