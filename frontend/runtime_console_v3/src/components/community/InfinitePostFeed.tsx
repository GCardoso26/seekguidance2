"use client";

import { useEffect, useRef } from "react";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import { PostCard } from "@/components/community/PostCard";
import { FeedPostSkeleton } from "@/components/community/FeedPostSkeleton";
import type { PostSort, TopPeriod } from "@/types/post";

type Props = {
  sort: PostSort;
  period: TopPeriod;
  tag?: string;
  following?: boolean;
  communityId?: string;
};

export function InfinitePostFeed({ sort, period, tag, following, communityId }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteFeed({
    sort,
    period,
    tag,
    following,
    communityId,
  });

  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <FeedPostSkeleton />
        <FeedPostSkeleton />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro!</p>
        <p className="mt-2 text-sm text-muted-foreground/70">Compartilhe deck tech, resultados de torneio ou dúvidas de regras.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={sentinelRef} className="h-4" aria-hidden />
      {isFetchingNextPage && (
        <div className="space-y-4">
          <FeedPostSkeleton />
        </div>
      )}
    </div>
  );
}
